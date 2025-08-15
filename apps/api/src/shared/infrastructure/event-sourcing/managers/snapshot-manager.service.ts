import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @interface Snapshot
 * @description 快照接口。
 */
export interface Snapshot {
  /** 快照ID */
  snapshotId: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 聚合根版本 */
  aggregateVersion: number;
  /** 聚合根状态 */
  aggregateState: any;
  /** 快照元数据 */
  metadata?: Record<string, any>;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * @interface SnapshotConfig
 * @description 快照配置接口。
 */
export interface SnapshotConfig {
  /** 是否启用快照管理 */
  enabled?: boolean;
  /** 快照间隔（事件数量） */
  snapshotInterval?: number;
  /** 快照保留策略 */
  retentionPolicy?: 'keep_all' | 'keep_latest' | 'keep_by_count' | 'keep_by_age';
  /** 保留的快照数量 */
  retentionCount?: number;
  /** 保留的天数 */
  retentionDays?: number;
  /** 是否启用快照压缩 */
  enableCompression?: boolean;
  /** 压缩算法 */
  compressionAlgorithm?: 'gzip' | 'lz4' | 'zstd';
  /** 是否启用快照加密 */
  enableEncryption?: boolean;
  /** 加密密钥 */
  encryptionKey?: string;
  /** 是否启用快照统计 */
  enableStats?: boolean;
  /** 是否启用快照事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 快照存储路径 */
  storagePath?: string;
  /** 最大快照大小（字节） */
  maxSnapshotSize?: number;
  /** 快照验证 */
  enableValidation?: boolean;
}

/**
 * @interface SnapshotStats
 * @description 快照统计信息接口。
 */
export interface SnapshotStats {
  /** 总快照数 */
  totalSnapshots: number;
  /** 成功创建数 */
  successfulCreations: number;
  /** 失败创建数 */
  failedCreations: number;
  /** 成功恢复数 */
  successfulRestorations: number;
  /** 失败恢复数 */
  failedRestorations: number;
  /** 成功删除数 */
  successfulDeletions: number;
  /** 失败删除数 */
  failedDeletions: number;
  /** 总存储大小（字节） */
  totalStorageSize: number;
  /** 平均快照大小（字节） */
  averageSnapshotSize: number;
  /** 最大快照大小（字节） */
  maxSnapshotSize: number;
  /** 最小快照大小（字节） */
  minSnapshotSize: number;
  /** 压缩率 */
  compressionRatio: number;
  /** 错误次数 */
  errorCount: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * @interface SnapshotResult
 * @description 快照操作结果接口。
 */
export interface SnapshotResult {
  /** 是否成功 */
  success: boolean;
  /** 快照ID */
  snapshotId?: string;
  /** 错误信息 */
  error?: string;
  /** 操作时间（毫秒） */
  operationTime?: number;
  /** 快照大小（字节） */
  snapshotSize?: number;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface SnapshotQuery
 * @description 快照查询接口。
 */
export interface SnapshotQuery {
  /** 聚合根ID */
  aggregateId?: string;
  /** 聚合根类型 */
  aggregateType?: string;
  /** 最小版本 */
  minVersion?: number;
  /** 最大版本 */
  maxVersion?: number;
  /** 开始时间 */
  startTime?: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 限制数量 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
}

/**
 * @class SnapshotManagerService
 * @description
 * 快照管理器服务，负责管理聚合根的快照创建、存储和恢复。
 * 
 * 主要功能包括：
 * 1. 快照创建和存储
 * 2. 快照恢复和重建
 * 3. 快照清理和保留策略
 * 4. 快照压缩和加密
 * 5. 快照统计和监控
 * 6. 快照验证和完整性检查
 * 
 * 设计原则：
 * - 性能优化：通过快照减少事件重放时间
 * - 存储效率：支持压缩和智能保留策略
 * - 数据安全：支持加密和完整性验证
 * - 可观测性：详细的统计和监控信息
 * - 灵活性：支持多种存储和压缩策略
 */
@Injectable()
export class SnapshotManagerService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: SnapshotConfig;

  /**
   * 快照存储
   */
  private snapshots: Map<string, Snapshot> = new Map();

  /**
   * 聚合根版本跟踪
   */
  private aggregateVersions: Map<string, number> = new Map();

  /**
   * 快照统计
   */
  private stats: SnapshotStats;

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 清理定时器
   */
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    @Inject('SNAPSHOT_CONFIG') config: SnapshotConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      snapshotInterval: 100,
      retentionPolicy: 'keep_latest',
      retentionCount: 10,
      retentionDays: 30,
      enableCompression: true,
      compressionAlgorithm: 'gzip',
      enableEncryption: false,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      storagePath: './snapshots',
      maxSnapshotSize: 10 * 1024 * 1024, // 10MB
      enableValidation: true,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();
    this.startCleanup();

    this.logger.info('SnapshotManagerService initialized', LogContext.DATABASE);
  }

  /**
   * @method createSnapshot
   * @description 创建快照
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param aggregateState 聚合根状态
   * @param aggregateVersion 聚合根版本
   * @param metadata 元数据
   * @returns {Promise<SnapshotResult>} 快照结果
   */
  async createSnapshot(
    aggregateId: string,
    aggregateType: string,
    aggregateState: any,
    aggregateVersion: number,
    metadata?: Record<string, any>
  ): Promise<SnapshotResult> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Snapshot management is disabled', LogContext.DATABASE);
        return {
          success: false,
          error: 'Snapshot management is disabled',
          operationTime: Date.now() - startTime,
        };
      }

      // 检查是否需要创建快照
      if (!this.shouldCreateSnapshot(aggregateId, aggregateVersion)) {
        return {
          success: true,
          operationTime: Date.now() - startTime,
        };
      }

      // 验证聚合根状态
      if (this.config.enableValidation && !this.validateAggregateState(aggregateState)) {
        throw new Error('Invalid aggregate state');
      }

      // 创建快照
      const snapshotId = uuidv4();
      const snapshot: Snapshot = {
        snapshotId,
        aggregateId,
        aggregateType,
        aggregateVersion,
        aggregateState: this.processAggregateState(aggregateState),
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 存储快照
      await this.storeSnapshot(snapshot);

      // 更新版本跟踪
      this.aggregateVersions.set(aggregateId, aggregateVersion);

      // 更新统计
      this.updateStats('creation', Date.now() - startTime, true, snapshot);

      this.logger.debug(`Snapshot created: ${snapshotId} for ${aggregateType}:${aggregateId}`, LogContext.DATABASE);
      this.emitEvent('snapshot_created', { snapshot });

      return {
        success: true,
        snapshotId,
        operationTime: Date.now() - startTime,
        snapshotSize: this.calculateSnapshotSize(snapshot),
        metadata: snapshot.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to create snapshot: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('creation', Date.now() - startTime, false);
      this.emitEvent('snapshot_creation_failed', { error, aggregateId, aggregateType });

      return {
        success: false,
        error: error.message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * @method getSnapshot
   * @description 获取快照
   * @param snapshotId 快照ID
   * @returns {Promise<Snapshot | null>} 快照
   */
  async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      const snapshot = this.snapshots.get(snapshotId);
      if (!snapshot) {
        return null;
      }

      // 验证快照完整性
      if (this.config.enableValidation && !this.validateSnapshot(snapshot)) {
        this.logger.warn(`Invalid snapshot detected: ${snapshotId}`, LogContext.DATABASE);
        return null;
      }

      return this.processSnapshotForRetrieval(snapshot);
    } catch (error) {
      this.logger.error(`Failed to get snapshot: ${error.message}`, LogContext.DATABASE, undefined, error);
      return null;
    }
  }

  /**
   * @method getLatestSnapshot
   * @description 获取最新快照
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @returns {Promise<Snapshot | null>} 快照
   */
  async getLatestSnapshot(aggregateId: string, aggregateType: string): Promise<Snapshot | null> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      const snapshots = Array.from(this.snapshots.values())
        .filter(s => s.aggregateId === aggregateId && s.aggregateType === aggregateType)
        .sort((a, b) => b.aggregateVersion - a.aggregateVersion);

      if (snapshots.length === 0) {
        return null;
      }

      const latestSnapshot = snapshots[0];

      // 验证快照完整性
      if (this.config.enableValidation && !this.validateSnapshot(latestSnapshot)) {
        this.logger.warn(`Invalid latest snapshot detected: ${latestSnapshot.snapshotId}`, LogContext.DATABASE);
        return null;
      }

      return this.processSnapshotForRetrieval(latestSnapshot);
    } catch (error) {
      this.logger.error(`Failed to get latest snapshot: ${error.message}`, LogContext.DATABASE, undefined, error);
      return null;
    }
  }

  /**
   * @method querySnapshots
   * @description 查询快照
   * @param query 查询条件
   * @returns {Promise<Snapshot[]>} 快照列表
   */
  async querySnapshots(query: SnapshotQuery): Promise<Snapshot[]> {
    try {
      if (!this.config.enabled) {
        return [];
      }

      let snapshots = Array.from(this.snapshots.values());

      // 应用过滤条件
      if (query.aggregateId) {
        snapshots = snapshots.filter(s => s.aggregateId === query.aggregateId);
      }

      if (query.aggregateType) {
        snapshots = snapshots.filter(s => s.aggregateType === query.aggregateType);
      }

      if (query.minVersion !== undefined) {
        snapshots = snapshots.filter(s => s.aggregateVersion >= query.minVersion!);
      }

      if (query.maxVersion !== undefined) {
        snapshots = snapshots.filter(s => s.aggregateVersion <= query.maxVersion!);
      }

      if (query.startTime) {
        snapshots = snapshots.filter(s => s.createdAt >= query.startTime!);
      }

      if (query.endTime) {
        snapshots = snapshots.filter(s => s.createdAt <= query.endTime!);
      }

      // 排序
      snapshots.sort((a, b) => b.aggregateVersion - a.aggregateVersion);

      // 分页
      if (query.offset) {
        snapshots = snapshots.slice(query.offset);
      }

      if (query.limit) {
        snapshots = snapshots.slice(0, query.limit);
      }

      // 验证快照完整性
      if (this.config.enableValidation) {
        snapshots = snapshots.filter(s => this.validateSnapshot(s));
      }

      return snapshots.map(s => this.processSnapshotForRetrieval(s));
    } catch (error) {
      this.logger.error(`Failed to query snapshots: ${error.message}`, LogContext.DATABASE, undefined, error);
      return [];
    }
  }

  /**
   * @method deleteSnapshot
   * @description 删除快照
   * @param snapshotId 快照ID
   * @returns {Promise<SnapshotResult>} 删除结果
   */
  async deleteSnapshot(snapshotId: string): Promise<SnapshotResult> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        return {
          success: false,
          error: 'Snapshot management is disabled',
          operationTime: Date.now() - startTime,
        };
      }

      const snapshot = this.snapshots.get(snapshotId);
      if (!snapshot) {
        // 更新统计 - 快照不存在也算作删除失败
        this.updateStats('deletion', Date.now() - startTime, false);

        return {
          success: false,
          error: 'Snapshot not found',
          operationTime: Date.now() - startTime,
        };
      }

      // 删除快照
      await this.removeSnapshot(snapshotId);

      // 更新统计
      this.updateStats('deletion', Date.now() - startTime, true, snapshot);

      this.logger.debug(`Snapshot deleted: ${snapshotId}`, LogContext.DATABASE);
      this.emitEvent('snapshot_deleted', { snapshot });

      return {
        success: true,
        snapshotId,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Failed to delete snapshot: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('deletion', Date.now() - startTime, false);
      this.emitEvent('snapshot_deletion_failed', { error, snapshotId });

      return {
        success: false,
        error: error.message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * @method cleanupSnapshots
   * @description 清理快照
   * @returns {Promise<SnapshotResult[]>} 清理结果
   */
  async cleanupSnapshots(): Promise<SnapshotResult[]> {
    const startTime = Date.now();
    const results: SnapshotResult[] = [];

    try {
      if (!this.config.enabled) {
        return [];
      }

      const snapshotsToDelete = this.getSnapshotsToDelete();

      for (const snapshot of snapshotsToDelete) {
        const result = await this.deleteSnapshot(snapshot.snapshotId);
        results.push(result);
      }

      this.logger.info(`Snapshot cleanup completed: ${results.length} snapshots processed`, LogContext.DATABASE);
      this.emitEvent('snapshot_cleanup_completed', { results, operationTime: Date.now() - startTime });

      return results;
    } catch (error) {
      this.logger.error(`Failed to cleanup snapshots: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.emitEvent('snapshot_cleanup_failed', { error, operationTime: Date.now() - startTime });
      return results;
    }
  }

  /**
   * @method getStats
   * @description 获取快照统计信息
   * @returns {SnapshotStats} 统计信息
   */
  getStats(): SnapshotStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Snapshot manager stats reset', LogContext.DATABASE);
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

      const storageHealth = this.snapshots.size < 10000; // 简单的存储健康检查
      const statsHealth = this.stats.errorCount < 50; // 降低错误数量阈值

      const isHealthy = storageHealth && statsHealth;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          totalSnapshots: this.stats.totalSnapshots,
          totalStorageSize: this.stats.totalStorageSize,
          errorCount: this.stats.errorCount,
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
    this.stopCleanup();
    this.logger.info('SnapshotManagerService destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method shouldCreateSnapshot
   * @description 判断是否应该创建快照
   * @param aggregateId 聚合根ID
   * @param aggregateVersion 聚合根版本
   * @returns {boolean} 是否应该创建快照
   */
  private shouldCreateSnapshot(aggregateId: string, aggregateVersion: number): boolean {
    const lastVersion = this.aggregateVersions.get(aggregateId) || 0;
    return aggregateVersion - lastVersion >= this.config.snapshotInterval!;
  }

  /**
   * @private
   * @method validateAggregateState
   * @description 验证聚合根状态
   * @param aggregateState 聚合根状态
   * @returns {boolean} 是否有效
   */
  private validateAggregateState(aggregateState: any): boolean {
    if (!aggregateState) {
      return false;
    }

    // 基本验证：检查状态是否为对象
    if (typeof aggregateState !== 'object') {
      return false;
    }

    // 可以添加更多验证逻辑
    return true;
  }

  /**
   * @private
   * @method processAggregateState
   * @description 处理聚合根状态（压缩、加密等）
   * @param aggregateState 聚合根状态
   * @returns {any} 处理后的状态
   */
  private processAggregateState(aggregateState: any): any {
    let processedState = aggregateState;

    // 压缩
    if (this.config.enableCompression) {
      processedState = this.compress(processedState);
    }

    // 加密
    if (this.config.enableEncryption) {
      processedState = this.encrypt(processedState);
    }

    return processedState;
  }

  /**
   * @private
   * @method processSnapshotForRetrieval
   * @description 处理快照用于检索（解压缩、解密等）
   * @param snapshot 快照
   * @returns {Snapshot} 处理后的快照
   */
  private processSnapshotForRetrieval(snapshot: Snapshot): Snapshot {
    const processedSnapshot = { ...snapshot };

    // 解密
    if (this.config.enableEncryption) {
      processedSnapshot.aggregateState = this.decrypt(processedSnapshot.aggregateState);
    }

    // 解压缩
    if (this.config.enableCompression) {
      processedSnapshot.aggregateState = this.decompress(processedSnapshot.aggregateState);
    }

    return processedSnapshot;
  }

  /**
   * @private
   * @method validateSnapshot
   * @description 验证快照完整性
   * @param snapshot 快照
   * @returns {boolean} 是否有效
   */
  private validateSnapshot(snapshot: Snapshot): boolean {
    if (!snapshot.snapshotId || !snapshot.aggregateId || !snapshot.aggregateType) {
      return false;
    }

    if (snapshot.aggregateVersion < 0) {
      return false;
    }

    if (!snapshot.aggregateState) {
      return false;
    }

    // 可以添加更多验证逻辑
    return true;
  }

  /**
   * @private
   * @method storeSnapshot
   * @description 存储快照
   * @param snapshot 快照
   */
  private async storeSnapshot(snapshot: Snapshot): Promise<void> {
    // 检查快照大小
    const snapshotSize = this.calculateSnapshotSize(snapshot);
    if (snapshotSize > this.config.maxSnapshotSize!) {
      throw new Error(`Snapshot size exceeds maximum allowed size: ${snapshotSize} bytes`);
    }

    // 存储到内存（实际应用中应该存储到数据库或文件系统）
    this.snapshots.set(snapshot.snapshotId, snapshot);
  }

  /**
   * @private
   * @method removeSnapshot
   * @description 移除快照
   * @param snapshotId 快照ID
   */
  private async removeSnapshot(snapshotId: string): Promise<void> {
    this.snapshots.delete(snapshotId);
  }

  /**
   * @private
   * @method getSnapshotsToDelete
   * @description 获取需要删除的快照
   * @returns {Snapshot[]} 需要删除的快照列表
   */
  private getSnapshotsToDelete(): Snapshot[] {
    const snapshots = Array.from(this.snapshots.values());

    switch (this.config.retentionPolicy) {
      case 'keep_all':
        return [];

      case 'keep_latest':
        // 保留每个聚合根的最新快照
        const latestSnapshots = new Map<string, Snapshot>();
        for (const snapshot of snapshots) {
          const key = `${snapshot.aggregateId}:${snapshot.aggregateType}`;
          const existing = latestSnapshots.get(key);
          if (!existing || snapshot.aggregateVersion > existing.aggregateVersion) {
            latestSnapshots.set(key, snapshot);
          }
        }
        return snapshots.filter(s => {
          const key = `${s.aggregateId}:${s.aggregateType}`;
          return latestSnapshots.get(key)?.snapshotId !== s.snapshotId;
        });

      case 'keep_by_count':
        // 保留指定数量的快照
        const snapshotsByAggregate = new Map<string, Snapshot[]>();
        for (const snapshot of snapshots) {
          const key = `${snapshot.aggregateId}:${snapshot.aggregateType}`;
          if (!snapshotsByAggregate.has(key)) {
            snapshotsByAggregate.set(key, []);
          }
          snapshotsByAggregate.get(key)!.push(snapshot);
        }

        const toDelete: Snapshot[] = [];
        for (const [key, aggregateSnapshots] of snapshotsByAggregate) {
          aggregateSnapshots.sort((a, b) => b.aggregateVersion - a.aggregateVersion);
          const excessSnapshots = aggregateSnapshots.slice(this.config.retentionCount!);
          toDelete.push(...excessSnapshots);
        }
        return toDelete;

      case 'keep_by_age':
        // 保留指定天数内的快照
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays!);
        return snapshots.filter(s => s.createdAt < cutoffDate);

      default:
        return [];
    }
  }

  /**
   * @private
   * @method calculateSnapshotSize
   * @description 计算快照大小
   * @param snapshot 快照
   * @returns {number} 快照大小（字节）
   */
  private calculateSnapshotSize(snapshot: Snapshot): number {
    const snapshotString = JSON.stringify(snapshot);
    return Buffer.byteLength(snapshotString, 'utf8');
  }

  /**
   * @private
   * @method compress
   * @description 压缩数据
   * @param data 数据
   * @returns {any} 压缩后的数据
   */
  private compress(data: any): any {
    // 简化的压缩实现（实际应用中应该使用真正的压缩库）
    const dataString = JSON.stringify(data);
    return Buffer.from(dataString).toString('base64');
  }

  /**
   * @private
   * @method decompress
   * @description 解压缩数据
   * @param data 压缩的数据
   * @returns {any} 解压缩后的数据
   */
  private decompress(data: any): any {
    // 简化的解压缩实现
    if (typeof data === 'string') {
      try {
        const decoded = Buffer.from(data, 'base64').toString();
        return JSON.parse(decoded);
      } catch {
        return data;
      }
    }
    return data;
  }

  /**
   * @private
   * @method encrypt
   * @description 加密数据
   * @param data 数据
   * @returns {any} 加密后的数据
   */
  private encrypt(data: any): any {
    // 简化的加密实现（实际应用中应该使用真正的加密库）
    const dataString = JSON.stringify(data);
    return Buffer.from(dataString).toString('base64');
  }

  /**
   * @private
   * @method decrypt
   * @description 解密数据
   * @param data 加密的数据
   * @returns {any} 解密后的数据
   */
  private decrypt(data: any): any {
    // 简化的解密实现
    if (typeof data === 'string') {
      try {
        const decoded = Buffer.from(data, 'base64').toString();
        return JSON.parse(decoded);
      } catch {
        return data;
      }
    }
    return data;
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param type 统计类型
   * @param operationTime 操作时间
   * @param success 是否成功
   * @param snapshot 快照
   */
  private updateStats(type: string, operationTime: number, success: boolean, snapshot?: Snapshot): void {
    this.stats.lastUpdated = new Date();

    if (type === 'creation') {
      this.stats.totalSnapshots++;
      if (success) {
        this.stats.successfulCreations++;
        if (snapshot) {
          const snapshotSize = this.calculateSnapshotSize(snapshot);
          this.stats.totalStorageSize += snapshotSize;
          this.stats.averageSnapshotSize =
            (this.stats.averageSnapshotSize * (this.stats.successfulCreations - 1) + snapshotSize) / this.stats.successfulCreations;

          if (snapshotSize > this.stats.maxSnapshotSize) {
            this.stats.maxSnapshotSize = snapshotSize;
          }

          if (snapshotSize < this.stats.minSnapshotSize || this.stats.minSnapshotSize === 0) {
            this.stats.minSnapshotSize = snapshotSize;
          }
        }
      } else {
        this.stats.failedCreations++;
      }
    } else if (type === 'restoration') {
      if (success) {
        this.stats.successfulRestorations++;
      } else {
        this.stats.failedRestorations++;
      }
    } else if (type === 'deletion') {
      if (success) {
        this.stats.successfulDeletions++;
        if (snapshot) {
          const snapshotSize = this.calculateSnapshotSize(snapshot);
          this.stats.totalStorageSize = Math.max(0, this.stats.totalStorageSize - snapshotSize);
        }
      } else {
        this.stats.failedDeletions++;
      }
    }

    if (!success) {
      this.stats.errorCount++;
    }
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {SnapshotStats} 初始统计信息
   */
  private initializeStats(): SnapshotStats {
    return {
      totalSnapshots: 0,
      successfulCreations: 0,
      failedCreations: 0,
      successfulRestorations: 0,
      failedRestorations: 0,
      successfulDeletions: 0,
      failedDeletions: 0,
      totalStorageSize: 0,
      averageSnapshotSize: 0,
      maxSnapshotSize: 0,
      minSnapshotSize: 0,
      compressionRatio: 0,
      errorCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送快照管理器事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`snapshotmanager.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'snapshot-manager-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit snapshot manager event: ${type}`, LogContext.DATABASE, undefined, error);
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
          this.logger.error('Snapshot manager monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started snapshot manager monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
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
      this.logger.info('Stopped snapshot manager monitoring', LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method startCleanup
   * @description 开始清理
   */
  private startCleanup(): void {
    // 每小时执行一次清理
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupSnapshots();
      } catch (error) {
        this.logger.error('Snapshot manager cleanup failed', LogContext.DATABASE, undefined, error);
      }
    }, 60 * 60 * 1000); // 1小时

    this.logger.info('Started snapshot manager cleanup, interval: 1 hour', LogContext.DATABASE);
  }

  /**
   * @private
   * @method stopCleanup
   * @description 停止清理
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.info('Stopped snapshot manager cleanup', LogContext.DATABASE);
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

      this.logger.debug(`Snapshot manager monitoring: ${this.stats.totalSnapshots} snapshots, ${this.stats.totalStorageSize} bytes`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Snapshot manager monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }
}
