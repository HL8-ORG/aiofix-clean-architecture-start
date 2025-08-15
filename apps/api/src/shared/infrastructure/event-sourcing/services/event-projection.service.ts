import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @interface EventProjectionConfig
 * @description 事件投影配置接口。
 */
export interface EventProjectionConfig {
  /** 是否启用事件投影 */
  enabled?: boolean;
  /** 投影批次大小 */
  batchSize?: number;
  /** 投影并发数 */
  concurrency?: number;
  /** 投影超时时间（毫秒） */
  timeout?: number;
  /** 投影重试次数 */
  retries?: number;
  /** 投影重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用投影缓存 */
  enableProjectionCache?: boolean;
  /** 投影缓存TTL（秒） */
  projectionCacheTtl?: number;
  /** 是否启用投影验证 */
  enableProjectionValidation?: boolean;
  /** 是否启用投影统计 */
  enableStats?: boolean;
  /** 是否启用投影事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 最大投影事件数 */
  maxProjectionEvents?: number;
  /** 投影进度报告间隔 */
  progressReportInterval?: number;
  /** 是否启用实时投影 */
  enableRealTimeProjection?: boolean;
  /** 实时投影延迟（毫秒） */
  realTimeProjectionDelay?: number;
}

/**
 * @interface ProjectionRequest
 * @description 投影请求接口。
 */
export interface ProjectionRequest {
  /** 投影名称 */
  projectionName: string;
  /** 投影类型 */
  projectionType: string;
  /** 聚合根ID */
  aggregateId?: string;
  /** 聚合根类型 */
  aggregateType?: string;
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
  /** 投影选项 */
  options?: ProjectionOptions;
}

/**
 * @interface ProjectionOptions
 * @description 投影选项接口。
 */
export interface ProjectionOptions {
  /** 是否使用缓存 */
  useCache?: boolean;
  /** 是否验证投影结果 */
  validateResult?: boolean;
  /** 是否包含事件元数据 */
  includeMetadata?: boolean;
  /** 是否包含事件数据 */
  includeEventData?: boolean;
  /** 投影模式 */
  projectionMode?: 'full' | 'incremental' | 'selective' | 'real-time';
  /** 投影策略 */
  projectionStrategy?: 'sequential' | 'parallel' | 'batch';
  /** 错误处理策略 */
  errorStrategy?: 'stop' | 'skip' | 'retry';
  /** 进度回调 */
  onProgress?: (progress: ProjectionProgress) => void;
  /** 投影过滤器 */
  filter?: (event: any) => boolean;
  /** 投影转换器 */
  transformer?: (event: any) => any;
}

/**
 * @interface ProjectionResult
 * @description 投影结果接口。
 */
export interface ProjectionResult {
  /** 投影ID */
  projectionId: string;
  /** 投影名称 */
  projectionName: string;
  /** 投影类型 */
  projectionType: string;
  /** 投影状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** 投影的事件数量 */
  eventsProcessed: number;
  /** 投影的事件版本范围 */
  versionRange: {
    from: number;
    to: number;
  };
  /** 投影的时间范围 */
  timeRange: {
    from: Date;
    to: Date;
  };
  /** 投影数据 */
  projectionData: any;
  /** 投影统计 */
  stats: ProjectionStats;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startedAt: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 投影时间（毫秒） */
  projectionTime?: number;
}

/**
 * @interface ProjectionProgress
 * @description 投影进度接口。
 */
export interface ProjectionProgress {
  /** 投影ID */
  projectionId: string;
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
 * @interface ProjectionStats
 * @description 投影统计接口。
 */
export interface ProjectionStats {
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
  /** 缓存命中次数 */
  cacheHits: number;
  /** 缓存未命中次数 */
  cacheMisses: number;
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
 * @interface ProjectionHandler
 * @description 投影处理器接口。
 */
export interface ProjectionHandler {
  /** 投影名称 */
  projectionName: string;
  /** 投影类型 */
  projectionType: string;
  /** 支持的聚合根类型 */
  supportedAggregateTypes: string[];
  /** 支持的事件类型 */
  supportedEventTypes: EventType[];
  /** 初始化投影状态 */
  initializeProjection(): any;
  /** 处理事件 */
  handleEvent(projectionState: any, event: any): any;
  /** 验证投影状态 */
  validateProjection(projectionState: any): boolean;
  /** 序列化投影状态 */
  serializeProjection(projectionState: any): any;
  /** 反序列化投影状态 */
  deserializeProjection(data: any): any;
  /** 获取投影查询 */
  getProjectionQuery(projectionState: any, query: any): any;
}

/**
 * @interface ProjectionQuery
 * @description 投影查询接口。
 */
export interface ProjectionQuery {
  /** 查询类型 */
  queryType: string;
  /** 查询参数 */
  parameters: Record<string, any>;
  /** 分页参数 */
  pagination?: {
    page: number;
    limit: number;
    offset: number;
  };
  /** 排序参数 */
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  /** 过滤条件 */
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

/**
 * @class EventProjectionService
 * @description
 * 事件投影服务，负责将事件数据投影到读取模型中。
 * 
 * 主要功能包括：
 * 1. 事件投影和读取模型构建
 * 2. 投影缓存和性能优化
 * 3. 投影进度监控和报告
 * 4. 投影结果验证和统计
 * 5. 并发投影和错误处理
 * 6. 投影策略和模式支持
 * 7. 实时投影和查询支持
 * 
 * 设计原则：
 * - 性能优化：通过缓存和批量处理提升投影性能
 * - 可靠性保证：完善的错误处理和重试机制
 * - 可观测性：详细的投影进度和统计信息
 * - 灵活性：支持多种投影策略和模式
 * - 可扩展性：支持自定义投影处理器
 * - 实时性：支持实时投影和查询
 */
@Injectable()
export class EventProjectionService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventProjectionConfig;

  /**
   * 事件存储服务（通过依赖注入获取）
   */
  private eventStore: any; // 实际类型应该是 PostgresEventStore

  /**
   * 事件缓存服务（通过依赖注入获取）
   */
  private eventCache: any; // 实际类型应该是 RedisEventCache

  /**
   * 投影处理器注册表
   */
  private projectionHandlers: Map<string, ProjectionHandler> = new Map();

  /**
   * 活跃投影任务
   */
  private activeProjections: Map<string, ProjectionResult> = new Map();

  /**
   * 投影缓存
   */
  private projectionCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  /**
   * 投影统计
   */
  private stats: {
    totalProjections: number;
    successfulProjections: number;
    failedProjections: number;
    totalEventsProcessed: number;
    averageProjectionTime: number;
    cacheHits: number;
    cacheMisses: number;
    lastUpdated: Date;
  };

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 实时投影定时器
   */
  private realTimeProjectionTimer?: NodeJS.Timeout;

  constructor(
    @Inject('EVENT_PROJECTION_CONFIG') config: EventProjectionConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      batchSize: 1000,
      concurrency: 5,
      timeout: 300000, // 5分钟
      retries: 3,
      retryDelay: 1000,
      enableProjectionCache: true,
      projectionCacheTtl: 3600, // 1小时
      enableProjectionValidation: true,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      maxProjectionEvents: 100000,
      progressReportInterval: 1000,
      enableRealTimeProjection: false,
      realTimeProjectionDelay: 1000,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();
    this.startRealTimeProjection();

    this.logger.info('EventProjectionService initialized', LogContext.DATABASE);
  }

  /**
   * @method registerProjectionHandler
   * @description 注册投影处理器
   * @param handler 投影处理器
   */
  registerProjectionHandler(handler: ProjectionHandler): void {
    const key = `${handler.projectionType}:${handler.projectionName}`;
    this.projectionHandlers.set(key, handler);
    this.logger.debug(`Projection handler registered: ${key}`, LogContext.DATABASE);
  }

  /**
   * @method unregisterProjectionHandler
   * @description 取消注册投影处理器
   * @param projectionType 投影类型
   * @param projectionName 投影名称
   */
  unregisterProjectionHandler(projectionType: string, projectionName: string): void {
    const key = `${projectionType}:${projectionName}`;
    this.projectionHandlers.delete(key);
    this.logger.debug(`Projection handler unregistered: ${key}`, LogContext.DATABASE);
  }

  /**
   * @method projectEvents
   * @description 投影事件
   * @param request 投影请求
   * @returns {Promise<ProjectionResult>} 投影结果
   */
  async projectEvents(request: ProjectionRequest): Promise<ProjectionResult> {
    const startTime = Date.now();
    const projectionId = uuidv4();

    try {
      if (!this.config.enabled) {
        throw new Error('Event projection is disabled');
      }

      // 验证请求参数
      this.validateProjectionRequest(request);

      // 获取投影处理器
      const projectionHandler = this.getProjectionHandler(request.projectionType, request.projectionName);

      // 检查缓存
      if (this.config.enableProjectionCache && request.options?.useCache !== false) {
        const cachedResult = this.getCachedProjection(request);
        if (cachedResult) {
          this.stats.cacheHits++;
          return cachedResult;
        }
      }

      // 创建投影结果
      const projectionResult: ProjectionResult = {
        projectionId,
        projectionName: request.projectionName,
        projectionType: request.projectionType,
        status: 'pending',
        eventsProcessed: 0,
        versionRange: { from: 0, to: 0 },
        timeRange: { from: new Date(), to: new Date() },
        projectionData: null,
        stats: this.initializeProjectionStats(),
        startedAt: new Date(),
      };

      // 注册活跃投影
      this.activeProjections.set(projectionId, projectionResult);

      // 开始投影
      projectionResult.status = 'running';
      this.logger.info(`Starting projection: ${projectionId} for ${request.projectionType}:${request.projectionName}`, LogContext.DATABASE);
      this.emitEvent('projection_started', { projectionId, request });

      // 执行投影
      const result = await this.executeProjection(projectionResult, request, projectionHandler);

      // 缓存结果
      if (this.config.enableProjectionCache && request.options?.useCache !== false) {
        this.cacheProjection(request, result);
      }

      // 更新统计
      this.updateStats('success', Date.now() - startTime, result.eventsProcessed);

      this.logger.info(`Projection completed: ${projectionId}, processed ${result.eventsProcessed} events`, LogContext.DATABASE);
      this.emitEvent('projection_completed', { projectionId, result });

      return result;
    } catch (error) {
      this.logger.error(`Projection failed: ${projectionId}, error: ${error.message}`, LogContext.DATABASE, undefined, error);

      const failedResult: ProjectionResult = {
        projectionId,
        projectionName: request.projectionName,
        projectionType: request.projectionType,
        status: 'failed',
        eventsProcessed: 0,
        versionRange: { from: 0, to: 0 },
        timeRange: { from: new Date(), to: new Date() },
        projectionData: null,
        stats: this.initializeProjectionStats(),
        error: error.message,
        startedAt: new Date(),
        completedAt: new Date(),
        projectionTime: Date.now() - startTime,
      };

      this.updateStats('failure', Date.now() - startTime, 0);
      this.emitEvent('projection_failed', { projectionId, error, request });

      return failedResult;
    } finally {
      // 清理活跃投影
      this.activeProjections.delete(projectionId);
    }
  }

  /**
   * @method queryProjection
   * @description 查询投影数据
   * @param projectionType 投影类型
   * @param projectionName 投影名称
   * @param query 查询参数
   * @returns {Promise<any>} 查询结果
   */
  async queryProjection(projectionType: string, projectionName: string, query: ProjectionQuery): Promise<any> {
    try {
      // 获取投影处理器
      const projectionHandler = this.getProjectionHandler(projectionType, projectionName);

      // 获取投影状态
      const projectionState = await this.getProjectionState(projectionType, projectionName);

      // 执行查询
      const result = projectionHandler.getProjectionQuery(projectionState, query);

      this.logger.debug(`Projection query executed: ${projectionType}:${projectionName}`, LogContext.DATABASE);
      return result;
    } catch (error) {
      this.logger.error(`Projection query failed: ${projectionType}:${projectionName}`, LogContext.DATABASE, undefined, error);
      throw error;
    }
  }

  /**
   * @method getProjectionStatus
   * @description 获取投影状态
   * @param projectionId 投影ID
   * @returns {ProjectionResult | null} 投影结果
   */
  getProjectionStatus(projectionId: string): ProjectionResult | null {
    return this.activeProjections.get(projectionId) || null;
  }

  /**
   * @method cancelProjection
   * @description 取消投影
   * @param projectionId 投影ID
   * @returns {boolean} 是否成功取消
   */
  cancelProjection(projectionId: string): boolean {
    const projection = this.activeProjections.get(projectionId);
    if (projection && projection.status === 'running') {
      projection.status = 'cancelled';
      projection.completedAt = new Date();
      this.logger.info(`Projection cancelled: ${projectionId}`, LogContext.DATABASE);
      this.emitEvent('projection_cancelled', { projectionId });
      return true;
    }
    return false;
  }

  /**
   * @method getActiveProjections
   * @description 获取活跃投影列表
   * @returns {ProjectionResult[]} 活跃投影列表
   */
  getActiveProjections(): ProjectionResult[] {
    return Array.from(this.activeProjections.values());
  }

  /**
   * @method clearProjectionCache
   * @description 清除投影缓存
   * @param projectionType 投影类型（可选）
   * @param projectionName 投影名称（可选）
   */
  clearProjectionCache(projectionType?: string, projectionName?: string): void {
    if (projectionType && projectionName) {
      const key = `${projectionType}:${projectionName}`;
      this.projectionCache.delete(key);
      this.logger.debug(`Projection cache cleared: ${key}`, LogContext.DATABASE);
    } else {
      this.projectionCache.clear();
      this.logger.info('All projection cache cleared', LogContext.DATABASE);
    }
  }

  /**
   * @method getStats
   * @description 获取投影统计信息
   * @returns {any} 统计信息
   */
  getStats(): any {
    return {
      ...this.stats,
      activeProjections: this.activeProjections.size,
      registeredHandlers: this.projectionHandlers.size,
      cacheSize: this.projectionCache.size,
    };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event projection stats reset', LogContext.DATABASE);
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

      const activeProjections = this.activeProjections.size;
      const registeredHandlers = this.projectionHandlers.size;
      const isHealthy = activeProjections < 100 && registeredHandlers > 0;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          activeProjections,
          registeredHandlers,
          cacheSize: this.projectionCache.size,
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
    this.stopRealTimeProjection();
    this.logger.info('EventProjectionService destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method validateProjectionRequest
   * @description 验证投影请求
   * @param request 投影请求
   */
  private validateProjectionRequest(request: ProjectionRequest): void {
    if (!request.projectionName) {
      throw new Error('Projection name is required');
    }

    if (!request.projectionType) {
      throw new Error('Projection type is required');
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
   * @method getProjectionHandler
   * @description 获取投影处理器
   * @param projectionType 投影类型
   * @param projectionName 投影名称
   * @returns {ProjectionHandler} 投影处理器
   */
  private getProjectionHandler(projectionType: string, projectionName: string): ProjectionHandler {
    const key = `${projectionType}:${projectionName}`;
    const handler = this.projectionHandlers.get(key);
    if (!handler) {
      throw new Error(`No projection handler registered for: ${key}`);
    }
    return handler;
  }

  /**
   * @private
   * @method executeProjection
   * @description 执行投影
   * @param projectionResult 投影结果
   * @param request 投影请求
   * @param projectionHandler 投影处理器
   * @returns {Promise<ProjectionResult>} 投影结果
   */
  private async executeProjection(
    projectionResult: ProjectionResult,
    request: ProjectionRequest,
    projectionHandler: ProjectionHandler
  ): Promise<ProjectionResult> {
    const startTime = Date.now();

    try {
      // 确定投影范围
      const projectionRange = await this.determineProjectionRange(request);
      projectionResult.versionRange = projectionRange.versionRange;
      projectionResult.timeRange = projectionRange.timeRange;

      // 初始化投影状态
      let projectionState = projectionHandler.initializeProjection();

      // 获取事件
      const events = await this.getEventsForProjection(request, projectionRange.versionRange.from, projectionRange.versionRange.to);

      // 投影事件
      let processedEvents = 0;

      for (const event of events) {
        if (projectionResult.status === 'cancelled') {
          break;
        }

        try {
          // 应用事件过滤器
          if (request.options?.filter && !request.options.filter(event)) {
            projectionResult.stats.skippedEvents++;
            continue;
          }

          // 转换事件
          let processedEvent = event;
          if (request.options?.transformer) {
            processedEvent = request.options.transformer(event);
          }

          // 处理事件
          projectionState = projectionHandler.handleEvent(projectionState, processedEvent);
          processedEvents++;

          // 更新进度
          this.updateProjectionProgress(projectionResult, processedEvents, events.length, event.version);

          // 验证投影状态（如果启用）
          if (this.config.enableProjectionValidation && !projectionHandler.validateProjection(projectionState)) {
            throw new Error(`Invalid projection state after processing event: ${event.eventId}`);
          }

          // 报告进度
          if (request.options?.onProgress && processedEvents % 100 === 0) {
            const progress = this.createProgressReport(projectionResult, processedEvents, events.length);
            request.options.onProgress(progress);
          }
        } catch (error) {
          projectionResult.stats.failedEvents++;
          projectionResult.stats.errors.push({
            eventId: event.eventId,
            version: event.version,
            error: error.message,
            timestamp: new Date(),
          });

          if (request.options?.errorStrategy === 'stop') {
            throw error;
          } else if (request.options?.errorStrategy === 'retry') {
            // 重试逻辑
            const retryResult = await this.retryEventProcessing(event, projectionState, projectionHandler);
            if (!retryResult.success) {
              projectionResult.stats.skippedEvents++;
              continue;
            }
            projectionState = retryResult.state;
          } else {
            // 默认跳过
            projectionResult.stats.skippedEvents++;
            continue;
          }
        }
      }

      // 完成投影
      projectionResult.status = 'completed';
      projectionResult.eventsProcessed = processedEvents;
      projectionResult.projectionData = projectionHandler.serializeProjection(projectionState);
      projectionResult.completedAt = new Date();
      projectionResult.projectionTime = Date.now() - startTime;
      projectionResult.stats.totalEvents = events.length;
      projectionResult.stats.successfulEvents = processedEvents;
      projectionResult.stats.totalProcessingTime = Date.now() - startTime;
      projectionResult.stats.averageProcessingTime = events.length > 0 ? (Date.now() - startTime) / events.length : 0;

      return projectionResult;
    } catch (error) {
      projectionResult.status = 'failed';
      projectionResult.error = error.message;
      projectionResult.completedAt = new Date();
      projectionResult.projectionTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * @private
   * @method determineProjectionRange
   * @description 确定投影范围
   * @param request 投影请求
   * @returns {Promise<any>} 投影范围
   */
  private async determineProjectionRange(request: ProjectionRequest): Promise<any> {
    // 这里需要实现具体的逻辑来确定投影范围
    // 实际实现中需要查询事件存储来获取版本范围和时间范围
    return {
      versionRange: { from: request.fromVersion || 0, to: request.toVersion || 999999 },
      timeRange: { from: request.fromTime || new Date(0), to: request.toTime || new Date() },
      totalEvents: 0, // 需要从事件存储获取
    };
  }

  /**
   * @private
   * @method getEventsForProjection
   * @description 获取投影事件
   * @param request 投影请求
   * @param fromVersion 开始版本
   * @param toVersion 结束版本
   * @returns {Promise<any[]>} 事件列表
   */
  private async getEventsForProjection(request: ProjectionRequest, fromVersion: number, toVersion: number): Promise<any[]> {
    // 这里需要实现具体的逻辑来获取事件
    // 实际实现中需要调用事件存储服务
    return [];
  }

  /**
   * @private
   * @method getProjectionState
   * @description 获取投影状态
   * @param projectionType 投影类型
   * @param projectionName 投影名称
   * @returns {Promise<any>} 投影状态
   */
  private async getProjectionState(projectionType: string, projectionName: string): Promise<any> {
    // 这里需要实现具体的逻辑来获取投影状态
    // 实际实现中需要从存储中获取投影状态
    return null;
  }

  /**
   * @private
   * @method updateProjectionProgress
   * @description 更新投影进度
   * @param projectionResult 投影结果
   * @param processedEvents 已处理事件数
   * @param totalEvents 总事件数
   * @param currentVersion 当前版本
   */
  private updateProjectionProgress(projectionResult: ProjectionResult, processedEvents: number, totalEvents: number, currentVersion: number): void {
    projectionResult.eventsProcessed = processedEvents;
    // 可以在这里添加更多进度更新逻辑
  }

  /**
   * @private
   * @method createProgressReport
   * @description 创建进度报告
   * @param projectionResult 投影结果
   * @param processedEvents 已处理事件数
   * @param totalEvents 总事件数
   * @returns {ProjectionProgress} 进度报告
   */
  private createProgressReport(projectionResult: ProjectionResult, processedEvents: number, totalEvents: number): ProjectionProgress {
    const percentage = totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0;
    const processingRate = processedEvents / ((Date.now() - projectionResult.startedAt.getTime()) / 1000);
    const estimatedCompletion = totalEvents > 0
      ? new Date(Date.now() + ((totalEvents - processedEvents) / processingRate) * 1000)
      : undefined;

    return {
      projectionId: projectionResult.projectionId,
      percentage,
      eventsProcessed: processedEvents,
      totalEvents,
      currentVersion: projectionResult.versionRange.to,
      startedAt: projectionResult.startedAt,
      estimatedCompletion,
      processingRate,
      status: projectionResult.status,
    };
  }

  /**
   * @private
   * @method retryEventProcessing
   * @description 重试事件处理
   * @param event 事件
   * @param currentState 当前状态
   * @param projectionHandler 投影处理器
   * @returns {Promise<any>} 重试结果
   */
  private async retryEventProcessing(event: any, currentState: any, projectionHandler: ProjectionHandler): Promise<any> {
    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        await this.delay(this.config.retryDelay! * attempt);
        const newState = projectionHandler.handleEvent(currentState, event);
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
   * @method getCachedProjection
   * @description 获取缓存的投影结果
   * @param request 投影请求
   * @returns {ProjectionResult | null} 缓存的投影结果
   */
  private getCachedProjection(request: ProjectionRequest): ProjectionResult | null {
    const key = `${request.projectionType}:${request.projectionName}`;
    const cached = this.projectionCache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      this.stats.cacheHits++;
      return cached.data;
    }

    this.stats.cacheMisses++;
    return null;
  }

  /**
   * @private
   * @method cacheProjection
   * @description 缓存投影结果
   * @param request 投影请求
   * @param result 投影结果
   */
  private cacheProjection(request: ProjectionRequest, result: ProjectionResult): void {
    const key = `${request.projectionType}:${request.projectionName}`;
    this.projectionCache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl: this.config.projectionCacheTtl!,
    });
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {any} 初始统计信息
   */
  private initializeStats(): any {
    return {
      totalProjections: 0,
      successfulProjections: 0,
      failedProjections: 0,
      totalEventsProcessed: 0,
      averageProjectionTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method initializeProjectionStats
   * @description 初始化投影统计信息
   * @returns {ProjectionStats} 投影统计信息
   */
  private initializeProjectionStats(): ProjectionStats {
    return {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      skippedEvents: 0,
      retryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
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
   * @param projectionTime 投影时间
   * @param eventsProcessed 处理事件数
   */
  private updateStats(type: string, projectionTime: number, eventsProcessed: number): void {
    this.stats.lastUpdated = new Date();

    if (type === 'success') {
      this.stats.totalProjections++;
      this.stats.successfulProjections++;
      this.stats.totalEventsProcessed += eventsProcessed;
      this.stats.averageProjectionTime =
        (this.stats.averageProjectionTime * (this.stats.successfulProjections - 1) + projectionTime) / this.stats.successfulProjections;
    } else if (type === 'failure') {
      this.stats.totalProjections++;
      this.stats.failedProjections++;
    }
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件投影事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventprojection.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'event-projection-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event projection event: ${type}`, LogContext.DATABASE, undefined, error);
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
          this.logger.error('Event projection monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event projection monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
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
      this.logger.info('Stopped event projection monitoring', LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method startRealTimeProjection
   * @description 开始实时投影
   */
  private startRealTimeProjection(): void {
    if (this.config.enableRealTimeProjection && this.config.realTimeProjectionDelay && this.config.realTimeProjectionDelay > 0) {
      this.realTimeProjectionTimer = setInterval(async () => {
        try {
          await this.performRealTimeProjection();
        } catch (error) {
          this.logger.error('Real-time projection failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.realTimeProjectionDelay);

      this.logger.info(`Started real-time projection, interval: ${this.config.realTimeProjectionDelay}ms`, LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method stopRealTimeProjection
   * @description 停止实时投影
   */
  private stopRealTimeProjection(): void {
    if (this.realTimeProjectionTimer) {
      clearInterval(this.realTimeProjectionTimer);
      this.realTimeProjectionTimer = undefined;
      this.logger.info('Stopped real-time projection', LogContext.DATABASE);
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

      this.logger.debug(`Event projection monitoring: ${this.activeProjections.size} active projections`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event projection monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method performRealTimeProjection
   * @description 执行实时投影
   */
  private async performRealTimeProjection(): Promise<void> {
    try {
      // 这里需要实现实时投影逻辑
      // 实际实现中需要监听新事件并自动更新投影
      this.logger.debug('Real-time projection executed', LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Real-time projection execution failed', LogContext.DATABASE, undefined, error);
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
