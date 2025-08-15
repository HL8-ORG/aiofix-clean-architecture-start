import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';

/**
 * @enum EventStatus
 * @description
 * 事件状态枚举，定义事件的生命周期状态。
 */
export enum EventStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * @enum EventType
 * @description
 * 事件类型枚举，定义系统支持的事件类型。
 */
export enum EventType {
  /** 用户相关事件 */
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ACTIVATED = 'user.activated',
  USER_DEACTIVATED = 'user.deactivated',

  /** 认证相关事件 */
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_PASSWORD_CHANGED = 'auth.password_changed',
  AUTH_TOKEN_REFRESHED = 'auth.token_refreshed',

  /** 租户相关事件 */
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_DELETED = 'tenant.deleted',

  /** 缓存相关事件 */
  CACHE_INVALIDATED = 'cache.invalidated',
  CACHE_CLEARED = 'cache.cleared',

  /** 系统相关事件 */
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_MAINTENANCE = 'system.maintenance',
}

/**
 * @interface EventMetadata
 * @description
 * 事件元数据接口，定义事件的附加信息。
 */
export interface EventMetadata {
  /** 事件ID */
  readonly eventId: string;
  /** 聚合根ID */
  readonly aggregateId: string;
  /** 聚合根类型 */
  readonly aggregateType: string;
  /** 事件类型 */
  readonly eventType: EventType;
  /** 事件版本 */
  readonly version: number;
  /** 事件状态 */
  readonly status: EventStatus;
  /** 事件数据 */
  readonly data: Record<string, any>;
  /** 事件元数据 */
  readonly metadata?: Record<string, any>;
  /** 用户ID */
  readonly userId?: string;
  /** 租户ID */
  readonly tenantId?: string;
  /** 会话ID */
  readonly sessionId?: string;
  /** 请求ID */
  readonly requestId?: string;
  /** 时间戳 */
  readonly timestamp: Date;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 更新时间 */
  readonly updatedAt: Date;
}

/**
 * @interface EventStoreConfig
 * @description
 * PostgreSQL事件存储配置接口。
 */
export interface EventStoreConfig {
  /** 是否启用事件存储 */
  enabled?: boolean;
  /** 数据库连接名称 */
  connectionName?: string;
  /** 事件表名 */
  eventTableName?: string;
  /** 快照表名 */
  snapshotTableName?: string;
  /** 最大事件大小（字节） */
  maxEventSize?: number;
  /** 批量插入大小 */
  batchSize?: number;
  /** 并发处理数 */
  concurrency?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用快照 */
  enableSnapshots?: boolean;
  /** 快照间隔 */
  snapshotInterval?: number;
  /** 是否启用事件发布 */
  enableEventPublishing?: boolean;
  /** 是否启用统计 */
  enableStats?: boolean;
  /** 是否启用事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
}

/**
 * @interface EventQuery
 * @description
 * 事件查询接口，定义查询条件。
 */
export interface EventQuery {
  /** 聚合根ID */
  aggregateId?: string;
  /** 聚合根类型 */
  aggregateType?: string;
  /** 事件类型 */
  eventType?: EventType | EventType[];
  /** 事件状态 */
  status?: EventStatus | EventStatus[];
  /** 用户ID */
  userId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 版本范围 */
  versionRange?: { min?: number; max?: number };
  /** 限制数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 排序字段 */
  orderBy?: string;
  /** 排序方向 */
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * @interface EventStoreStats
 * @description
 * 事件存储统计信息接口。
 */
export interface EventStoreStats {
  /** 总事件数 */
  totalEvents: number;
  /** 今日事件数 */
  todayEvents: number;
  /** 平均事件大小 */
  averageEventSize: number;
  /** 最大事件大小 */
  maxEventSize: number;
  /** 事件类型分布 */
  eventTypeDistribution: Record<EventType, number>;
  /** 事件状态分布 */
  eventStatusDistribution: Record<EventStatus, number>;
  /** 聚合根类型分布 */
  aggregateTypeDistribution: Record<string, number>;
  /** 最后事件时间 */
  lastEventTime: Date;
  /** 存储大小（字节） */
  storageSize: number;
  /** 活跃聚合根数 */
  activeAggregates: number;
}

/**
 * @class PostgresEventStore
 * @description
 * PostgreSQL事件存储服务，实现事件溯源的核心存储功能。
 * 
 * 主要功能包括：
 * 1. 事件存储和检索
 * 2. 聚合根事件流管理
 * 3. 事件快照支持
 * 4. 事件查询和过滤
 * 5. 事件发布和订阅
 * 6. 统计和监控
 * 7. 数据一致性保证
 * 
 * 设计原则：
 * - 事件不可变性：一旦存储的事件不能被修改
 * - 事件顺序性：同一聚合根的事件按版本顺序存储
 * - 事件完整性：所有事件都必须完整存储
 * - 性能优化：支持批量操作和索引优化
 */
@Injectable()
export class PostgresEventStore {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventStoreConfig;

  /**
   * 统计信息
   */
  private stats: EventStoreStats;

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 事件队列
   */
  private eventQueue: Array<{
    event: EventMetadata;
    resolve: (result: boolean) => void;
    reject: (error: Error) => void;
  }> = [];

  /**
   * 是否正在处理队列
   */
  private isProcessingQueue = false;

  constructor(
    @Inject('EVENT_STORE_CONFIG') config: EventStoreConfig,
    private readonly orm: MikroORM,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      connectionName: 'default',
      eventTableName: 'events',
      snapshotTableName: 'snapshots',
      maxEventSize: 1024 * 1024, // 1MB
      batchSize: 100,
      concurrency: 5,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableSnapshots: true,
      snapshotInterval: 100,
      enableEventPublishing: true,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();

    this.logger.info('PostgresEventStore initialized', LogContext.DATABASE);
  }

  /**
   * @method storeEvent
   * @description 存储单个事件
   * @param event 事件数据
   * @returns {Promise<boolean>} 是否成功
   */
  async storeEvent(event: Omit<EventMetadata, 'eventId' | 'timestamp' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        this.logger.warn('Event store is disabled', LogContext.DATABASE);
        return false;
      }

      // 验证事件数据
      this.validateEvent(event);

      // 创建完整事件对象
      const fullEvent: EventMetadata = {
        ...event,
        eventId: uuidv4(),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 检查事件大小
      const eventSize = JSON.stringify(fullEvent).length;
      if (eventSize > this.config.maxEventSize!) {
        throw new Error(`Event size ${eventSize} exceeds maximum allowed size ${this.config.maxEventSize}`);
      }

      // 存储事件
      const success = await this.storeEventInternal(fullEvent);

      if (success) {
        // 更新统计
        this.updateStats(fullEvent, eventSize);

        // 发布事件
        if (this.config.enableEventPublishing) {
          this.publishEvent(fullEvent);
        }

        this.logger.debug(`Event stored: ${fullEvent.eventId}`, LogContext.DATABASE);
        this.emitEvent('event_stored', { event: fullEvent });
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to store event: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.emitEvent('event_store_failed', { error, event });
      return false;
    }
  }

  /**
   * @method getEvents
   * @description 查询事件
   * @param query 查询条件
   * @returns {Promise<EventMetadata[]>} 事件列表
   */
  async getEvents(query: EventQuery): Promise<EventMetadata[]> {
    try {
      if (!this.config.enabled) {
        this.logger.warn('Event store is disabled', LogContext.DATABASE);
        return [];
      }

      const em = this.orm.em.fork();
      const events = await this.queryEventsInternal(em, query);

      this.logger.debug(`Events retrieved: ${events.length} events`, LogContext.DATABASE);
      return events;
    } catch (error) {
      this.logger.error(`Failed to get events: ${error.message}`, LogContext.DATABASE, undefined, error);
      return [];
    }
  }

  /**
   * @method getStats
   * @description 获取事件存储统计信息
   * @returns {EventStoreStats} 统计信息
   */
  getStats(): EventStoreStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event store stats reset', LogContext.DATABASE);
  }

  /**
   * @method onDestroy
   * @description 销毁时清理资源
   */
  onDestroy(): void {
    this.stopMonitoring();
    this.logger.info('PostgresEventStore destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method validateEvent
   * @description 验证事件数据
   * @param event 事件数据
   */
  private validateEvent(event: any): void {
    if (!event.aggregateId) {
      throw new Error('Event aggregateId is required');
    }
    if (!event.aggregateType) {
      throw new Error('Event aggregateType is required');
    }
    if (!event.eventType) {
      throw new Error('Event eventType is required');
    }
    if (!event.version || event.version < 1) {
      throw new Error('Event version must be a positive integer');
    }
    if (!event.data) {
      throw new Error('Event data is required');
    }
  }

  /**
   * @private
   * @method storeEventInternal
   * @description 内部事件存储实现
   * @param event 事件数据
   * @returns {Promise<boolean>} 是否成功
   */
  private async storeEventInternal(event: EventMetadata): Promise<boolean> {
    const em = this.orm.em.fork();

    try {
      // 检查版本冲突
      const existingEvent = await this.queryEventsInternal(em, {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        versionRange: { min: event.version, max: event.version },
        limit: 1,
      });

      if (existingEvent.length > 0) {
        throw new Error(`Event version conflict: ${event.aggregateId} version ${event.version} already exists`);
      }

      // 插入事件
      await em.getConnection().execute(
        `INSERT INTO ${this.config.eventTableName} (
          event_id, aggregate_id, aggregate_type, event_type, version, status,
          data, metadata, user_id, tenant_id, session_id, request_id,
          timestamp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.eventId,
          event.aggregateId,
          event.aggregateType,
          event.eventType,
          event.version,
          event.status,
          JSON.stringify(event.data),
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.userId,
          event.tenantId,
          event.sessionId,
          event.requestId,
          event.timestamp,
          event.createdAt,
          event.updatedAt,
        ]
      );

      await em.flush();
      return true;
    } catch (error) {
      await em.rollback();
      throw error;
    }
  }

  /**
   * @private
   * @method queryEventsInternal
   * @description 内部事件查询实现
   * @param em 实体管理器
   * @param query 查询条件
   * @returns {Promise<EventMetadata[]>} 事件列表
   */
  private async queryEventsInternal(em: EntityManager, query: EventQuery): Promise<EventMetadata[]> {
    let sql = `SELECT * FROM ${this.config.eventTableName} WHERE 1=1`;
    const params: any[] = [];

    if (query.aggregateId) {
      sql += ' AND aggregate_id = ?';
      params.push(query.aggregateId);
    }

    if (query.aggregateType) {
      sql += ' AND aggregate_type = ?';
      params.push(query.aggregateType);
    }

    if (query.eventType) {
      if (Array.isArray(query.eventType)) {
        sql += ` AND event_type IN (${query.eventType.map(() => '?').join(', ')})`;
        params.push(...query.eventType);
      } else {
        sql += ' AND event_type = ?';
        params.push(query.eventType);
      }
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        sql += ` AND status IN (${query.status.map(() => '?').join(', ')})`;
        params.push(...query.status);
      } else {
        sql += ' AND status = ?';
        params.push(query.status);
      }
    }

    if (query.userId) {
      sql += ' AND user_id = ?';
      params.push(query.userId);
    }

    if (query.tenantId) {
      sql += ' AND tenant_id = ?';
      params.push(query.tenantId);
    }

    if (query.startTime) {
      sql += ' AND timestamp >= ?';
      params.push(query.startTime);
    }

    if (query.endTime) {
      sql += ' AND timestamp <= ?';
      params.push(query.endTime);
    }

    if (query.versionRange) {
      if (query.versionRange.min !== undefined) {
        sql += ' AND version >= ?';
        params.push(query.versionRange.min);
      }
      if (query.versionRange.max !== undefined) {
        sql += ' AND version <= ?';
        params.push(query.versionRange.max);
      }
    }

    // 排序
    const orderBy = query.orderBy || 'timestamp';
    const orderDirection = query.orderDirection || 'ASC';
    sql += ` ORDER BY ${orderBy} ${orderDirection}`;

    // 分页
    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ' OFFSET ?';
      params.push(query.offset);
    }

    const results = await em.getConnection().execute(sql, params);

    return results.map((row: any) => ({
      eventId: row.event_id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type as EventType,
      version: row.version,
      status: row.status as EventStatus,
      data: JSON.parse(row.data),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      userId: row.user_id,
      tenantId: row.tenant_id,
      sessionId: row.session_id,
      requestId: row.request_id,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * @private
   * @method publishEvent
   * @description 发布事件
   * @param event 事件数据
   */
  private publishEvent(event: EventMetadata): void {
    try {
      this.eventEmitter.emit(`event.${event.eventType}`, {
        event,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Failed to publish event: ${event.eventId}`, LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param event 事件数据
   * @param eventSize 事件大小
   */
  private updateStats(event: EventMetadata, eventSize: number): void {
    this.stats.totalEvents++;
    this.stats.averageEventSize =
      (this.stats.averageEventSize * (this.stats.totalEvents - 1) + eventSize) /
      this.stats.totalEvents;

    if (eventSize > this.stats.maxEventSize) {
      this.stats.maxEventSize = eventSize;
    }

    // 更新事件类型分布
    this.stats.eventTypeDistribution[event.eventType] =
      (this.stats.eventTypeDistribution[event.eventType] || 0) + 1;

    // 更新事件状态分布
    this.stats.eventStatusDistribution[event.status] =
      (this.stats.eventStatusDistribution[event.status] || 0) + 1;

    // 更新聚合根类型分布
    this.stats.aggregateTypeDistribution[event.aggregateType] =
      (this.stats.aggregateTypeDistribution[event.aggregateType] || 0) + 1;

    this.stats.lastEventTime = event.timestamp;
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {EventStoreStats} 初始统计信息
   */
  private initializeStats(): EventStoreStats {
    return {
      totalEvents: 0,
      todayEvents: 0,
      averageEventSize: 0,
      maxEventSize: 0,
      eventTypeDistribution: Object.values(EventType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<EventType, number>),
      eventStatusDistribution: Object.values(EventStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<EventStatus, number>),
      aggregateTypeDistribution: {},
      lastEventTime: new Date(),
      storageSize: 0,
      activeAggregates: 0,
    };
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件存储事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventstore.${type}`, {
          type,
          data,
          timestamp: new Date(),
          storeId: 'postgres-event-store',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event store event: ${type}`, LogContext.DATABASE, undefined, error);
      }
    }
  }

  /**
   * @private
   * @method startMonitoring
   * @description 开始监控
   */
  private startMonitoring(): void {
    if (this.config.monitoringInterval && this.config.monitoringInterval > 0) {
      this.monitoringTimer = setInterval(async () => {
        try {
          await this.performMonitoring();
        } catch (error) {
          this.logger.error('Event store monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event store monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method stopMonitoring
   * @description 停止监控
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      this.logger.info('Stopped event store monitoring', LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method performMonitoring
   * @description 执行监控
   */
  private async performMonitoring(): Promise<void> {
    try {
      const stats = this.getStats();
      this.emitEvent('monitoring', { stats });

      // 更新今日事件数
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayEvents = await this.getEvents({
        startTime: today,
        limit: 1,
      });

      this.stats.todayEvents = todayEvents.length;

      this.logger.debug(`Event store monitoring: ${stats.totalEvents} total events`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event store monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }
}
