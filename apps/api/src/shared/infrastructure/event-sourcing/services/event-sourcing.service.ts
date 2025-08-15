import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { PostgresEventStore, EventMetadata, EventQuery, EventType, EventStatus } from '../stores/postgres-event-store';
import { RedisEventCache, CachedEvent } from '../caches/redis-event-cache';

/**
 * @interface EventSourcingConfig
 * @description
 * 事件溯源服务配置接口。
 */
export interface EventSourcingConfig {
  /** 是否启用事件溯源 */
  enabled?: boolean;
  /** 是否启用事件缓存 */
  enableEventCache?: boolean;
  /** 是否启用事件发布 */
  enableEventPublishing?: boolean;
  /** 是否启用事件重放 */
  enableEventReplay?: boolean;
  /** 是否启用快照 */
  enableSnapshots?: boolean;
  /** 快照间隔 */
  snapshotInterval?: number;
  /** 批量操作大小 */
  batchSize?: number;
  /** 并发处理数 */
  concurrency?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用统计 */
  enableStats?: boolean;
  /** 是否启用事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 最大事件大小（字节） */
  maxEventSize?: number;
  /** 事件缓存TTL（秒） */
  eventCacheTtl?: number;
  /** 聚合根缓存TTL（秒） */
  aggregateCacheTtl?: number;
}

/**
 * @interface EventSourcingStats
 * @description
 * 事件溯源统计信息接口。
 */
export interface EventSourcingStats {
  /** 总事件数 */
  totalEvents: number;
  /** 存储事件数 */
  storedEvents: number;
  /** 缓存事件数 */
  cachedEvents: number;
  /** 缓存命中次数 */
  cacheHits: number;
  /** 缓存未命中次数 */
  cacheMisses: number;
  /** 缓存命中率 */
  cacheHitRate: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 最大响应时间（毫秒） */
  maxResponseTime: number;
  /** 最小响应时间（毫秒） */
  minResponseTime: number;
  /** 事件类型分布 */
  eventTypeDistribution: Record<EventType, number>;
  /** 聚合根类型分布 */
  aggregateTypeDistribution: Record<string, number>;
  /** 错误次数 */
  errorCount: number;
  /** 重试次数 */
  retryCount: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * @interface EventSourcingResult
 * @description
 * 事件溯源操作结果接口。
 */
export interface EventSourcingResult {
  /** 是否成功 */
  success: boolean;
  /** 事件ID */
  eventId?: string;
  /** 错误信息 */
  error?: string;
  /** 响应时间（毫秒） */
  responseTime?: number;
  /** 缓存状态 */
  cached?: boolean;
  /** 重试次数 */
  retries?: number;
}

/**
 * @class EventSourcingService
 * @description
 * 事件溯源服务，协调事件存储和缓存。
 * 
 * 主要功能包括：
 * 1. 事件存储和检索
 * 2. 事件缓存管理
 * 3. 聚合根事件流重建
 * 4. 事件重放和快照
 * 5. 统计和监控
 * 6. 错误处理和重试
 * 
 * 设计原则：
 * - 高性能：使用缓存加速事件检索
 * - 可靠性：支持重试和错误恢复
 * - 一致性：确保事件存储和缓存的同步
 * - 可扩展：支持批量操作和并发处理
 * - 监控性：提供详细的统计信息
 */
@Injectable()
export class EventSourcingService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventSourcingConfig;

  /**
   * 事件存储
   */
  private eventStore: PostgresEventStore;

  /**
   * 事件缓存
   */
  private eventCache: RedisEventCache;

  /**
   * 统计信息
   */
  private stats: EventSourcingStats;

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  constructor(
    @Inject('EVENT_SOURCING_CONFIG') config: EventSourcingConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService,
    eventStore: PostgresEventStore,
    eventCache: RedisEventCache
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      enableEventCache: true,
      enableEventPublishing: true,
      enableEventReplay: true,
      enableSnapshots: true,
      snapshotInterval: 100,
      batchSize: 100,
      concurrency: 5,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      maxEventSize: 1024 * 1024,
      eventCacheTtl: 3600,
      aggregateCacheTtl: 7200,
      ...config,
    };

    this.eventStore = eventStore;
    this.eventCache = eventCache;
    this.stats = this.initializeStats();
    this.startMonitoring();

    this.logger.info('EventSourcingService initialized', LogContext.DATABASE);
  }

  /**
   * @method storeEvent
   * @description 存储事件
   * @param event 事件数据
   * @returns {Promise<EventSourcingResult>} 操作结果
   */
  async storeEvent(event: Omit<EventMetadata, 'eventId' | 'timestamp' | 'createdAt' | 'updatedAt'>): Promise<EventSourcingResult> {
    const startTime = Date.now();
    let retries = 0;

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event sourcing is disabled', LogContext.DATABASE);
        return {
          success: false,
          error: 'Event sourcing is disabled',
          responseTime: Date.now() - startTime,
        };
      }

      // 验证事件数据
      this.validateEvent(event);

      // 生成事件ID
      const eventId = uuidv4();
      const fullEvent: EventMetadata = {
        ...event,
        eventId,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 检查事件大小
      const eventSize = JSON.stringify(fullEvent).length;
      if (eventSize > this.config.maxEventSize!) {
        throw new Error(`Event size ${eventSize} exceeds maximum allowed size ${this.config.maxEventSize}`);
      }

      // 存储事件到数据库
      const storeSuccess = await this.storeEventWithRetry(fullEvent, retries);

      if (!storeSuccess) {
        throw new Error('Failed to store event in database');
      }

      // 缓存事件
      let cached = false;
      if (this.config.enableEventCache) {
        try {
          cached = await this.cacheEvent(fullEvent);
        } catch (error) {
          this.logger.warn(`Failed to cache event: ${error.message}`, LogContext.CACHE, undefined, error);
        }
      }

      // 更新统计
      this.updateStats('store', Date.now() - startTime, cached);

      // 发布事件
      if (this.config.enableEventPublishing) {
        this.publishEvent(fullEvent);
      }

      this.logger.debug(`Event stored: ${eventId}`, LogContext.DATABASE);
      this.emitEvent('event_stored', { event: fullEvent, cached });

      return {
        success: true,
        eventId,
        responseTime: Date.now() - startTime,
        cached,
        retries,
      };
    } catch (error) {
      this.logger.error(`Failed to store event: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      this.emitEvent('event_store_failed', { error, event });

      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        retries,
      };
    }
  }

  /**
   * @method storeEvents
   * @description 批量存储事件
   * @param events 事件列表
   * @returns {Promise<EventSourcingResult[]>} 操作结果列表
   */
  async storeEvents(events: Array<Omit<EventMetadata, 'eventId' | 'timestamp' | 'createdAt' | 'updatedAt'>>): Promise<EventSourcingResult[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event sourcing is disabled', LogContext.DATABASE);
        return events.map(() => ({
          success: false,
          error: 'Event sourcing is disabled',
          responseTime: Date.now() - startTime,
        }));
      }

      if (events.length === 0) {
        return [];
      }

      // 验证所有事件
      events.forEach(event => this.validateEvent(event));

      // 创建完整事件对象
      const fullEvents: EventMetadata[] = events.map(event => ({
        ...event,
        eventId: uuidv4(),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // 检查事件大小
      for (const event of fullEvents) {
        const eventSize = JSON.stringify(event).length;
        if (eventSize > this.config.maxEventSize!) {
          throw new Error(`Event size ${eventSize} exceeds maximum allowed size ${this.config.maxEventSize}`);
        }
      }

      // 批量存储事件
      const results: EventSourcingResult[] = [];
      const batchSize = this.config.batchSize!;

      for (let i = 0; i < fullEvents.length; i += batchSize) {
        const batch = fullEvents.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(event => this.storeEvent(event))
        );
        results.push(...batchResults);
      }

      // 更新统计
      this.updateStats('store_batch', Date.now() - startTime);

      this.logger.debug(`Batch events stored: ${fullEvents.length} events`, LogContext.DATABASE);
      this.emitEvent('events_stored', { events: fullEvents, results });

      return results;
    } catch (error) {
      this.logger.error(`Failed to store events: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      this.emitEvent('events_store_failed', { error, events });

      return events.map(() => ({
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
      }));
    }
  }

  /**
   * @method getEvent
   * @description 获取事件
   * @param eventId 事件ID
   * @returns {Promise<EventMetadata | null>} 事件数据
   */
  async getEvent(eventId: string): Promise<EventMetadata | null> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event sourcing is disabled', LogContext.DATABASE);
        return null;
      }

      // 先从缓存获取
      if (this.config.enableEventCache) {
        try {
          const cachedEvent = await this.eventCache.getEvent(eventId);
          if (cachedEvent) {
            this.updateStats('cache_hit', Date.now() - startTime);
            this.logger.debug(`Event retrieved from cache: ${eventId}`, LogContext.DATABASE);
            return this.convertCachedEventToMetadata(cachedEvent);
          }
        } catch (error) {
          this.logger.warn(`Failed to get event from cache: ${error.message}`, LogContext.CACHE, undefined, error);
        }
      }

      // 从数据库获取
      const events = await this.eventStore.getEvents({ eventId });
      const event = events.length > 0 ? events[0] : null;

      if (event) {
        // 缓存事件
        if (this.config.enableEventCache) {
          try {
            await this.cacheEvent(event);
          } catch (error) {
            this.logger.warn(`Failed to cache retrieved event: ${error.message}`, LogContext.CACHE, undefined, error);
          }
        }

        this.updateStats('cache_miss', Date.now() - startTime);
        this.logger.debug(`Event retrieved from database: ${eventId}`, LogContext.DATABASE);
      } else {
        this.updateStats('cache_miss', Date.now() - startTime);
        this.logger.debug(`Event not found: ${eventId}`, LogContext.DATABASE);
      }

      return event;
    } catch (error) {
      this.logger.error(`Failed to get event: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      return null;
    }
  }

  /**
   * @method getAggregateEvents
   * @description 获取聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns {Promise<EventMetadata[]>} 事件列表
   */
  async getAggregateEvents(aggregateId: string, aggregateType: string): Promise<EventMetadata[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event sourcing is disabled', LogContext.DATABASE);
        return [];
      }

      // 先从缓存获取
      if (this.config.enableEventCache) {
        try {
          const cachedEvents = await this.eventCache.getAggregateEvents(aggregateId, aggregateType);
          if (cachedEvents.length > 0) {
            this.updateStats('cache_hit', Date.now() - startTime);
            this.logger.debug(`Aggregate events retrieved from cache: ${aggregateId} (${cachedEvents.length} events)`, LogContext.DATABASE);
            return cachedEvents.map(event => this.convertCachedEventToMetadata(event));
          }
        } catch (error) {
          this.logger.warn(`Failed to get aggregate events from cache: ${error.message}`, LogContext.CACHE, undefined, error);
        }
      }

      // 从数据库获取
      const events = await this.eventStore.getEvents({
        aggregateId,
        aggregateType,
        orderBy: 'version',
        orderDirection: 'ASC',
      });

      if (events.length > 0) {
        // 缓存事件
        if (this.config.enableEventCache) {
          try {
            await this.eventCache.cacheEvents(
              events.map(event => this.convertMetadataToCachedEvent(event)),
              this.config.aggregateCacheTtl
            );
          } catch (error) {
            this.logger.warn(`Failed to cache aggregate events: ${error.message}`, LogContext.CACHE, undefined, error);
          }
        }

        this.updateStats('cache_miss', Date.now() - startTime);
        this.logger.debug(`Aggregate events retrieved from database: ${aggregateId} (${events.length} events)`, LogContext.DATABASE);
      } else {
        this.updateStats('cache_miss', Date.now() - startTime);
        this.logger.debug(`Aggregate events not found: ${aggregateId}`, LogContext.DATABASE);
      }

      return events;
    } catch (error) {
      this.logger.error(`Failed to get aggregate events: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      return [];
    }
  }

  /**
   * @method queryEvents
   * @description 查询事件
   * @param query 查询条件
   * @returns {Promise<EventMetadata[]>} 事件列表
   */
  async queryEvents(query: EventQuery): Promise<EventMetadata[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event sourcing is disabled', LogContext.DATABASE);
        return [];
      }

      // 从数据库查询
      const events = await this.eventStore.getEvents(query);

      this.updateStats('query', Date.now() - startTime);
      this.logger.debug(`Events queried: ${events.length} events`, LogContext.DATABASE);

      return events;
    } catch (error) {
      this.logger.error(`Failed to query events: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      return [];
    }
  }

  /**
   * @method invalidateEvent
   * @description 使事件缓存失效
   * @param eventId 事件ID
   * @returns {Promise<boolean>} 是否成功
   */
  async invalidateEvent(eventId: string): Promise<boolean> {
    try {
      if (!this.config.enabled || !this.config.enableEventCache) {
        return false;
      }

      const success = await this.eventCache.invalidateEvent(eventId);

      if (success) {
        this.logger.debug(`Event invalidated: ${eventId}`, LogContext.CACHE);
        this.emitEvent('event_invalidated', { eventId });
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to invalidate event: ${error.message}`, LogContext.CACHE, undefined, error);
      return false;
    }
  }

  /**
   * @method invalidateAggregateEvents
   * @description 使聚合根的所有事件缓存失效
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns {Promise<boolean>} 是否成功
   */
  async invalidateAggregateEvents(aggregateId: string, aggregateType: string): Promise<boolean> {
    try {
      if (!this.config.enabled || !this.config.enableEventCache) {
        return false;
      }

      const success = await this.eventCache.invalidateAggregateEvents(aggregateId, aggregateType);

      if (success) {
        this.logger.debug(`Aggregate events invalidated: ${aggregateId}`, LogContext.CACHE);
        this.emitEvent('aggregate_events_invalidated', { aggregateId, aggregateType });
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to invalidate aggregate events: ${error.message}`, LogContext.CACHE, undefined, error);
      return false;
    }
  }

  /**
   * @method getStats
   * @description 获取事件溯源统计信息
   * @returns {EventSourcingStats} 统计信息
   */
  getStats(): EventSourcingStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event sourcing stats reset', LogContext.DATABASE);
  }

  /**
   * @method getHealth
   * @description 获取服务健康状态
   * @returns {Promise<{ status: string; details: any }>} 健康状态
   */
  async getHealth(): Promise<{ status: string; details: any }> {
    try {
      if (!this.config.enabled) {
        return { status: 'disabled', details: { enabled: false } };
      }

      const [storeHealth, cacheHealth] = await Promise.all([
        this.eventStore.getHealth(),
        this.eventCache.getHealth(),
      ]);

      const isHealthy = storeHealth.status === 'healthy' && cacheHealth.status === 'healthy';

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          eventStore: storeHealth,
          eventCache: cacheHealth,
          stats: this.getStats(),
        },
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, LogContext.DATABASE, undefined, error);
      return {
        status: 'unhealthy',
        details: {
          enabled: true,
          error: error.message,
        },
      };
    }
  }

  /**
   * @method onDestroy
   * @description 销毁时清理资源
   */
  onDestroy(): void {
    this.stopMonitoring();
    this.logger.info('EventSourcingService destroyed', LogContext.DATABASE);
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
   * @method storeEventWithRetry
   * @description 带重试的事件存储
   * @param event 事件数据
   * @param retries 重试次数
   * @returns {Promise<boolean>} 是否成功
   */
  private async storeEventWithRetry(event: EventMetadata, retries: number): Promise<boolean> {
    for (let i = 0; i <= this.config.retries!; i++) {
      try {
        const success = await this.eventStore.storeEvent(event);
        if (success) {
          return true;
        }
      } catch (error) {
        this.logger.warn(`Event store attempt ${i + 1} failed: ${error.message}`, LogContext.DATABASE, undefined, error);

        if (i < this.config.retries!) {
          await this.delay(this.config.retryDelay!);
          retries++;
        } else {
          throw error;
        }
      }
    }
    return false;
  }

  /**
   * @private
   * @method cacheEvent
   * @description 缓存事件
   * @param event 事件数据
   * @returns {Promise<boolean>} 是否成功
   */
  private async cacheEvent(event: EventMetadata): Promise<boolean> {
    const cachedEvent = this.convertMetadataToCachedEvent(event);
    return await this.eventCache.cacheEvent(cachedEvent, this.config.eventCacheTtl);
  }

  /**
   * @private
   * @method convertMetadataToCachedEvent
   * @description 将事件元数据转换为缓存事件
   * @param event 事件元数据
   * @returns {CachedEvent} 缓存事件
   */
  private convertMetadataToCachedEvent(event: EventMetadata): CachedEvent {
    return {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      version: event.version,
      status: event.status,
      data: event.data,
      metadata: event.metadata,
      userId: event.userId,
      tenantId: event.tenantId,
      sessionId: event.sessionId,
      requestId: event.requestId,
      timestamp: event.timestamp,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + (this.config.eventCacheTtl! * 1000)),
      accessCount: 0,
      lastAccessed: new Date(),
    };
  }

  /**
   * @private
   * @method convertCachedEventToMetadata
   * @description 将缓存事件转换为事件元数据
   * @param event 缓存事件
   * @returns {EventMetadata} 事件元数据
   */
  private convertCachedEventToMetadata(event: CachedEvent): EventMetadata {
    return {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      version: event.version,
      status: event.status,
      data: event.data,
      metadata: event.metadata,
      userId: event.userId,
      tenantId: event.tenantId,
      sessionId: event.sessionId,
      requestId: event.requestId,
      timestamp: event.timestamp,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  /**
   * @private
   * @method publishEvent
   * @description 发布事件
   * @param event 事件数据
   */
  private publishEvent(event: EventMetadata): void {
    try {
      this.eventEmitter.emit(`eventsourcing.${event.eventType}`, {
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
   * @param type 统计类型
   * @param responseTime 响应时间
   * @param cached 是否缓存
   */
  private updateStats(type: string, responseTime: number, cached?: boolean): void {
    this.stats.lastUpdated = new Date();

    if (type === 'store' || type === 'store_batch') {
      this.stats.storedEvents++;
      this.stats.totalEvents++;
    } else if (type === 'cache_hit') {
      this.stats.cacheHits++;
    } else if (type === 'cache_miss') {
      this.stats.cacheMisses++;
    } else if (type === 'error') {
      this.stats.errorCount++;
    }

    if (cached) {
      this.stats.cachedEvents++;
    }

    // 更新响应时间统计
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    if (responseTime > this.stats.maxResponseTime) {
      this.stats.maxResponseTime = responseTime;
    }

    if (responseTime < this.stats.minResponseTime || this.stats.minResponseTime === 0) {
      this.stats.minResponseTime = responseTime;
    }

    // 计算命中率
    this.stats.cacheHitRate = totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0;
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {EventSourcingStats} 初始统计信息
   */
  private initializeStats(): EventSourcingStats {
    return {
      totalEvents: 0,
      storedEvents: 0,
      cachedEvents: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      eventTypeDistribution: Object.values(EventType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<EventType, number>),
      aggregateTypeDistribution: {},
      errorCount: 0,
      retryCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件溯源事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventsourcing.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'event-sourcing-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event sourcing event: ${type}`, LogContext.DATABASE, undefined, error);
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
          this.logger.error('Event sourcing monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event sourcing monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
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
      this.logger.info('Stopped event sourcing monitoring', LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method performMonitoring
   * @description 执行监控
   */
  private async performMonitoring(): Promise<void> {
    try {
      const health = await this.getHealth();
      this.emitEvent('monitoring', { health });

      this.logger.debug(`Event sourcing monitoring: ${this.stats.storedEvents} stored, ${this.stats.cacheHits} cache hits`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event sourcing monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method delay
   * @description 延迟执行
   * @param ms 延迟时间（毫秒）
   * @returns {Promise<void>}
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
