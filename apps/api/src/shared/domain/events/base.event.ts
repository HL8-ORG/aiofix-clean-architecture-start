/**
 * @file base.event.ts
 * @description 领域事件基础类
 * 
 * 该文件定义了所有领域事件的基类，提供事件的基本功能和属性。
 * 遵循DDD原则，事件是不可变的，表示已发生的事实。
 * 
 * 主要功能：
 * 1. 提供事件的基本属性（ID、时间戳、版本等）
 * 2. 提供事件的元数据管理
 * 3. 提供事件的序列化和反序列化
 * 4. 提供事件的验证能力
 * 5. 提供事件的分类和版本管理
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * @interface RequestContext
 * @description 请求上下文接口，用于事件追踪
 */
export interface RequestContext {
  /** 请求ID */
  requestId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 关联ID */
  correlationId?: string;
  /** 时间戳 */
  timestamp: Date;
  /** 用户代理 */
  userAgent?: string;
  /** IP地址 */
  ipAddress?: string;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface EventMetadata
 * @description 事件元数据接口
 */
export interface EventMetadata {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 事件版本 */
  eventVersion: number;
  /** 聚合ID */
  aggregateId: string;
  /** 聚合类型 */
  aggregateType: string;
  /** 聚合版本 */
  aggregateVersion: number;
  /** 发生时间 */
  occurredOn: Date;
  /** 请求上下文 */
  requestContext?: RequestContext;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface IEvent
 * @description 事件接口，定义事件的基本契约
 */
export interface IEvent {
  /** 事件元数据 */
  readonly metadata: EventMetadata;

  /** 获取事件ID */
  getEventId(): string;
  /** 获取事件类型 */
  getEventType(): string;
  /** 获取事件版本 */
  getEventVersion(): number;
  /** 获取聚合ID */
  getAggregateId(): string;
  /** 获取聚合类型 */
  getAggregateType(): string;
  /** 获取聚合版本 */
  getAggregateVersion(): number;
  /** 获取发生时间 */
  getOccurredOn(): Date;
  /** 获取请求上下文 */
  getRequestContext(): RequestContext | undefined;
  /** 验证事件有效性 */
  validate(): boolean;
  /** 转换为JSON */
  toJSON(): Record<string, any>;
}

/**
 * @abstract BaseEvent
 * @description 事件基础抽象类
 * 
 * 提供所有领域事件的通用功能，包括：
 * - 事件元数据管理
 * - 事件版本控制
 * - 事件序列化
 * - 事件验证
 * - 请求上下文追踪
 */
export abstract class BaseEvent implements IEvent {
  /** 事件元数据 */
  protected readonly _metadata: EventMetadata;

  /**
   * @constructor
   * @param aggregateId 聚合ID
   * @param aggregateType 聚合类型
   * @param aggregateVersion 聚合版本
   * @param requestContext 请求上下文
   * @param metadata 额外元数据
   */
  constructor(
    aggregateId: string,
    aggregateType: string,
    aggregateVersion: number,
    requestContext?: RequestContext,
    metadata?: Record<string, any>
  ) {
    this._metadata = {
      eventId: uuidv4(),
      eventType: this.constructor.name,
      eventVersion: 1,
      aggregateId,
      aggregateType,
      aggregateVersion,
      occurredOn: new Date(),
      requestContext,
      metadata: metadata || {},
    };
  }

  /**
   * @getter metadata
   * @description 获取事件元数据
   */
  get metadata(): EventMetadata {
    return this._metadata;
  }

  /**
   * @method getEventId
   * @description 获取事件ID
   * @returns 事件ID
   */
  getEventId(): string {
    return this._metadata.eventId;
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns 事件类型
   */
  getEventType(): string {
    return this._metadata.eventType;
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本
   * @returns 事件版本
   */
  getEventVersion(): number {
    return this._metadata.eventVersion;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合ID
   * @returns 聚合ID
   */
  getAggregateId(): string {
    return this._metadata.aggregateId;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合类型
   * @returns 聚合类型
   */
  getAggregateType(): string {
    return this._metadata.aggregateType;
  }

  /**
   * @method getAggregateVersion
   * @description 获取聚合版本
   * @returns 聚合版本
   */
  getAggregateVersion(): number {
    return this._metadata.aggregateVersion;
  }

  /**
   * @method getOccurredOn
   * @description 获取发生时间
   * @returns 发生时间
   */
  getOccurredOn(): Date {
    return this._metadata.occurredOn;
  }

  /**
   * @method getRequestContext
   * @description 获取请求上下文
   * @returns 请求上下文
   */
  getRequestContext(): RequestContext | undefined {
    return this._metadata.requestContext;
  }

  /**
   * @method validate
   * @description 验证事件有效性
   * @returns 是否有效
   */
  validate(): boolean {
    return this.validateMetadata() && this.validateEventData();
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON
   * @returns JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      metadata: this._metadata,
      data: this.getEventData(),
    };
  }

  /**
   * @method toString
   * @description 将事件转换为字符串
   * @returns 字符串表示
   */
  toString(): string {
    return `${this._metadata.eventType}(id=${this._metadata.eventId}, aggregateId=${this._metadata.aggregateId})`;
  }



  /**
   * @protected getEventData
   * @description 获取事件数据
   * @returns 事件数据
   */
  protected abstract getEventData(): Record<string, any>;

  /**
   * @protected validateMetadata
   * @description 验证事件元数据
   * @returns 是否有效
   */
  protected validateMetadata(): boolean {
    return !!(
      this._metadata.eventId &&
      this._metadata.eventType &&
      this._metadata.aggregateId &&
      this._metadata.aggregateType &&
      this._metadata.occurredOn
    );
  }

  /**
   * @protected validateEventData
   * @description 验证事件数据
   * @returns 是否有效
   */
  protected validateEventData(): boolean {
    return true; // 子类可以重写此方法
  }
}

/**
 * @abstract DomainEvent
 * @description 领域事件抽象类
 * 
 * 领域事件表示领域内发生的重要事件，用于：
 * - 通知其他聚合或领域服务
 * - 触发业务流程
 * - 记录审计日志
 * - 实现事件溯源
 */
export abstract class DomainEvent extends BaseEvent {
  /**
   * @constructor
   * @param aggregateId 聚合ID
   * @param aggregateType 聚合类型
   * @param aggregateVersion 聚合版本
   * @param requestContext 请求上下文
   * @param metadata 额外元数据
   */
  constructor(
    aggregateId: string,
    aggregateType: string,
    aggregateVersion: number,
    requestContext?: RequestContext,
    metadata?: Record<string, any>
  ) {
    super(aggregateId, aggregateType, aggregateVersion, requestContext, metadata);
  }

  /**
   * @method isDomainEvent
   * @description 检查是否为领域事件
   * @returns 是否为领域事件
   */
  isDomainEvent(): boolean {
    return true;
  }
}

/**
 * @abstract IntegrationEvent
 * @description 集成事件抽象类
 * 
 * 集成事件用于跨边界上下文或外部系统的通信，包括：
 * - 跨微服务通信
 * - 外部系统集成
 * - 消息队列发布
 * - 事件总线传播
 */
export abstract class IntegrationEvent extends BaseEvent {
  /** 目标系统 */
  protected readonly _targetSystem: string;
  /** 事件优先级 */
  protected readonly _priority: number;

  /**
   * @constructor
   * @param aggregateId 聚合ID
   * @param aggregateType 聚合类型
   * @param aggregateVersion 聚合版本
   * @param targetSystem 目标系统
   * @param priority 事件优先级
   * @param requestContext 请求上下文
   * @param metadata 额外元数据
   */
  constructor(
    aggregateId: string,
    aggregateType: string,
    aggregateVersion: number,
    targetSystem: string,
    priority: number = 0,
    requestContext?: RequestContext,
    metadata?: Record<string, any>
  ) {
    super(aggregateId, aggregateType, aggregateVersion, requestContext, metadata);
    this._targetSystem = targetSystem;
    this._priority = priority;
  }

  /**
   * @method getTargetSystem
   * @description 获取目标系统
   * @returns 目标系统
   */
  getTargetSystem(): string {
    return this._targetSystem;
  }

  /**
   * @method getPriority
   * @description 获取事件优先级
   * @returns 事件优先级
   */
  getPriority(): number {
    return this._priority;
  }

  /**
   * @method isIntegrationEvent
   * @description 检查是否为集成事件
   * @returns 是否为集成事件
   */
  isIntegrationEvent(): boolean {
    return true;
  }

  /**
   * @protected validateMetadata
   * @description 验证集成事件元数据
   * @returns 是否有效
   */
  protected validateMetadata(): boolean {
    return super.validateMetadata() && !!this._targetSystem;
  }

  /**
   * @protected getEventData
   * @description 获取集成事件数据
   * @returns 事件数据
   */
  protected getEventData(): Record<string, any> {
    return {
      targetSystem: this._targetSystem,
      priority: this._priority,
      ...this.getIntegrationEventData(),
    };
  }

  /**
   * @protected getIntegrationEventData
   * @description 获取集成事件特定数据
   * @returns 集成事件数据
   */
  protected abstract getIntegrationEventData(): Record<string, any>;
}
