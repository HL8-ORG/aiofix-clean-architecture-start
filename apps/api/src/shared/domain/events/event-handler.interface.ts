import { DomainEvent, IntegrationEvent } from './base.event';

/**
 * @interface EventHandler
 * @description
 * 事件处理器接口，定义了事件处理的基本契约。
 * 
 * 主要职责：
 * 1. 处理领域事件和集成事件
 * 2. 执行业务逻辑
 * 3. 发送命令或发布新事件
 * 4. 处理事件处理失败的情况
 * 
 * 设计原则：
 * - 事件处理器应该是幂等的
 * - 事件处理器不应该抛出异常，应该记录错误并继续
 * - 事件处理器可以发布新的事件
 * - 事件处理器可以发送命令到其他聚合根
 */
export interface EventHandler<T extends DomainEvent | IntegrationEvent = DomainEvent | IntegrationEvent> {
  /**
   * 处理事件
   * 
   * @param event 要处理的事件
   * @returns 处理结果
   * 
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 执行业务逻辑
   * 3. 发送命令或发布新事件
   * 4. 记录处理结果
   * 5. 返回处理状态
   */
  handle(event: T): Promise<EventHandlerResult>;

  /**
   * 获取处理器支持的事件类型
   * 
   * @returns 支持的事件类型列表
   */
  getSupportedEventTypes(): string[];

  /**
   * 检查是否支持处理指定类型的事件
   * 
   * @param eventType 事件类型
   * @returns 是否支持
   */
  canHandle(eventType: string): boolean;

  /**
   * 获取处理器名称
   * 
   * @returns 处理器名称
   */
  getHandlerName(): string;
}

/**
 * @interface EventHandlerResult
 * @description
 * 事件处理结果
 */
export interface EventHandlerResult {
  /**
   * 处理是否成功
   */
  success: boolean;

  /**
   * 处理消息
   */
  message?: string;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 处理时间戳
   */
  processedAt: Date;

  /**
   * 处理耗时（毫秒）
   */
  processingTime: number;

  /**
   * 额外数据
   */
  metadata?: Record<string, any>;
}

/**
 * @interface EventHandlerRegistry
 * @description
 * 事件处理器注册表接口
 */
export interface EventHandlerRegistry {
  /**
   * 注册事件处理器
   * 
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  register(eventType: string, handler: EventHandler): void;

  /**
   * 注销事件处理器
   * 
   * @param eventType 事件类型
   * @param handlerName 处理器名称
   */
  unregister(eventType: string, handlerName: string): void;

  /**
   * 获取指定事件类型的所有处理器
   * 
   * @param eventType 事件类型
   * @returns 事件处理器列表
   */
  getHandlers(eventType: string): EventHandler[];

  /**
   * 获取所有注册的事件类型
   * 
   * @returns 事件类型列表
   */
  getRegisteredEventTypes(): string[];

  /**
   * 检查是否有处理器支持指定事件类型
   * 
   * @param eventType 事件类型
   * @returns 是否有处理器
   */
  hasHandlers(eventType: string): boolean;

  /**
   * 清空所有注册的处理器
   */
  clear(): void;
}

/**
 * @interface EventPublisher
 * @description
 * 事件发布器接口
 */
export interface EventPublisher {
  /**
   * 发布领域事件
   * 
   * @param events 要发布的事件列表
   * @returns 发布结果
   */
  publishDomainEvents(events: DomainEvent[]): Promise<EventPublishResult[]>;

  /**
   * 发布集成事件
   * 
   * @param events 要发布的事件列表
   * @returns 发布结果
   */
  publishIntegrationEvents(events: IntegrationEvent[]): Promise<EventPublishResult[]>;

  /**
   * 发布单个事件
   * 
   * @param event 要发布的事件
   * @returns 发布结果
   */
  publishEvent(event: DomainEvent | IntegrationEvent): Promise<EventPublishResult>;

  /**
   * 订阅事件
   * 
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  subscribe(eventType: string, handler: EventHandler): void;

  /**
   * 取消订阅
   * 
   * @param eventType 事件类型
   * @param handlerName 处理器名称
   */
  unsubscribe(eventType: string, handlerName: string): void;
}

/**
 * @interface EventPublishResult
 * @description
 * 事件发布结果
 */
export interface EventPublishResult {
  /**
   * 事件ID
   */
  eventId: string;

  /**
   * 发布是否成功
   */
  success: boolean;

  /**
   * 发布消息
   */
  message?: string;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 发布时间戳
   */
  publishedAt: Date;

  /**
   * 处理器处理结果
   */
  handlerResults?: EventHandlerResult[];
}

/**
 * @interface EventBus
 * @description
 * 事件总线接口，整合事件发布和订阅功能
 */
export interface EventBus extends EventPublisher, EventHandlerRegistry {
  /**
   * 启动事件总线
   */
  start(): Promise<void>;

  /**
   * 停止事件总线
   */
  stop(): Promise<void>;

  /**
   * 获取事件总线状态
   */
  getStatus(): EventBusStatus;
}

/**
 * @interface EventBusStatus
 * @description
 * 事件总线状态
 */
export interface EventBusStatus {
  /**
   * 是否正在运行
   */
  isRunning: boolean;

  /**
   * 已处理的事件数量
   */
  processedEventsCount: number;

  /**
   * 失败的事件数量
   */
  failedEventsCount: number;

  /**
   * 注册的处理器数量
   */
  registeredHandlersCount: number;

  /**
   * 启动时间
   */
  startedAt?: Date;

  /**
   * 最后处理事件的时间
   */
  lastProcessedAt?: Date;
}

/**
 * @abstract BaseEventHandler
 * @description
 * 事件处理器抽象基类，提供通用的处理逻辑
 */
export abstract class BaseEventHandler<T extends DomainEvent | IntegrationEvent = DomainEvent | IntegrationEvent> 
  implements EventHandler<T> {
  
  /**
   * 处理器名称
   */
  protected abstract readonly handlerName: string;

  /**
   * 支持的事件类型
   */
  protected abstract readonly supportedEventTypes: string[];

  /**
   * 处理事件
   * 
   * @param event 要处理的事件
   * @returns 处理结果
   */
  async handle(event: T): Promise<EventHandlerResult> {
    const startTime = Date.now();
    
    try {
      // 验证事件
      this.validateEvent(event);

      // 执行业务逻辑
      await this.processEvent(event);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        message: `事件 ${event.eventType} 处理成功`,
        processedAt: new Date(),
        processingTime,
        metadata: {
          eventId: event.eventId,
          aggregateId: 'aggregateId' in event ? event.aggregateId : undefined,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processedAt: new Date(),
        processingTime,
        metadata: {
          eventId: event.eventId,
          aggregateId: 'aggregateId' in event ? event.aggregateId : undefined,
        },
      };
    }
  }

  /**
   * 获取处理器支持的事件类型
   */
  getSupportedEventTypes(): string[] {
    return [...this.supportedEventTypes];
  }

  /**
   * 检查是否支持处理指定类型的事件
   */
  canHandle(eventType: string): boolean {
    return this.supportedEventTypes.includes(eventType);
  }

  /**
   * 获取处理器名称
   */
  getHandlerName(): string {
    return this.handlerName;
  }

  /**
   * 验证事件
   * 
   * @param event 要验证的事件
   */
  protected validateEvent(event: T): void {
    if (!event) {
      throw new Error('事件不能为空');
    }

    if (!this.canHandle(event.eventType)) {
      throw new Error(`处理器 ${this.handlerName} 不支持事件类型 ${event.eventType}`);
    }
  }

  /**
   * 处理事件的具体业务逻辑
   * 
   * @param event 要处理的事件
   */
  protected abstract processEvent(event: T): Promise<void>;
}
