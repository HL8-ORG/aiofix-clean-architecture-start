/**
 * @interface ISnapshotManager
 * @description 快照管理器接口，定义快照管理的抽象契约
 * 
 * 核心职责：
 * 1. 创建聚合根的快照
 * 2. 存储和检索快照
 * 3. 支持快照版本管理
 * 4. 提供快照清理和优化功能
 * 
 * 设计原则：
 * - 快照用于优化事件溯源性能
 * - 定期创建快照以减少事件重放时间
 * - 支持快照压缩和存储优化
 * - 提供快照版本管理和兼容性
 */
export interface ISnapshotManager {
  /**
   * @method createSnapshot
   * @description 创建聚合根快照
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param aggregateData 聚合根数据
   * @param version 版本号
   * @returns Promise<string> 快照ID
   */
  createSnapshot(
    aggregateId: string,
    aggregateType: string,
    aggregateData: Record<string, any>,
    version: number
  ): Promise<string>;

  /**
   * @method getLatestSnapshot
   * @description 获取聚合根的最新快照
   * @param aggregateId 聚合根ID
   * @returns Promise<Snapshot | null>
   */
  getLatestSnapshot(aggregateId: string): Promise<Snapshot | null>;

  /**
   * @method getSnapshot
   * @description 获取指定版本的快照
   * @param aggregateId 聚合根ID
   * @param version 版本号
   * @returns Promise<Snapshot | null>
   */
  getSnapshot(aggregateId: string, version: number): Promise<Snapshot | null>;

  /**
   * @method getSnapshots
   * @description 获取聚合根的所有快照
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号（可选）
   * @param toVersion 结束版本号（可选）
   * @returns Promise<Snapshot[]>
   */
  getSnapshots(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<Snapshot[]>;

  /**
   * @method deleteSnapshot
   * @description 删除指定快照
   * @param snapshotId 快照ID
   * @returns Promise<void>
   */
  deleteSnapshot(snapshotId: string): Promise<void>;

  /**
   * @method deleteSnapshots
   * @description 删除聚合根的所有快照
   * @param aggregateId 聚合根ID
   * @returns Promise<void>
   */
  deleteSnapshots(aggregateId: string): Promise<void>;

  /**
   * @method cleanupOldSnapshots
   * @description 清理旧的快照
   * @param aggregateId 聚合根ID（可选）
   * @param keepCount 保留的快照数量
   * @returns Promise<number> 清理的快照数量
   */
  cleanupOldSnapshots(aggregateId?: string, keepCount?: number): Promise<number>;

  /**
   * @method shouldCreateSnapshot
   * @description 判断是否应该创建快照
   * @param aggregateId 聚合根ID
   * @param currentVersion 当前版本号
   * @param snapshotInterval 快照间隔
   * @returns Promise<boolean>
   */
  shouldCreateSnapshot(
    aggregateId: string,
    currentVersion: number,
    snapshotInterval: number
  ): Promise<boolean>;

  /**
   * @method getSnapshotCount
   * @description 获取快照数量
   * @param aggregateId 聚合根ID（可选）
   * @returns Promise<number>
   */
  getSnapshotCount(aggregateId?: string): Promise<number>;

  /**
   * @method getStats
   * @description 获取快照统计信息
   * @returns Promise<SnapshotStats>
   */
  getStats(): Promise<SnapshotStats>;

  /**
   * @method healthCheck
   * @description 健康检查
   * @returns Promise<boolean>
   */
  healthCheck(): Promise<boolean>;
}

/**
 * @interface Snapshot
 * @description 快照数据结构
 */
export interface Snapshot {
  /**
   * 快照ID
   */
  readonly id: string;

  /**
   * 聚合根ID
   */
  readonly aggregateId: string;

  /**
   * 聚合根类型
   */
  readonly aggregateType: string;

  /**
   * 版本号
   */
  readonly version: number;

  /**
   * 聚合根数据
   */
  readonly data: Record<string, any>;

  /**
   * 创建时间
   */
  readonly createdAt: Date;

  /**
   * 元数据
   */
  readonly metadata?: Record<string, any>;
}

/**
 * @interface SnapshotStats
 * @description 快照统计信息
 */
export interface SnapshotStats {
  /**
   * 总快照数量
   */
  totalSnapshots: number;

  /**
   * 聚合根数量
   */
  totalAggregates: number;

  /**
   * 平均每个聚合根的快照数量
   */
  averageSnapshotsPerAggregate: number;

  /**
   * 存储大小（字节）
   */
  storageSize: number;

  /**
   * 最后快照时间
   */
  lastSnapshotTimestamp: Date | null;

  /**
   * 按聚合根类型分组的快照数量
   */
  snapshotsByType: Record<string, number>;
}

/**
 * @interface SnapshotOptions
 * @description 快照配置选项
 */
export interface SnapshotOptions {
  /**
   * 快照间隔（事件数量）
   */
  interval: number;

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean;

  /**
   * 压缩算法
   */
  compressionAlgorithm?: 'gzip' | 'lz4' | 'zstd';

  /**
   * 快照保留策略
   */
  retention?: {
    /**
     * 保留的快照数量
     */
    keepCount?: number;

    /**
     * 保留天数
     */
    keepDays?: number;

    /**
     * 是否自动清理
     */
    autoCleanup?: boolean;
  };

  /**
   * 存储配置
   */
  storage?: {
    /**
     * 存储类型
     */
    type: 'database' | 'file' | 'redis';

    /**
     * 表/集合名称
     */
    tableName?: string;

    /**
     * 文件路径（文件存储）
     */
    filePath?: string;
  };

  /**
   * 是否启用调试模式
   */
  debug?: boolean;
}

/**
 * @class SnapshotManagerException
 * @description 快照管理器异常
 */
export class SnapshotManagerException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SnapshotManagerException';
  }
}

/**
 * @class SnapshotNotFoundException
 * @description 快照未找到异常
 */
export class SnapshotNotFoundException extends SnapshotManagerException {
  constructor(snapshotId: string) {
    super(
      `Snapshot with id ${snapshotId} not found`,
      'SNAPSHOT_NOT_FOUND',
      { snapshotId }
    );
    this.name = 'SnapshotNotFoundException';
  }
}

/**
 * @class SnapshotCreationException
 * @description 快照创建异常
 */
export class SnapshotCreationException extends SnapshotManagerException {
  constructor(aggregateId: string, error: Error) {
    super(
      `Failed to create snapshot for aggregate ${aggregateId}: ${error.message}`,
      'SNAPSHOT_CREATION_FAILED',
      { aggregateId, originalError: error.message }
    );
    this.name = 'SnapshotCreationException';
  }
}

/**
 * @abstract class BaseSnapshotManager
 * @description 快照管理器基类，提供通用实现
 */
export abstract class BaseSnapshotManager implements ISnapshotManager {
  protected options: SnapshotOptions;

  constructor(options: SnapshotOptions) {
    this.options = options;
  }

  /**
   * @method createSnapshot
   * @description 创建聚合根快照
   */
  async createSnapshot(
    aggregateId: string,
    aggregateType: string,
    aggregateData: Record<string, any>,
    version: number
  ): Promise<string> {
    try {
      const snapshotId = this.generateSnapshotId();
      const now = new Date();

      const snapshot: Snapshot = {
        id: snapshotId,
        aggregateId,
        aggregateType,
        version,
        data: this.compressData(aggregateData),
        createdAt: now,
        metadata: {
          createdBy: 'system',
          compressionAlgorithm: this.options.compressionAlgorithm || 'none'
        }
      };

      await this.saveSnapshot(snapshot);

      if (this.options.debug) {
        console.log(`Created snapshot ${snapshotId} for aggregate ${aggregateId} at version ${version}`);
      }

      return snapshotId;
    } catch (error) {
      throw new SnapshotCreationException(aggregateId, error as Error);
    }
  }

  /**
   * @method shouldCreateSnapshot
   * @description 判断是否应该创建快照
   */
  async shouldCreateSnapshot(
    aggregateId: string,
    currentVersion: number,
    snapshotInterval: number
  ): Promise<boolean> {
    const latestSnapshot = await this.getLatestSnapshot(aggregateId);

    if (!latestSnapshot) {
      // 没有快照，创建第一个
      return currentVersion >= snapshotInterval;
    }

    // 检查是否需要创建新快照
    return currentVersion - latestSnapshot.version >= snapshotInterval;
  }

  /**
   * @method cleanupOldSnapshots
   * @description 清理旧的快照
   */
  async cleanupOldSnapshots(aggregateId?: string, keepCount: number = 5): Promise<number> {
    if (!this.options.retention?.autoCleanup) {
      return 0;
    }

    let deletedCount = 0;

    if (aggregateId) {
      // 清理特定聚合根的快照
      const snapshots = await this.getSnapshots(aggregateId);
      if (snapshots.length > keepCount) {
        const toDelete = snapshots
          .sort((a, b) => b.version - a.version)
          .slice(keepCount);

        for (const snapshot of toDelete) {
          await this.deleteSnapshot(snapshot.id);
          deletedCount++;
        }
      }
    } else {
      // 清理所有聚合根的旧快照
      const stats = await this.getStats();
      // 这里需要实现具体的清理逻辑
      // 由于需要获取所有聚合根，可能需要子类实现
    }

    return deletedCount;
  }

  /**
   * @method compressData
   * @description 压缩数据
   */
  protected compressData(data: Record<string, any>): Record<string, any> {
    if (!this.options.enableCompression || !this.options.compressionAlgorithm) {
      return data;
    }

    // 这里实现具体的压缩逻辑
    // 可以根据不同的压缩算法实现
    return data;
  }

  /**
   * @method decompressData
   * @description 解压数据
   */
  protected decompressData(data: Record<string, any>): Record<string, any> {
    if (!this.options.enableCompression) {
      return data;
    }

    // 这里实现具体的解压逻辑
    return data;
  }

  /**
   * @method generateSnapshotId
   * @description 生成快照ID
   */
  protected generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * @abstract method saveSnapshot
   * @description 保存快照，子类必须实现
   */
  protected abstract saveSnapshot(snapshot: Snapshot): Promise<void>;

  /**
   * @abstract method loadSnapshot
   * @description 加载快照，子类必须实现
   */
  protected abstract loadSnapshot(snapshotId: string): Promise<Snapshot | null>;

  /**
   * @abstract method loadSnapshots
   * @description 加载快照列表，子类必须实现
   */
  protected abstract loadSnapshots(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<Snapshot[]>;

  /**
   * @abstract method removeSnapshot
   * @description 删除快照，子类必须实现
   */
  protected abstract removeSnapshot(snapshotId: string): Promise<void>;

  // 实现其他接口方法...
  async getLatestSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const snapshots = await this.getSnapshots(aggregateId);
    if (snapshots.length === 0) {
      return null;
    }

    return snapshots.sort((a, b) => b.version - a.version)[0];
  }

  async getSnapshot(aggregateId: string, version: number): Promise<Snapshot | null> {
    const snapshots = await this.getSnapshots(aggregateId);
    return snapshots.find(s => s.version === version) || null;
  }

  async getSnapshots(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<Snapshot[]> {
    return await this.loadSnapshots(aggregateId, fromVersion, toVersion);
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await this.removeSnapshot(snapshotId);
  }

  async deleteSnapshots(aggregateId: string): Promise<void> {
    const snapshots = await this.getSnapshots(aggregateId);
    for (const snapshot of snapshots) {
      await this.deleteSnapshot(snapshot.id);
    }
  }

  async getSnapshotCount(aggregateId?: string): Promise<number> {
    if (aggregateId) {
      const snapshots = await this.getSnapshots(aggregateId);
      return snapshots.length;
    }

    // 需要子类实现获取总快照数量的逻辑
    return 0;
  }

  async getStats(): Promise<SnapshotStats> {
    // 需要子类实现获取统计信息的逻辑
    return {
      totalSnapshots: 0,
      totalAggregates: 0,
      averageSnapshotsPerAggregate: 0,
      storageSize: 0,
      lastSnapshotTimestamp: null,
      snapshotsByType: {}
    };
  }

  async healthCheck(): Promise<boolean> {
    // 需要子类实现健康检查逻辑
    return true;
  }
}
