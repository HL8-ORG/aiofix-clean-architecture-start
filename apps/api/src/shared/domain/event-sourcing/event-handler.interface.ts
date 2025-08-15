import { DomainEvent } from './event-sourced-aggregate';

/**
 * @interface IEventHandler
 * @description 事件处理器接口，定义事件处理的抽象契约
 * 
 * 核心职责：
 * 1. 处理特定类型的领域事件
 * 2. 执行业务逻辑和副作用
 * 3. 支持事件处理的幂等性
 * 4. 提供事件处理的错误处理
 * 
 * 设计原则：
 * - 事件处理器是事件驱动架构的核心组件
 * - 每个事件处理器只处理特定类型的事件
 * - 事件处理器应该是幂等的，可以重复执行
 * - 支持异步处理和错误重试
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * @property eventType
   * @description 处理器支持的事件类型
   */
  readonly eventType: string;

  /**
   * @method handle
   * @description 处理领域事件
   * @param event 领域事件
   * @returns Promise<void>
   */
  handle(event: T): Promise<void>;

  /**
   * @method canHandle
   * @description 检查是否可以处理指定事件
   * @param event 领域事件
   * @returns boolean
   */
  canHandle(event: DomainEvent): boolean;

  /**
   * @method getPriority
   * @description 获取处理器优先级（数字越小优先级越高）
   * @returns number
   */
  getPriority(): number;

  /**
   * @method isEnabled
   * @description 检查处理器是否启用
   * @returns boolean
   */
  isEnabled(): boolean;

  /**
   * @method enable
   * @description 启用处理器
   */
  enable(): void;

  /**
   * @method disable
   * @description 禁用处理器
   */
  disable(): void;
}

/**
 * @interface EventHandlerOptions
 * @description 事件处理器配置选项
 */
export interface EventHandlerOptions {
  /**
   * 处理器优先级
   */
  priority?: number;

  /**
   * 是否启用
   */
  enabled?: boolean;

  /**
   * 重试配置
   */
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };

  /**
   * 超时配置（毫秒）
   */
  timeout?: number;

  /**
   * 是否异步处理
   */
  async?: boolean;

  /**
   * 错误处理策略
   */
  errorHandling?: 'fail-fast' | 'continue' | 'retry';
}

/**
 * @abstract class BaseEventHandler
 * @description 事件处理器基类，提供通用实现
 */
export abstract class BaseEventHandler<T extends DomainEvent = DomainEvent> implements IEventHandler<T> {
  private _enabled: boolean = true;
  private _priority: number = 100;

  constructor(
    public readonly eventType: string,
    protected readonly options: EventHandlerOptions = {}
  ) {
    this._priority = options.priority ?? 100;
    this._enabled = options.enabled ?? true;
  }

  /**
   * @method handle
   * @description 处理领域事件，子类必须实现此方法
   * @param event 领域事件
   */
  abstract handle(event: T): Promise<void>;

  /**
   * @method canHandle
   * @description 检查是否可以处理指定事件
   * @param event 领域事件
   */
  canHandle(event: DomainEvent): boolean {
    return this._enabled && event.eventType === this.eventType;
  }

  /**
   * @method getPriority
   * @description 获取处理器优先级
   */
  getPriority(): number {
    return this._priority;
  }

  /**
   * @method isEnabled
   * @description 检查处理器是否启用
   */
  isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * @method enable
   * @description 启用处理器
   */
  enable(): void {
    this._enabled = true;
  }

  /**
   * @method disable
   * @description 禁用处理器
   */
  disable(): void {
    this._enabled = false;
  }

  /**
   * @method executeWithRetry
   * @description 带重试的执行方法
   * @param operation 要执行的操作
   * @returns Promise<void>
   */
  protected async executeWithRetry(operation: () => Promise<void>): Promise<void> {
    const retryConfig = this.options.retry;
    if (!retryConfig) {
      return await operation();
    }

    let lastError: Error;
    let delay = retryConfig.delayMs;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        await operation();
        return; // 成功执行，直接返回
      } catch (error) {
        lastError = error as Error;

        if (attempt === retryConfig.maxAttempts) {
          throw lastError; // 最后一次尝试失败，抛出异常
        }

        // 等待后重试
        await this.sleep(delay);
        delay *= retryConfig.backoffMultiplier;
      }
    }
  }

  /**
   * @method executeWithTimeout
   * @description 带超时的执行方法
   * @param operation 要执行的操作
   * @returns Promise<void>
   */
  protected async executeWithTimeout(operation: () => Promise<void>): Promise<void> {
    const timeout = this.options.timeout;
    if (!timeout) {
      return await operation();
    }

    return await Promise.race([
      operation(),
      this.createTimeoutPromise(timeout)
    ]);
  }

  /**
   * @method sleep
   * @description 睡眠方法
   * @param ms 毫秒数
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @method createTimeoutPromise
   * @description 创建超时Promise
   * @param timeout 超时时间（毫秒）
   * @returns Promise<never>
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * @method logError
   * @description 记录错误日志
   * @param error 错误对象
   * @param event 相关事件
   */
  protected logError(error: Error, event: T): void {
    console.error(`Error handling event ${event.eventType}:`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * @method logInfo
   * @description 记录信息日志
   * @param message 日志消息
   * @param data 相关数据
   */
  protected logInfo(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }
}

/**
 * @interface EventHandlerRegistry
 * @description 事件处理器注册表接口
 */
export interface EventHandlerRegistry {
  /**
   * @method register
   * @description 注册事件处理器
   * @param handler 事件处理器
   */
  register(handler: IEventHandler): void;

  /**
   * @method unregister
   * @description 取消注册事件处理器
   * @param handler 事件处理器
   */
  unregister(handler: IEventHandler): void;

  /**
   * @method getHandlers
   * @description 获取指定事件类型的所有处理器
   * @param eventType 事件类型
   * @returns IEventHandler[]
   */
  getHandlers(eventType: string): IEventHandler[];

  /**
   * @method getAllHandlers
   * @description 获取所有注册的处理器
   * @returns IEventHandler[]
   */
  getAllHandlers(): IEventHandler[];

  /**
   * @method clear
   * @description 清空所有处理器
   */
  clear(): void;

  /**
   * @method getHandlerCount
   * @description 获取处理器数量
   * @param eventType 事件类型（可选）
   * @returns number
   */
  getHandlerCount(eventType?: string): number;
}

/**
 * @class EventHandlerRegistryImpl
 * @description 事件处理器注册表实现
 */
export class EventHandlerRegistryImpl implements EventHandlerRegistry {
  private handlers: Map<string, IEventHandler[]> = new Map();

  register(handler: IEventHandler): void {
    const eventType = handler.eventType;
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);

    // 按优先级排序
    handlers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  unregister(handler: IEventHandler): void {
    const eventType = handler.eventType;
    const handlers = this.handlers.get(eventType);

    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getHandlers(eventType: string): IEventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  getAllHandlers(): IEventHandler[] {
    const allHandlers: IEventHandler[] = [];
    for (const handlers of this.handlers.values()) {
      allHandlers.push(...handlers);
    }
    return allHandlers;
  }

  clear(): void {
    this.handlers.clear();
  }

  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.length || 0;
    }

    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.length;
    }
    return count;
  }
}
