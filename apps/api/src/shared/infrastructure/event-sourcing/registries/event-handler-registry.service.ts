import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @interface EventHandler
 * @description 事件处理器接口。
 */
export interface EventHandler {
  /** 处理器ID */
  handlerId: string;
  /** 处理器名称 */
  handlerName: string;
  /** 处理器描述 */
  description?: string;
  /** 支持的事件类型 */
  supportedEventTypes: EventType[];
  /** 处理器优先级 */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 处理器函数 */
  handle: (event: any, context: EventHandlerContext) => Promise<EventHandlerResult>;
  /** 处理器配置 */
  config?: Record<string, any>;
  /** 创建时间 */
  createdAt: Date;
  /** 最后执行时间 */
  lastExecutedAt?: Date;
  /** 执行次数 */
  executionCount: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number;
}

/**
 * @interface EventHandlerContext
 * @description 事件处理器上下文接口。
 */
export interface EventHandlerContext {
  /** 请求ID */
  requestId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 关联ID */
  correlationId?: string;
  /** 时间戳 */
  timestamp: Date;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface EventHandlerResult
 * @description 事件处理器结果接口。
 */
export interface EventHandlerResult {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface EventHandlerRegistryConfig
 * @description 事件处理器注册表配置接口。
 */
export interface EventHandlerRegistryConfig {
  /** 是否启用事件处理器注册表 */
  enabled?: boolean;
  /** 是否启用异步处理 */
  enableAsync?: boolean;
  /** 是否启用并发处理 */
  enableConcurrency?: boolean;
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 处理器超时时间（毫秒） */
  handlerTimeout?: number;
  /** 是否启用处理器统计 */
  enableStats?: boolean;
  /** 是否启用处理器事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 是否启用处理器重试 */
  enableRetry?: boolean;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用处理器熔断 */
  enableCircuitBreaker?: boolean;
  /** 熔断阈值 */
  circuitBreakerThreshold?: number;
  /** 熔断时间窗口（毫秒） */
  circuitBreakerWindow?: number;
}

/**
 * @interface RegistryStats
 * @description 注册表统计信息接口。
 */
export interface RegistryStats {
  /** 注册的处理器总数 */
  totalHandlers: number;
  /** 启用的处理器数 */
  enabledHandlers: number;
  /** 总执行次数 */
  totalExecutions: number;
  /** 成功执行次数 */
  successfulExecutions: number;
  /** 失败执行次数 */
  failedExecutions: number;
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number;
  /** 最大执行时间（毫秒） */
  maxExecutionTime: number;
  /** 最小执行时间（毫秒） */
  minExecutionTime: number;
  /** 当前并发数 */
  currentConcurrency: number;
  /** 错误次数 */
  errorCount: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * @interface HandlerExecutionInfo
 * @description 处理器执行信息接口。
 */
export interface HandlerExecutionInfo {
  /** 处理器ID */
  handlerId: string;
  /** 事件类型 */
  eventType: EventType;
  /** 执行开始时间 */
  startTime: Date;
  /** 执行结束时间 */
  endTime?: Date;
  /** 执行状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  /** 执行结果 */
  result?: EventHandlerResult;
  /** 错误信息 */
  error?: string;
}

/**
 * @class EventHandlerRegistryService
 * @description
 * 事件处理器注册表服务，负责管理事件处理器的注册和分发。
 * 
 * 主要功能包括：
 * 1. 事件处理器注册和管理
 * 2. 事件分发和处理
 * 3. 处理器执行监控
 * 4. 处理器统计和性能分析
 * 5. 处理器熔断和重试机制
 * 6. 并发控制和超时管理
 * 
 * 设计原则：
 * - 可扩展性：支持动态注册和卸载处理器
 * - 高性能：支持并发处理和异步执行
 * - 可靠性：提供重试、熔断和超时机制
 * - 可观测性：详细的执行统计和监控
 * - 灵活性：支持处理器优先级和配置
 */
@Injectable()
export class EventHandlerRegistryService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventHandlerRegistryConfig;

  /**
   * 事件处理器注册表
   */
  private handlers: Map<string, EventHandler> = new Map();

  /**
   * 事件类型到处理器的映射
   */
  private eventTypeHandlers: Map<EventType, EventHandler[]> = new Map();

  /**
   * 注册表统计
   */
  private stats: RegistryStats;

  /**
   * 当前执行中的处理器
   */
  private activeExecutions: Map<string, HandlerExecutionInfo> = new Map();

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 处理器熔断器
   */
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(
    @Inject('EVENT_HANDLER_REGISTRY_CONFIG') config: EventHandlerRegistryConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      enableAsync: true,
      enableConcurrency: true,
      maxConcurrency: 10,
      handlerTimeout: 30000,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      enableRetry: true,
      retries: 3,
      retryDelay: 1000,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerWindow: 60000,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();

    this.logger.info('EventHandlerRegistryService initialized', LogContext.DATABASE);
  }

  /**
   * @method registerHandler
   * @description 注册事件处理器
   * @param handler 事件处理器
   * @returns {Promise<boolean>} 是否成功
   */
  async registerHandler(handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'>): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        this.logger.warn('Event handler registry is disabled', LogContext.DATABASE);
        return false;
      }

      const handlerId = uuidv4();
      const fullHandler: EventHandler = {
        ...handler,
        handlerId,
        createdAt: new Date(),
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        averageExecutionTime: 0,
      };

      // 注册处理器
      this.handlers.set(handlerId, fullHandler);

      // 更新事件类型映射
      for (const eventType of handler.supportedEventTypes) {
        if (!this.eventTypeHandlers.has(eventType)) {
          this.eventTypeHandlers.set(eventType, []);
        }
        this.eventTypeHandlers.get(eventType)!.push(fullHandler);
      }

      // 按优先级排序
      this.sortHandlersByPriority();

      // 初始化熔断器
      if (this.config.enableCircuitBreaker) {
        this.circuitBreakers.set(handlerId, new CircuitBreaker(
          this.config.circuitBreakerThreshold!,
          this.config.circuitBreakerWindow!
        ));
      }

      // 更新统计
      this.stats.totalHandlers++;
      if (handler.enabled) {
        this.stats.enabledHandlers++;
      }

      this.logger.info(`Event handler registered: ${handlerId} (${handler.handlerName})`, LogContext.DATABASE);
      this.emitEvent('handler_registered', { handler: fullHandler });

      return true;
    } catch (error) {
      this.logger.error(`Failed to register event handler: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method unregisterHandler
   * @description 注销事件处理器
   * @param handlerId 处理器ID
   * @returns {Promise<boolean>} 是否成功
   */
  async unregisterHandler(handlerId: string): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        return false;
      }

      const handler = this.handlers.get(handlerId);
      if (!handler) {
        return false;
      }

      // 从事件类型映射中移除
      for (const eventType of handler.supportedEventTypes) {
        const handlers = this.eventTypeHandlers.get(eventType);
        if (handlers) {
          const index = handlers.findIndex(h => h.handlerId === handlerId);
          if (index !== -1) {
            handlers.splice(index, 1);
          }
        }
      }

      // 移除处理器
      this.handlers.delete(handlerId);

      // 移除熔断器
      this.circuitBreakers.delete(handlerId);

      // 更新统计
      this.stats.totalHandlers--;
      if (handler.enabled) {
        this.stats.enabledHandlers--;
      }

      this.logger.info(`Event handler unregistered: ${handlerId}`, LogContext.DATABASE);
      this.emitEvent('handler_unregistered', { handler });

      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister event handler: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method getHandler
   * @description 获取事件处理器
   * @param handlerId 处理器ID
   * @returns {EventHandler | undefined} 事件处理器
   */
  getHandler(handlerId: string): EventHandler | undefined {
    return this.handlers.get(handlerId);
  }

  /**
   * @method getHandlers
   * @description 获取所有事件处理器
   * @param eventType 事件类型（可选）
   * @returns {EventHandler[]} 事件处理器列表
   */
  getHandlers(eventType?: EventType): EventHandler[] {
    if (eventType) {
      return this.eventTypeHandlers.get(eventType) || [];
    }
    return Array.from(this.handlers.values());
  }

  /**
   * @method enableHandler
   * @description 启用事件处理器
   * @param handlerId 处理器ID
   * @returns {Promise<boolean>} 是否成功
   */
  async enableHandler(handlerId: string): Promise<boolean> {
    try {
      const handler = this.handlers.get(handlerId);
      if (!handler) {
        return false;
      }

      if (!handler.enabled) {
        handler.enabled = true;
        this.stats.enabledHandlers++;

        this.logger.info(`Event handler enabled: ${handlerId}`, LogContext.DATABASE);
        this.emitEvent('handler_enabled', { handler });
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to enable event handler: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method disableHandler
   * @description 禁用事件处理器
   * @param handlerId 处理器ID
   * @returns {Promise<boolean>} 是否成功
   */
  async disableHandler(handlerId: string): Promise<boolean> {
    try {
      const handler = this.handlers.get(handlerId);
      if (!handler) {
        return false;
      }

      if (handler.enabled) {
        handler.enabled = false;
        this.stats.enabledHandlers--;

        this.logger.info(`Event handler disabled: ${handlerId}`, LogContext.DATABASE);
        this.emitEvent('handler_disabled', { handler });
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to disable event handler: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method handleEvent
   * @description 处理事件
   * @param event 事件数据
   * @param context 处理器上下文
   * @returns {Promise<EventHandlerResult[]>} 处理结果列表
   */
  async handleEvent(event: any, context: EventHandlerContext): Promise<EventHandlerResult[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event handler registry is disabled', LogContext.DATABASE);
        return [];
      }

      const eventType = event.eventType as EventType;
      if (!eventType) {
        throw new Error('Event type is required');
      }

      // 获取支持该事件类型的处理器
      const handlers = this.getHandlers(eventType).filter(h => h.enabled);

      if (handlers.length === 0) {
        this.logger.debug(`No handlers found for event type: ${eventType}`, LogContext.DATABASE);
        return [];
      }

      // 检查并发限制
      if (this.config.enableConcurrency && this.activeExecutions.size >= this.config.maxConcurrency!) {
        this.logger.warn(`Max concurrency reached: ${this.activeExecutions.size}/${this.config.maxConcurrency}`, LogContext.DATABASE);
        return [];
      }

      // 执行处理器
      const results: EventHandlerResult[] = [];

      if (this.config.enableAsync) {
        // 异步并发执行
        const executionPromises = handlers.map(handler =>
          this.executeHandler(handler, event, context)
        );

        const handlerResults = await Promise.allSettled(executionPromises);

        for (const result of handlerResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              success: false,
              error: result.reason?.message || 'Handler execution failed',
              executionTime: 0,
            });
          }
        }
      } else {
        // 同步顺序执行
        for (const handler of handlers) {
          const result = await this.executeHandler(handler, event, context);
          results.push(result);
        }
      }

      // 更新统计
      this.updateStats('event_handled', Date.now() - startTime, results);

      this.logger.debug(`Event handled by ${results.length} handlers`, LogContext.DATABASE);
      this.emitEvent('event_handled', { event, results, context });

      return results;
    } catch (error) {
      this.logger.error(`Failed to handle event: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      this.emitEvent('event_handling_failed', { event, error, context });

      return [{
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      }];
    }
  }

  /**
   * @method getStats
   * @description 获取注册表统计信息
   * @returns {RegistryStats} 统计信息
   */
  getStats(): RegistryStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event handler registry stats reset', LogContext.DATABASE);
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

      const handlerHealth = this.stats.enabledHandlers > 0;
      const concurrencyHealth = this.activeExecutions.size < this.config.maxConcurrency!;

      const isHealthy = handlerHealth && concurrencyHealth;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          totalHandlers: this.stats.totalHandlers,
          enabledHandlers: this.stats.enabledHandlers,
          activeExecutions: this.activeExecutions.size,
          maxConcurrency: this.config.maxConcurrency,
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
    this.logger.info('EventHandlerRegistryService destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method executeHandler
   * @description 执行单个处理器
   * @param handler 事件处理器
   * @param event 事件数据
   * @param context 处理器上下文
   * @returns {Promise<EventHandlerResult>} 执行结果
   */
  private async executeHandler(
    handler: EventHandler,
    event: any,
    context: EventHandlerContext
  ): Promise<EventHandlerResult> {
    const executionId = `${handler.handlerId}-${Date.now()}`;
    const startTime = Date.now();

    // 创建执行信息
    const executionInfo: HandlerExecutionInfo = {
      handlerId: handler.handlerId,
      eventType: event.eventType,
      startTime: new Date(),
      status: 'pending',
    };

    this.activeExecutions.set(executionId, executionInfo);

    try {
      // 检查熔断器
      if (this.config.enableCircuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(handler.handlerId);
        if (circuitBreaker && !circuitBreaker.canExecute()) {
          throw new Error('Circuit breaker is open');
        }
      }

      executionInfo.status = 'running';

      // 执行处理器
      let result: EventHandlerResult;

      if (this.config.handlerTimeout) {
        // 带超时的执行
        result = await Promise.race([
          handler.handle(event, context),
          this.timeout(this.config.handlerTimeout)
        ]);
      } else {
        // 无超时执行
        result = await handler.handle(event, context);
      }

      // 更新执行信息
      executionInfo.status = 'completed';
      executionInfo.endTime = new Date();
      executionInfo.result = result;

      // 更新处理器统计
      this.updateHandlerStats(handler, result, Date.now() - startTime);

      // 更新熔断器
      if (this.config.enableCircuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(handler.handlerId);
        if (circuitBreaker) {
          circuitBreaker.recordResult(result.success);
        }
      }

      return result;
    } catch (error) {
      // 更新执行信息
      executionInfo.status = 'failed';
      executionInfo.endTime = new Date();
      executionInfo.error = error.message;

      // 处理重试
      if (this.config.enableRetry) {
        return await this.retryHandler(handler, event, context, startTime);
      }

      // 更新处理器统计
      this.updateHandlerStats(handler, {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      }, Date.now() - startTime);

      // 更新熔断器
      if (this.config.enableCircuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(handler.handlerId);
        if (circuitBreaker) {
          circuitBreaker.recordResult(false);
        }
      }

      throw error;
    } finally {
      // 清理执行信息
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * @private
   * @method retryHandler
   * @description 重试处理器执行
   * @param handler 事件处理器
   * @param event 事件数据
   * @param context 处理器上下文
   * @param startTime 开始时间
   * @returns {Promise<EventHandlerResult>} 执行结果
   */
  private async retryHandler(
    handler: EventHandler,
    event: any,
    context: EventHandlerContext,
    startTime: number
  ): Promise<EventHandlerResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        await this.delay(this.config.retryDelay! * attempt);

        let result: EventHandlerResult;

        if (this.config.handlerTimeout) {
          // 带超时的执行
          result = await Promise.race([
            handler.handle(event, context),
            this.timeout(this.config.handlerTimeout)
          ]);
        } else {
          // 无超时执行
          result = await handler.handle(event, context);
        }

        // 更新处理器统计
        this.updateHandlerStats(handler, result, Date.now() - startTime);

        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Handler retry attempt ${attempt} failed: ${handler.handlerId}`, LogContext.DATABASE, undefined, error);
      }
    }

    // 所有重试都失败
    const finalResult: EventHandlerResult = {
      success: false,
      error: `All retry attempts failed: ${lastError!.message}`,
      executionTime: Date.now() - startTime,
    };

    // 更新处理器统计
    this.updateHandlerStats(handler, finalResult, Date.now() - startTime);

    return finalResult;
  }

  /**
   * @private
   * @method updateHandlerStats
   * @description 更新处理器统计
   * @param handler 事件处理器
   * @param result 执行结果
   * @param executionTime 执行时间
   */
  private updateHandlerStats(handler: EventHandler, result: EventHandlerResult, executionTime: number): void {
    handler.executionCount++;
    handler.lastExecutedAt = new Date();

    if (result.success) {
      handler.successCount++;
    } else {
      handler.failureCount++;
    }

    // 更新平均执行时间
    handler.averageExecutionTime =
      (handler.averageExecutionTime * (handler.executionCount - 1) + executionTime) / handler.executionCount;
  }

  /**
   * @private
   * @method sortHandlersByPriority
   * @description 按优先级排序处理器
   */
  private sortHandlersByPriority(): void {
    for (const [eventType, handlers] of this.eventTypeHandlers) {
      handlers.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param type 统计类型
   * @param executionTime 执行时间
   * @param results 执行结果
   */
  private updateStats(type: string, executionTime: number, results?: EventHandlerResult[]): void {
    this.stats.lastUpdated = new Date();

    if (type === 'event_handled' && results) {
      this.stats.totalExecutions += results.length;
      this.stats.successfulExecutions += results.filter(r => r.success).length;
      this.stats.failedExecutions += results.filter(r => !r.success).length;
    } else if (type === 'error') {
      this.stats.errorCount++;
    }

    // 更新执行时间统计
    if (executionTime > 0) {
      const totalExecutions = this.stats.successfulExecutions + this.stats.failedExecutions;
      if (totalExecutions > 0) {
        this.stats.averageExecutionTime =
          (this.stats.averageExecutionTime * (totalExecutions - 1) + executionTime) / totalExecutions;
      }

      if (executionTime > this.stats.maxExecutionTime) {
        this.stats.maxExecutionTime = executionTime;
      }

      if (executionTime < this.stats.minExecutionTime || this.stats.minExecutionTime === 0) {
        this.stats.minExecutionTime = executionTime;
      }
    }

    // 更新并发数
    this.stats.currentConcurrency = this.activeExecutions.size;
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {RegistryStats} 初始统计信息
   */
  private initializeStats(): RegistryStats {
    return {
      totalHandlers: 0,
      enabledHandlers: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      currentConcurrency: 0,
      errorCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件处理器注册表事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventhandlerregistry.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'event-handler-registry-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event handler registry event: ${type}`, LogContext.DATABASE, undefined, error);
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
          this.logger.error('Event handler registry monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event handler registry monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
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
      this.logger.info('Stopped event handler registry monitoring', LogContext.DATABASE);
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

      this.logger.debug(`Event handler registry monitoring: ${this.stats.totalHandlers} handlers, ${this.stats.enabledHandlers} enabled`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event handler registry monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method timeout
   * @description 超时Promise
   * @param ms 超时时间（毫秒）
   * @returns {Promise<never>}
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Handler execution timeout')), ms);
    });
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

/**
 * @class CircuitBreaker
 * @description 熔断器实现
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number,
    private readonly window: number
  ) { }

  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (now - this.lastFailureTime >= this.window) {
          this.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return false;
    }
  }

  recordResult(success: boolean): void {
    const now = Date.now();

    if (success) {
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
    } else {
      this.failures++;
      this.lastFailureTime = now;

      if (this.state === 'closed' && this.failures >= this.threshold) {
        this.state = 'open';
      } else if (this.state === 'half-open') {
        this.state = 'open';
      }
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}
