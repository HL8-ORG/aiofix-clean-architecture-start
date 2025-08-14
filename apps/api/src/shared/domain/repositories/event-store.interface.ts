import { DomainEvent } from '../events/base.event';

/**
 * @interface EventStore
 * @description
 * 事件存储接口，定义了事件存储的基本契约。
 * 
 * 主要职责：
 * 1. 存储领域事件
 * 2. 检索聚合根的事件历史
 * 3. 支持事件版本控制
 * 4. 提供事件查询功能
 * 
 * 设计原则：
 * - 事件存储是事件溯源的核心基础设施
 * - 事件一旦存储就不能修改或删除
 * - 支持按聚合根ID和版本范围查询事件
 * - 提供事件订阅和发布机制
 */
export interface EventStore {
  /**
   * 存储事件
   * 
   * @param aggregateId 聚合根ID
   * @param events 要存储的事件列表
   * @param expectedVersion 期望的版本号（用于乐观锁）
   * @returns 存储成功的事件列表
   * 
   * 存储流程：
   * 1. 验证聚合根当前版本
   * 2. 为每个事件分配序列号
   * 3. 存储事件到持久化存储
   * 4. 发布事件到事件总线
   * 5. 返回存储成功的事件
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<DomainEvent[]>;

  /**
   * 获取聚合根的事件历史
   * 
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号（可选）
   * @param toVersion 结束版本号（可选）
   * @returns 事件历史列表
   * 
   * 查询规则：
   * - 如果不指定版本范围，返回所有事件
   * - 版本范围是左闭右开区间 [fromVersion, toVersion)
   * - 事件按版本号升序排列
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * 获取聚合根的最新版本号
   * 
   * @param aggregateId 聚合根ID
   * @returns 最新版本号，如果不存在则返回-1
   */
  getLatestVersion(aggregateId: string): Promise<number>;

  /**
   * 检查聚合根是否存在
   * 
   * @param aggregateId 聚合根ID
   * @returns 是否存在
   */
  exists(aggregateId: string): Promise<boolean>;

  /**
   * 获取所有聚合根ID
   * 
   * @param aggregateType 聚合根类型（可选）
   * @returns 聚合根ID列表
   */
  getAggregateIds(aggregateType?: string): Promise<string[]>;

  /**
   * 删除聚合根的所有事件（仅用于测试）
   * 
   * @param aggregateId 聚合根ID
   * @returns 删除的事件数量
   * 
   * 注意：此方法仅用于测试环境，生产环境不应使用
   */
  deleteEvents(aggregateId: string): Promise<number>;
}

/**
 * @interface EventStoreOptions
 * @description
 * 事件存储配置选项
 */
export interface EventStoreOptions {
  /**
   * 数据库连接配置
   */
  database?: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  /**
   * 事件表名
   */
  eventsTable?: string;

  /**
   * 快照表名
   */
  snapshotsTable?: string;

  /**
   * 是否启用快照
   */
  enableSnapshots?: boolean;

  /**
   * 快照间隔（每N个事件创建一个快照）
   */
  snapshotInterval?: number;

  /**
   * 是否启用事件缓存
   */
  enableCache?: boolean;

  /**
   * 缓存配置
   */
  cache?: {
    ttl: number;
    maxSize: number;
  };
}

/**
 * @interface StoredEvent
 * @description
 * 存储的事件数据结构
 */
export interface StoredEvent {
  /**
   * 事件ID
   */
  id: string;

  /**
   * 聚合根ID
   */
  aggregateId: string;

  /**
   * 聚合根类型
   */
  aggregateType: string;

  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 事件版本
   */
  eventVersion: number;

  /**
   * 聚合根版本
   */
  aggregateVersion: number;

  /**
   * 事件数据（JSON格式）
   */
  eventData: string;

  /**
   * 事件元数据（JSON格式）
   */
  metadata: string;

  /**
   * 事件发生时间
   */
  occurredOn: Date;

  /**
   * 请求ID
   */
  requestId?: string;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 用户ID
   */
  userId?: string;

  /**
   * 关联ID
   */
  correlationId?: string;
}

/**
 * @interface EventQuery
 * @description
 * 事件查询条件
 */
export interface EventQuery {
  /**
   * 聚合根ID
   */
  aggregateId?: string;

  /**
   * 聚合根类型
   */
  aggregateType?: string;

  /**
   * 事件类型
   */
  eventType?: string;

  /**
   * 起始版本号
   */
  fromVersion?: number;

  /**
   * 结束版本号
   */
  toVersion?: number;

  /**
   * 起始时间
   */
  fromDate?: Date;

  /**
   * 结束时间
   */
  toDate?: Date;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 用户ID
   */
  userId?: string;

  /**
   * 分页参数
   */
  pagination?: {
    page: number;
    pageSize: number;
  };

  /**
   * 排序参数
   */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * @interface EventQueryResult
 * @description
 * 事件查询结果
 */
export interface EventQueryResult {
  /**
   * 事件列表
   */
  events: StoredEvent[];

  /**
   * 总数量
   */
  total: number;

  /**
   * 当前页
   */
  page: number;

  /**
   * 每页大小
   */
  pageSize: number;

  /**
   * 总页数
   */
  totalPages: number;
}
