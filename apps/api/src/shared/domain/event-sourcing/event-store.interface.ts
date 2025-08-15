import { DomainEvent } from './event-sourced-aggregate';

/**
 * @interface IEventStore
 * @description 事件存储接口，定义事件存储的抽象契约
 * 
 * 核心职责：
 * 1. 存储领域事件
 * 2. 检索聚合根的事件历史
 * 3. 支持事件订阅和发布
 * 4. 提供事件查询和过滤功能
 * 
 * 设计原则：
 * - 事件存储是事件溯源的核心组件
 * - 支持多种存储后端（PostgreSQL、MongoDB等）
 * - 提供高性能的事件检索和存储
 * - 支持事件版本管理和兼容性
 */
export interface IEventStore {
  /**
   * @method saveEvents
   * @description 保存聚合根的事件
   * @param aggregateId 聚合根ID
   * @param expectedVersion 期望的版本号（用于乐观锁）
   * @param events 要保存的事件列表
   * @returns Promise<void>
   */
  saveEvents(
    aggregateId: string,
    expectedVersion: number,
    events: DomainEvent[]
  ): Promise<void>;

  /**
   * @method getEvents
   * @description 获取聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号（可选）
   * @param toVersion 结束版本号（可选）
   * @returns Promise<DomainEvent[]>
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * @method getEventsByType
   * @description 根据事件类型获取事件
   * @param eventType 事件类型
   * @param fromDate 起始日期（可选）
   * @param toDate 结束日期（可选）
   * @param limit 限制数量（可选）
   * @returns Promise<DomainEvent[]>
   */
  getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date,
    limit?: number
  ): Promise<DomainEvent[]>;

  /**
   * @method getEventsByAggregateType
   * @description 根据聚合根类型获取事件
   * @param aggregateType 聚合根类型
   * @param fromDate 起始日期（可选）
   * @param toDate 结束日期（可选）
   * @param limit 限制数量（可选）
   * @returns Promise<DomainEvent[]>
   */
  getEventsByAggregateType(
    aggregateType: string,
    fromDate?: Date,
    toDate?: Date,
    limit?: number
  ): Promise<DomainEvent[]>;

  /**
   * @method getEventsByCorrelationId
   * @description 根据关联ID获取事件
   * @param correlationId 关联ID
   * @returns Promise<DomainEvent[]>
   */
  getEventsByCorrelationId(correlationId: string): Promise<DomainEvent[]>;

  /**
   * @method getLastEvent
   * @description 获取聚合根的最后事件
   * @param aggregateId 聚合根ID
   * @returns Promise<DomainEvent | null>
   */
  getLastEvent(aggregateId: string): Promise<DomainEvent | null>;

  /**
   * @method getEventCount
   * @description 获取聚合根的事件数量
   * @param aggregateId 聚合根ID
   * @returns Promise<number>
   */
  getEventCount(aggregateId: string): Promise<number>;

  /**
   * @method deleteEvents
   * @description 删除聚合根的事件（谨慎使用）
   * @param aggregateId 聚合根ID
   * @returns Promise<void>
   */
  deleteEvents(aggregateId: string): Promise<void>;

  /**
   * @method subscribe
   * @description 订阅事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   * @returns Promise<string> 订阅ID
   */
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<string>;

  /**
   * @method unsubscribe
   * @description 取消订阅
   * @param subscriptionId 订阅ID
   * @returns Promise<void>
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * @method publish
   * @description 发布事件
   * @param event 领域事件
   * @returns Promise<void>
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * @method getSubscriptionCount
   * @description 获取订阅数量
   * @param eventType 事件类型（可选）
   * @returns Promise<number>
   */
  getSubscriptionCount(eventType?: string): Promise<number>;

  /**
   * @method healthCheck
   * @description 健康检查
   * @returns Promise<boolean>
   */
  healthCheck(): Promise<boolean>;

  /**
   * @method getStats
   * @description 获取事件存储统计信息
   * @returns Promise<EventStoreStats>
   */
  getStats(): Promise<EventStoreStats>;
}

/**
 * @interface EventStoreStats
 * @description 事件存储统计信息
 */
export interface EventStoreStats {
  totalEvents: number;
  totalAggregates: number;
  eventsByType: Record<string, number>;
  eventsByAggregateType: Record<string, number>;
  averageEventsPerAggregate: number;
  lastEventTimestamp: Date | null;
  storageSize: number; // 字节
  subscriptionCount: number;
}

/**
 * @interface EventStoreOptions
 * @description 事件存储配置选项
 */
export interface EventStoreOptions {
  /**
   * 事件存储类型
   */
  type: 'postgresql' | 'mongodb' | 'redis' | 'memory';

  /**
   * 连接配置
   */
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
  };

  /**
   * 表/集合名称
   */
  tableName?: string;

  /**
   * 是否启用事件压缩
   */
  enableCompression?: boolean;

  /**
   * 事件保留天数
   */
  retentionDays?: number;

  /**
   * 批量操作大小
   */
  batchSize?: number;

  /**
   * 连接池配置
   */
  pool?: {
    min: number;
    max: number;
    acquireTimeout: number;
  };

  /**
   * 是否启用调试模式
   */
  debug?: boolean;
}

/**
 * @class EventStoreException
 * @description 事件存储异常
 */
export class EventStoreException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'EventStoreException';
  }
}

/**
 * @class ConcurrencyException
 * @description 并发异常，当版本号不匹配时抛出
 */
export class ConcurrencyException extends EventStoreException {
  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Concurrency conflict for aggregate ${aggregateId}. Expected version ${expectedVersion}, but actual version is ${actualVersion}`,
      'CONCURRENCY_CONFLICT',
      { aggregateId, expectedVersion, actualVersion }
    );
    this.name = 'ConcurrencyException';
  }
}

/**
 * @class AggregateNotFoundException
 * @description 聚合根未找到异常
 */
export class AggregateNotFoundException extends EventStoreException {
  constructor(aggregateId: string) {
    super(
      `Aggregate with id ${aggregateId} not found`,
      'AGGREGATE_NOT_FOUND',
      { aggregateId }
    );
    this.name = 'AggregateNotFoundException';
  }
}
