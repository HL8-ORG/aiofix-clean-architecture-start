import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventType, EventStatus } from '../stores/postgres-event-store';
import { SnapshotManagerService } from '../managers/snapshot-manager.service';

/**
 * @interface EventReplayConfig
 * @description 事件重放配置接口。
 */
export interface EventReplayConfig {
  /** 是否启用事件重放 */
  enabled?: boolean;
  /** 重放批次大小 */
  batchSize?: number;
  /** 重放并发数 */
  concurrency?: number;
  /** 重放超时时间（毫秒） */
  timeout?: number;
  /** 重放重试次数 */
  retries?: number;
  /** 重放重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用快照优化 */
  enableSnapshotOptimization?: boolean;
  /** 快照优化阈值 */
  snapshotOptimizationThreshold?: number;
  /** 是否启用事件过滤 */
  enableEventFiltering?: boolean;
  /** 是否启用重放验证 */
  enableReplayValidation?: boolean;
  /** 是否启用重放统计 */
  enableStats?: boolean;
  /** 是否启用重放事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 最大重放事件数 */
  maxReplayEvents?: number;
  /** 重放进度报告间隔 */
  progressReportInterval?: number;
}

/**
 * @interface ReplayRequest
 * @description 重放请求接口。
 */
export interface ReplayRequest {
  /** 聚合根ID */
  aggregateId: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 开始版本 */
  fromVersion?: number;
  /** 结束版本 */
  toVersion?: number;
  /** 开始时间 */
  fromTime?: Date;
  /** 结束时间 */
  toTime?: Date;
  /** 事件类型过滤 */
  eventTypes?: EventType[];
  /** 重放选项 */
  options?: ReplayOptions;
}

/**
 * @interface ReplayOptions
 * @description 重放选项接口。
 */
export interface ReplayOptions {
  /** 是否使用快照优化 */
  useSnapshot?: boolean;
  /** 是否验证重放结果 */
  validateResult?: boolean;
  /** 是否包含事件元数据 */
  includeMetadata?: boolean;
  /** 是否包含事件数据 */
  includeEventData?: boolean;
  /** 重放模式 */
  replayMode?: 'full' | 'incremental' | 'selective';
  /** 重放策略 */
  replayStrategy?: 'sequential' | 'parallel' | 'batch';
  /** 错误处理策略 */
  errorStrategy?: 'stop' | 'skip' | 'retry';
  /** 进度回调 */
  onProgress?: (progress: ReplayProgress) => void;
}

/**
 * @interface ReplayResult
 * @description 重放结果接口。
 */
export interface ReplayResult {
  /** 重放ID */
  replayId: string;
  /** 聚合根ID */
  aggregateId: string;
  /** 聚合根类型 */
  aggregateType: string;
  /** 重放状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** 重放的事件数量 */
  eventsProcessed: number;
  /** 重放的事件版本范围 */
  versionRange: {
    from: number;
    to: number;
  };
  /** 重放的时间范围 */
  timeRange: {
    from: Date;
    to: Date;
  };
  /** 最终聚合状态 */
  finalState: any;
  /** 重放统计 */
  stats: ReplayStats;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startedAt: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 重放时间（毫秒） */
  replayTime?: number;
}

/**
 * @interface ReplayProgress
 * @description 重放进度接口。
 */
export interface ReplayProgress {
  /** 重放ID */
  replayId: string;
  /** 当前进度百分比 */
  percentage: number;
  /** 已处理事件数 */
  eventsProcessed: number;
  /** 总事件数 */
  totalEvents: number;
  /** 当前版本 */
  currentVersion: number;
  /** 开始时间 */
  startedAt: Date;
  /** 预计完成时间 */
  estimatedCompletion?: Date;
  /** 处理速率（事件/秒） */
  processingRate: number;
  /** 状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * @interface ReplayStats
 * @description 重放统计接口。
 */
export interface ReplayStats {
  /** 总事件数 */
  totalEvents: number;
  /** 成功处理事件数 */
  successfulEvents: number;
  /** 失败事件数 */
  failedEvents: number;
  /** 跳过事件数 */
  skippedEvents: number;
  /** 重试次数 */
  retryCount: number;
  /** 快照使用次数 */
  snapshotUsageCount: number;
  /** 平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 总处理时间（毫秒） */
  totalProcessingTime: number;
  /** 内存使用量（字节） */
  memoryUsage: number;
  /** 错误详情 */
  errors: Array<{
    eventId: string;
    version: number;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * @interface AggregateStateBuilder
 * @description 聚合状态构建器接口。
 */
export interface AggregateStateBuilder {
  /** 聚合根类型 */
  aggregateType: string;
  /** 构建初始状态 */
  buildInitialState(): any;
  /** 应用事件到状态 */
  applyEvent(state: any, event: any): any;
  /** 验证状态 */
  validateState(state: any): boolean;
  /** 状态序列化 */
  serializeState(state: any): any;
  /** 状态反序列化 */
  deserializeState(data: any): any;
}

/**
 * @class EventReplayService
 * @description
 * 事件重放服务，负责从事件存储中重放事件来重建聚合根状态。
 * 
 * 主要功能包括：
 * 1. 事件重放和状态重建
 * 2. 快照优化和性能提升
 * 3. 重放进度监控和报告
 * 4. 重放结果验证和统计
 * 5. 并发重放和错误处理
 * 6. 重放策略和模式支持
 * 
 * 设计原则：
 * - 性能优化：通过快照和批量处理提升重放性能
 * - 可靠性保证：完善的错误处理和重试机制
 * - 可观测性：详细的重放进度和统计信息
 * - 灵活性：支持多种重放策略和模式
 * - 可扩展性：支持自定义聚合状态构建器
 */
@Injectable()
export class EventReplayService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventReplayConfig;

  /**
   * 快照管理器
   */
  private snapshotManager: SnapshotManagerService;

  /**
   * 事件存储服务（通过依赖注入获取）
   */
  private eventStore: any; // 实际类型应该是 PostgresEventStore

  /**
   * 事件缓存服务（通过依赖注入获取）
   */
  private eventCache: any; // 实际类型应该是 RedisEventCache

  /**
   * 聚合状态构建器注册表
   */
  private stateBuilders: Map<string, AggregateStateBuilder> = new Map();

  /**
   * 活跃重放任务
   */
  private activeReplays: Map<string, ReplayResult> = new Map();

  /**
   * 重放统计
   */
  private stats: {
    totalReplays: number;
    successfulReplays: number;
    failedReplays: number;
    totalEventsProcessed: number;
    averageReplayTime: number;
    lastUpdated: Date;
  };

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  constructor(
    @Inject('EVENT_REPLAY_CONFIG') config: EventReplayConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService,
    snapshotManager: SnapshotManagerService
  ) {
    this.logger = logger;
    this.snapshotManager = snapshotManager;
    this.config = {
      enabled: true,
      batchSize: 1000,
      concurrency: 5,
      timeout: 300000, // 5分钟
      retries: 3,
      retryDelay: 1000,
      enableSnapshotOptimization: true,
      snapshotOptimizationThreshold: 100,
      enableEventFiltering: true,
      enableReplayValidation: true,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      maxReplayEvents: 100000,
      progressReportInterval: 1000,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();

    this.logger.info('EventReplayService initialized', LogContext.DATABASE);
  }

  /**
   * @method registerStateBuilder
   * @description 注册聚合状态构建器
   * @param builder 状态构建器
   */
  registerStateBuilder(builder: AggregateStateBuilder): void {
    this.stateBuilders.set(builder.aggregateType, builder);
    this.logger.debug(`State builder registered for aggregate type: ${builder.aggregateType}`, LogContext.DATABASE);
  }

  /**
   * @method unregisterStateBuilder
   * @description 取消注册聚合状态构建器
   * @param aggregateType 聚合根类型
   */
  unregisterStateBuilder(aggregateType: string): void {
    this.stateBuilders.delete(aggregateType);
    this.logger.debug(`State builder unregistered for aggregate type: ${aggregateType}`, LogContext.DATABASE);
  }

  /**
   * @method replayAggregate
   * @description 重放聚合根事件
   * @param request 重放请求
   * @returns {Promise<ReplayResult>} 重放结果
   */
  async replayAggregate(request: ReplayRequest): Promise<ReplayResult> {
    const startTime = Date.now();
    const replayId = uuidv4();

    try {
      if (!this.config.enabled) {
        throw new Error('Event replay is disabled');
      }

      // 验证请求参数
      this.validateReplayRequest(request);

      // 获取状态构建器
      const stateBuilder = this.getStateBuilder(request.aggregateType);

      // 创建重放结果
      const replayResult: ReplayResult = {
        replayId,
        aggregateId: request.aggregateId,
        aggregateType: request.aggregateType,
        status: 'pending',
        eventsProcessed: 0,
        versionRange: { from: 0, to: 0 },
        timeRange: { from: new Date(), to: new Date() },
        finalState: null,
        stats: this.initializeReplayStats(),
        startedAt: new Date(),
      };

      // 注册活跃重放
      this.activeReplays.set(replayId, replayResult);

      // 开始重放
      replayResult.status = 'running';
      this.logger.info(`Starting replay: ${replayId} for ${request.aggregateType}:${request.aggregateId}`, LogContext.DATABASE);
      this.emitEvent('replay_started', { replayId, request });

      // 执行重放
      const result = await this.executeReplay(replayResult, request, stateBuilder);

      // 更新统计
      this.updateStats('success', Date.now() - startTime, result.eventsProcessed);

      this.logger.info(`Replay completed: ${replayId}, processed ${result.eventsProcessed} events`, LogContext.DATABASE);
      this.emitEvent('replay_completed', { replayId, result });

      return result;
    } catch (error) {
      this.logger.error(`Replay failed: ${replayId}, error: ${error.message}`, LogContext.DATABASE, undefined, error);

      const failedResult: ReplayResult = {
        replayId,
        aggregateId: request.aggregateId,
        aggregateType: request.aggregateType,
        status: 'failed',
        eventsProcessed: 0,
        versionRange: { from: 0, to: 0 },
        timeRange: { from: new Date(), to: new Date() },
        finalState: null,
        stats: this.initializeReplayStats(),
        error: error.message,
        startedAt: new Date(),
        completedAt: new Date(),
        replayTime: Date.now() - startTime,
      };

      this.updateStats('failure', Date.now() - startTime, 0);
      this.emitEvent('replay_failed', { replayId, error, request });

      return failedResult;
    } finally {
      // 清理活跃重放
      this.activeReplays.delete(replayId);
    }
  }

  /**
   * @method replayToVersion
   * @description 重放到指定版本
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param targetVersion 目标版本
   * @param options 重放选项
   * @returns {Promise<ReplayResult>} 重放结果
   */
  async replayToVersion(
    aggregateId: string,
    aggregateType: string,
    targetVersion: number,
    options?: ReplayOptions
  ): Promise<ReplayResult> {
    const request: ReplayRequest = {
      aggregateId,
      aggregateType,
      toVersion: targetVersion,
      options,
    };

    return await this.replayAggregate(request);
  }

  /**
   * @method replayToTime
   * @description 重放到指定时间
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param targetTime 目标时间
   * @param options 重放选项
   * @returns {Promise<ReplayResult>} 重放结果
   */
  async replayToTime(
    aggregateId: string,
    aggregateType: string,
    targetTime: Date,
    options?: ReplayOptions
  ): Promise<ReplayResult> {
    const request: ReplayRequest = {
      aggregateId,
      aggregateType,
      toTime: targetTime,
      options,
    };

    return await this.replayAggregate(request);
  }

  /**
   * @method getReplayStatus
   * @description 获取重放状态
   * @param replayId 重放ID
   * @returns {ReplayResult | null} 重放结果
   */
  getReplayStatus(replayId: string): ReplayResult | null {
    return this.activeReplays.get(replayId) || null;
  }

  /**
   * @method cancelReplay
   * @description 取消重放
   * @param replayId 重放ID
   * @returns {boolean} 是否成功取消
   */
  cancelReplay(replayId: string): boolean {
    const replay = this.activeReplays.get(replayId);
    if (replay && replay.status === 'running') {
      replay.status = 'cancelled';
      replay.completedAt = new Date();
      this.logger.info(`Replay cancelled: ${replayId}`, LogContext.DATABASE);
      this.emitEvent('replay_cancelled', { replayId });
      return true;
    }
    return false;
  }

  /**
   * @method getActiveReplays
   * @description 获取活跃重放列表
   * @returns {ReplayResult[]} 活跃重放列表
   */
  getActiveReplays(): ReplayResult[] {
    return Array.from(this.activeReplays.values());
  }

  /**
   * @method getStats
   * @description 获取重放统计信息
   * @returns {any} 统计信息
   */
  getStats(): any {
    return {
      ...this.stats,
      activeReplays: this.activeReplays.size,
      registeredBuilders: this.stateBuilders.size,
    };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event replay stats reset', LogContext.DATABASE);
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

      const activeReplays = this.activeReplays.size;
      const registeredBuilders = this.stateBuilders.size;
      const isHealthy = activeReplays < 100 && registeredBuilders > 0;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          activeReplays,
          registeredBuilders,
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
    this.logger.info('EventReplayService destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method validateReplayRequest
   * @description 验证重放请求
   * @param request 重放请求
   */
  private validateReplayRequest(request: ReplayRequest): void {
    if (!request.aggregateId) {
      throw new Error('Aggregate ID is required');
    }

    if (!request.aggregateType) {
      throw new Error('Aggregate type is required');
    }

    if (request.fromVersion && request.toVersion && request.fromVersion > request.toVersion) {
      throw new Error('From version cannot be greater than to version');
    }

    if (request.fromTime && request.toTime && request.fromTime > request.toTime) {
      throw new Error('From time cannot be greater than to time');
    }
  }

  /**
   * @private
   * @method getStateBuilder
   * @description 获取状态构建器
   * @param aggregateType 聚合根类型
   * @returns {AggregateStateBuilder} 状态构建器
   */
  private getStateBuilder(aggregateType: string): AggregateStateBuilder {
    const builder = this.stateBuilders.get(aggregateType);
    if (!builder) {
      throw new Error(`No state builder registered for aggregate type: ${aggregateType}`);
    }
    return builder;
  }

  /**
   * @private
   * @method executeReplay
   * @description 执行重放
   * @param replayResult 重放结果
   * @param request 重放请求
   * @param stateBuilder 状态构建器
   * @returns {Promise<ReplayResult>} 重放结果
   */
  private async executeReplay(
    replayResult: ReplayResult,
    request: ReplayRequest,
    stateBuilder: AggregateStateBuilder
  ): Promise<ReplayResult> {
    const startTime = Date.now();

    try {
      // 确定重放范围
      const replayRange = await this.determineReplayRange(request);
      replayResult.versionRange = replayRange.versionRange;
      replayResult.timeRange = replayRange.timeRange;

      // 检查是否需要快照优化
      let initialState = stateBuilder.buildInitialState();
      let startVersion = replayRange.versionRange.from;

      if (this.config.enableSnapshotOptimization && replayRange.totalEvents > this.config.snapshotOptimizationThreshold!) {
        const snapshot = await this.findOptimalSnapshot(request.aggregateId, request.aggregateType, startVersion);
        if (snapshot) {
          initialState = stateBuilder.deserializeState(snapshot.aggregateState);
          startVersion = snapshot.aggregateVersion + 1;
          replayResult.stats.snapshotUsageCount++;
          this.logger.debug(`Using snapshot for replay optimization: version ${snapshot.aggregateVersion}`, LogContext.DATABASE);
        }
      }

      // 获取事件
      const events = await this.getEventsForReplay(request, startVersion, replayRange.versionRange.to);

      // 重放事件
      let currentState = initialState;
      let processedEvents = 0;

      for (const event of events) {
        if (replayResult.status === 'cancelled') {
          break;
        }

        try {
          // 应用事件到状态
          currentState = stateBuilder.applyEvent(currentState, event);
          processedEvents++;

          // 更新进度
          this.updateReplayProgress(replayResult, processedEvents, events.length, event.version);

          // 验证状态（如果启用）
          if (this.config.enableReplayValidation && !stateBuilder.validateState(currentState)) {
            throw new Error(`Invalid state after applying event: ${event.eventId}`);
          }

          // 报告进度
          if (request.options?.onProgress && processedEvents % 100 === 0) {
            const progress = this.createProgressReport(replayResult, processedEvents, events.length);
            request.options.onProgress(progress);
          }
        } catch (error) {
          replayResult.stats.failedEvents++;
          replayResult.stats.errors.push({
            eventId: event.eventId,
            version: event.version,
            error: error.message,
            timestamp: new Date(),
          });

          if (request.options?.errorStrategy === 'stop') {
            throw error;
          } else if (request.options?.errorStrategy === 'retry') {
            // 重试逻辑
            const retryResult = await this.retryEventProcessing(event, currentState, stateBuilder);
            if (!retryResult.success) {
              // 重试失败，根据策略决定是否跳过
              replayResult.stats.skippedEvents++;
              continue;
            }
            currentState = retryResult.state;
          } else {
            // 默认跳过
            replayResult.stats.skippedEvents++;
            continue;
          }
        }
      }

      // 完成重放
      replayResult.status = 'completed';
      replayResult.eventsProcessed = processedEvents;
      replayResult.finalState = stateBuilder.serializeState(currentState);
      replayResult.completedAt = new Date();
      replayResult.replayTime = Date.now() - startTime;
      replayResult.stats.totalEvents = events.length;
      replayResult.stats.successfulEvents = processedEvents;
      replayResult.stats.totalProcessingTime = Date.now() - startTime;
      replayResult.stats.averageProcessingTime = events.length > 0 ? (Date.now() - startTime) / events.length : 0;

      return replayResult;
    } catch (error) {
      replayResult.status = 'failed';
      replayResult.error = error.message;
      replayResult.completedAt = new Date();
      replayResult.replayTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * @private
   * @method determineReplayRange
   * @description 确定重放范围
   * @param request 重放请求
   * @returns {Promise<any>} 重放范围
   */
  private async determineReplayRange(request: ReplayRequest): Promise<any> {
    // 这里需要实现具体的逻辑来确定重放范围
    // 实际实现中需要查询事件存储来获取版本范围和时间范围
    return {
      versionRange: { from: request.fromVersion || 0, to: request.toVersion || 999999 },
      timeRange: { from: request.fromTime || new Date(0), to: request.toTime || new Date() },
      totalEvents: 0, // 需要从事件存储获取
    };
  }

  /**
   * @private
   * @method findOptimalSnapshot
   * @description 查找最优快照
   * @param aggregateId 聚合根ID
   * @param aggregateType 聚合根类型
   * @param startVersion 开始版本
   * @returns {Promise<any>} 快照
   */
  private async findOptimalSnapshot(aggregateId: string, aggregateType: string, startVersion: number): Promise<any> {
    try {
      const snapshots = await this.snapshotManager.querySnapshots({
        aggregateId,
        aggregateType,
        maxVersion: startVersion,
        limit: 1,
      });

      return snapshots.length > 0 ? snapshots[0] : null;
    } catch (error) {
      this.logger.warn(`Failed to find optimal snapshot: ${error.message}`, LogContext.DATABASE);
      return null;
    }
  }

  /**
   * @private
   * @method getEventsForReplay
   * @description 获取重放事件
   * @param request 重放请求
   * @param fromVersion 开始版本
   * @param toVersion 结束版本
   * @returns {Promise<any[]>} 事件列表
   */
  private async getEventsForReplay(request: ReplayRequest, fromVersion: number, toVersion: number): Promise<any[]> {
    // 这里需要实现具体的逻辑来获取事件
    // 实际实现中需要调用事件存储服务
    return [];
  }

  /**
   * @private
   * @method updateReplayProgress
   * @description 更新重放进度
   * @param replayResult 重放结果
   * @param processedEvents 已处理事件数
   * @param totalEvents 总事件数
   * @param currentVersion 当前版本
   */
  private updateReplayProgress(replayResult: ReplayResult, processedEvents: number, totalEvents: number, currentVersion: number): void {
    replayResult.eventsProcessed = processedEvents;
    // 可以在这里添加更多进度更新逻辑
  }

  /**
   * @private
   * @method createProgressReport
   * @description 创建进度报告
   * @param replayResult 重放结果
   * @param processedEvents 已处理事件数
   * @param totalEvents 总事件数
   * @returns {ReplayProgress} 进度报告
   */
  private createProgressReport(replayResult: ReplayResult, processedEvents: number, totalEvents: number): ReplayProgress {
    const percentage = totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0;
    const processingRate = processedEvents / ((Date.now() - replayResult.startedAt.getTime()) / 1000);
    const estimatedCompletion = totalEvents > 0
      ? new Date(Date.now() + ((totalEvents - processedEvents) / processingRate) * 1000)
      : undefined;

    return {
      replayId: replayResult.replayId,
      percentage,
      eventsProcessed: processedEvents,
      totalEvents,
      currentVersion: replayResult.versionRange.to,
      startedAt: replayResult.startedAt,
      estimatedCompletion,
      processingRate,
      status: replayResult.status,
    };
  }

  /**
   * @private
   * @method retryEventProcessing
   * @description 重试事件处理
   * @param event 事件
   * @param currentState 当前状态
   * @param stateBuilder 状态构建器
   * @returns {Promise<any>} 重试结果
   */
  private async retryEventProcessing(event: any, currentState: any, stateBuilder: AggregateStateBuilder): Promise<any> {
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        await this.delay(this.config.retryDelay! * attempt);
        const newState = stateBuilder.applyEvent(currentState, event);
        return { success: true, state: newState };
      } catch (error) {
        if (attempt === this.config.retries!) {
          return { success: false, error };
        }
      }
    }
    return { success: false, error: new Error('Max retries exceeded') };
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {any} 初始统计信息
   */
  private initializeStats(): any {
    return {
      totalReplays: 0,
      successfulReplays: 0,
      failedReplays: 0,
      totalEventsProcessed: 0,
      averageReplayTime: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method initializeReplayStats
   * @description 初始化重放统计信息
   * @returns {ReplayStats} 重放统计信息
   */
  private initializeReplayStats(): ReplayStats {
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      skippedEvents: 0,
      retryCount: 0,
      snapshotUsageCount: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
      errors: [],
    };
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param type 统计类型
   * @param replayTime 重放时间
   * @param eventsProcessed 处理事件数
   */
  private updateStats(type: string, replayTime: number, eventsProcessed: number): void {
    this.stats.lastUpdated = new Date();

    if (type === 'success') {
      this.stats.totalReplays++;
      this.stats.successfulReplays++;
      this.stats.totalEventsProcessed += eventsProcessed;
      this.stats.averageReplayTime =
        (this.stats.averageReplayTime * (this.stats.successfulReplays - 1) + replayTime) / this.stats.successfulReplays;
    } else if (type === 'failure') {
      this.stats.totalReplays++;
      this.stats.failedReplays++;
    }
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件重放事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventreplay.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'event-replay-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event replay event: ${type}`, LogContext.DATABASE, undefined, error);
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
          this.logger.error('Event replay monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event replay monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
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
      this.logger.info('Stopped event replay monitoring', LogContext.DATABASE);
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

      this.logger.debug(`Event replay monitoring: ${this.activeReplays.size} active replays`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event replay monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method delay
   * @description 延迟函数
   * @param ms 延迟毫秒数
   * @returns {Promise<void>} Promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
