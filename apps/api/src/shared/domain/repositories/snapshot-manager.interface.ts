import { EventSourcedAggregate } from '../entities/event-sourced-aggregate';

/**
 * @interface SnapshotManager
 * @description
 * 快照管理器接口，定义了聚合根快照管理的基本契约。
 * 
 * 主要职责：
 * 1. 创建和存储聚合根快照
 * 2. 从快照恢复聚合根状态
 * 3. 管理快照的生命周期
 * 4. 优化事件溯源性能
 * 
 * 设计原则：
 * - 快照是聚合根状态的完整副本
 * - 快照用于优化事件溯源的重建性能
 * - 快照应该定期创建和清理
 * - 快照与事件存储分离，提高性能
 */
export interface SnapshotManager {
  /**
   * 创建聚合根快照
   * 
   * @param aggregate 聚合根实例
   * @returns 快照ID
   * 
   * 创建流程：
   * 1. 获取聚合根的当前状态
   * 2. 序列化聚合根状态
   * 3. 存储快照到持久化存储
   * 4. 返回快照ID
   */
  createSnapshot(aggregate: EventSourcedAggregate): Promise<string>;

  /**
   * 获取聚合根的最新快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns 快照数据，如果不存在则返回null
   */
  getLatestSnapshot(
    aggregateId: string,
    aggregateType: string
  ): Promise<Snapshot | null>;

  /**
   * 获取指定版本的快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param version 版本号
   * @returns 快照数据，如果不存在则返回null
   */
  getSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number
  ): Promise<Snapshot | null>;

  /**
   * 从快照恢复聚合根
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param aggregateClass 聚合根类
   * @returns 聚合根实例，如果快照不存在则返回null
   */
  restoreFromSnapshot<T extends EventSourcedAggregate>(
    aggregateId: string,
    aggregateType: string,
    aggregateClass: new (id: string) => T
  ): Promise<T | null>;

  /**
   * 删除聚合根的所有快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns 删除的快照数量
   */
  deleteSnapshots(
    aggregateId: string,
    aggregateType: string
  ): Promise<number>;

  /**
   * 清理过期的快照
   * 
   * @param maxAge 最大保留时间（毫秒）
   * @returns 清理的快照数量
   */
  cleanupExpiredSnapshots(maxAge: number): Promise<number>;

  /**
   * 检查是否需要创建快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param currentVersion 当前版本号
   * @param snapshotInterval 快照间隔
   * @returns 是否需要创建快照
   */
  shouldCreateSnapshot(
    aggregateId: string,
    aggregateType: string,
    currentVersion: number,
    snapshotInterval: number
  ): Promise<boolean>;
}

/**
 * @interface Snapshot
 * @description
 * 快照数据结构
 */
export interface Snapshot {
  /**
   * 快照ID
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
   * 聚合根版本号
   */
  aggregateVersion: number;

  /**
   * 快照数据（JSON格式）
   */
  snapshotData: string;

  /**
   * 快照元数据
   */
  metadata: SnapshotMetadata;

  /**
   * 创建时间
   */
  createdAt: Date;
}

/**
 * @interface SnapshotMetadata
 * @description
 * 快照元数据
 */
export interface SnapshotMetadata {
  /**
   * 快照大小（字节）
   */
  size: number;

  /**
   * 快照格式版本
   */
  formatVersion: string;

  /**
   * 创建快照的事件数量
   */
  eventsCount: number;

  /**
   * 快照创建耗时（毫秒）
   */
  creationTime: number;

  /**
   * 快照压缩算法
   */
  compression?: string;

  /**
   * 快照加密算法
   */
  encryption?: string;

  /**
   * 额外信息
   */
  additionalInfo?: Record<string, any>;
}

/**
 * @interface SnapshotOptions
 * @description
 * 快照配置选项
 */
export interface SnapshotOptions {
  /**
   * 是否启用快照
   */
  enabled: boolean;

  /**
   * 快照间隔（每N个事件创建一个快照）
   */
  interval: number;

  /**
   * 快照保留策略
   */
  retention: {
    /**
     * 最大保留时间（毫秒）
     */
    maxAge: number;

    /**
     * 最大保留数量
     */
    maxCount: number;
  };

  /**
   * 快照存储配置
   */
  storage: {
    /**
     * 存储类型：'database' | 'file' | 'redis'
     */
    type: 'database' | 'file' | 'redis';

    /**
     * 存储路径（文件存储时使用）
     */
    path?: string;

    /**
     * 数据库表名（数据库存储时使用）
     */
    tableName?: string;

    /**
     * Redis键前缀（Redis存储时使用）
     */
    keyPrefix?: string;
  };

  /**
   * 快照压缩配置
   */
  compression?: {
    /**
     * 是否启用压缩
     */
    enabled: boolean;

    /**
     * 压缩算法：'gzip' | 'brotli'
     */
    algorithm: 'gzip' | 'brotli';

    /**
     * 压缩级别（1-9）
     */
    level: number;
  };

  /**
   * 快照加密配置
   */
  encryption?: {
    /**
     * 是否启用加密
     */
    enabled: boolean;

    /**
     * 加密算法
     */
    algorithm: string;

    /**
     * 加密密钥
     */
    key: string;
  };
}

/**
 * @interface SnapshotSerializer
 * @description
 * 快照序列化器接口
 */
export interface SnapshotSerializer {
  /**
   * 序列化聚合根
   * 
   * @param aggregate 聚合根实例
   * @returns 序列化后的数据
   */
  serialize(aggregate: EventSourcedAggregate): Promise<string>;

  /**
   * 反序列化聚合根
   * 
   * @param data 序列化的数据
   * @param aggregateClass 聚合根类
   * @returns 聚合根实例
   */
  deserialize<T extends EventSourcedAggregate>(
    data: string,
    aggregateClass: new (id: string) => T
  ): Promise<T>;
}

/**
 * @interface SnapshotStorage
 * @description
 * 快照存储接口
 */
export interface SnapshotStorage {
  /**
   * 存储快照
   * 
   * @param snapshot 快照数据
   * @returns 快照ID
   */
  save(snapshot: Snapshot): Promise<string>;

  /**
   * 获取快照
   * 
   * @param id 快照ID
   * @returns 快照数据
   */
  get(id: string): Promise<Snapshot | null>;

  /**
   * 获取聚合根的最新快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns 快照数据
   */
  getLatest(
    aggregateId: string,
    aggregateType: string
  ): Promise<Snapshot | null>;

  /**
   * 删除快照
   * 
   * @param id 快照ID
   * @returns 是否删除成功
   */
  delete(id: string): Promise<boolean>;

  /**
   * 删除聚合根的所有快照
   * 
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns 删除的快照数量
   */
  deleteAll(
    aggregateId: string,
    aggregateType: string
  ): Promise<number>;

  /**
   * 清理过期的快照
   * 
   * @param maxAge 最大保留时间（毫秒）
   * @returns 清理的快照数量
   */
  cleanup(maxAge: number): Promise<number>;
}

/**
 * @abstract BaseSnapshotManager
 * @description
 * 快照管理器抽象基类，提供通用的快照管理逻辑
 */
export abstract class BaseSnapshotManager implements SnapshotManager {
  /**
   * 快照配置
   */
  protected readonly options: SnapshotOptions;

  /**
   * 快照序列化器
   */
  protected readonly serializer: SnapshotSerializer;

  /**
   * 快照存储
   */
  protected readonly storage: SnapshotStorage;

  constructor(
    options: SnapshotOptions,
    serializer: SnapshotSerializer,
    storage: SnapshotStorage
  ) {
    this.options = options;
    this.serializer = serializer;
    this.storage = storage;
  }

  /**
   * 创建聚合根快照
   */
  async createSnapshot(aggregate: EventSourcedAggregate): Promise<string> {
    if (!this.options.enabled) {
      throw new Error('快照功能已禁用');
    }

    const startTime = Date.now();

    try {
      // 序列化聚合根
      const snapshotData = await this.serializer.serialize(aggregate);

      // 创建快照元数据
      const metadata: SnapshotMetadata = {
        size: Buffer.byteLength(snapshotData, 'utf8'),
        formatVersion: '1.0',
        eventsCount: aggregate.version,
        creationTime: Date.now() - startTime,
        additionalInfo: {
          aggregateType: aggregate.constructor.name,
        },
      };

      // 创建快照
      const snapshot: Snapshot = {
        id: this.generateSnapshotId(aggregate.id),
        aggregateId: aggregate.id,
        aggregateType: aggregate.constructor.name,
        aggregateVersion: aggregate.version,
        snapshotData,
        metadata,
        createdAt: new Date(),
      };

      // 存储快照
      const snapshotId = await this.storage.save(snapshot);

      return snapshotId;
    } catch (error) {
      throw new Error(`创建快照失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取聚合根的最新快照
   */
  async getLatestSnapshot(
    aggregateId: string,
    aggregateType: string
  ): Promise<Snapshot | null> {
    return this.storage.getLatest(aggregateId, aggregateType);
  }

  /**
   * 获取指定版本的快照
   */
  async getSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number
  ): Promise<Snapshot | null> {
    // 这里需要根据具体存储实现来查询指定版本的快照
    // 暂时返回最新快照
    return this.storage.getLatest(aggregateId, aggregateType);
  }

  /**
   * 从快照恢复聚合根
   */
  async restoreFromSnapshot<T extends EventSourcedAggregate>(
    aggregateId: string,
    aggregateType: string,
    aggregateClass: new (id: string) => T
  ): Promise<T | null> {
    const snapshot = await this.getLatestSnapshot(aggregateId, aggregateType);
    
    if (!snapshot) {
      return null;
    }

    try {
      // 反序列化聚合根
      const aggregate = await this.serializer.deserialize(
        snapshot.snapshotData,
        aggregateClass
      );

      return aggregate;
    } catch (error) {
      throw new Error(`从快照恢复聚合根失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 删除聚合根的所有快照
   */
  async deleteSnapshots(
    aggregateId: string,
    aggregateType: string
  ): Promise<number> {
    return this.storage.deleteAll(aggregateId, aggregateType);
  }

  /**
   * 清理过期的快照
   */
  async cleanupExpiredSnapshots(maxAge: number): Promise<number> {
    return this.storage.cleanup(maxAge);
  }

  /**
   * 检查是否需要创建快照
   */
  async shouldCreateSnapshot(
    aggregateId: string,
    aggregateType: string,
    currentVersion: number,
    snapshotInterval: number
  ): Promise<boolean> {
    if (!this.options.enabled) {
      return false;
    }

    if (currentVersion % snapshotInterval !== 0) {
      return false;
    }

    const latestSnapshot = await this.getLatestSnapshot(aggregateId, aggregateType);
    
    if (!latestSnapshot) {
      return true;
    }

    return currentVersion > latestSnapshot.aggregateVersion;
  }

  /**
   * 生成快照ID
   * 
   * @param aggregateId 聚合根ID
   * @returns 快照ID
   */
  protected generateSnapshotId(aggregateId: string): string {
    return `${aggregateId}-snapshot-${Date.now()}`;
  }
}
