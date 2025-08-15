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
import { DomainEvent } from '../event-sourcing/event-sourced-aggregate';

/**
 * @abstract class BaseDomainEvent
 * @description 基础领域事件类，为所有领域事件提供通用实现
 * 
 * 核心功能：
 * 1. 提供事件的基本属性
 * 2. 自动生成事件ID和时间戳
 * 3. 支持事件元数据和上下文信息
 * 4. 提供事件序列化和反序列化
 * 
 * 设计原则：
 * - 所有领域事件都继承自此类
 * - 事件是不可变的，一旦创建就不能修改
 * - 事件包含完整的上下文信息
 * - 支持事件版本管理和兼容性
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;
  public readonly metadata: Record<string, any>;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly eventData: Record<string, any>,
    options: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    } = {}
  ) {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
    this.eventVersion = options.eventVersion || 1;
    this.metadata = {
      aggregateType: this.getAggregateType(),
      timestamp: this.occurredOn.toISOString(),
      version: this.eventVersion,
      ...options.metadata
    };
    this.correlationId = options.correlationId;
    this.causationId = options.causationId;

    // 验证事件数据
    this.validateEventData();
  }

  /**
   * @abstract method getAggregateType
   * @description 获取聚合根类型，子类必须实现
   * @returns string 聚合根类型
   */
  protected abstract getAggregateType(): string;

  /**
   * @method validateEventData
   * @description 验证事件数据的有效性
   */
  protected validateEventData(): void {
    if (!this.aggregateId) {
      throw new Error('Event aggregateId cannot be empty');
    }

    if (!this.eventType) {
      throw new Error('Event eventType cannot be empty');
    }

    if (!this.eventData) {
      throw new Error('Event eventData cannot be null or undefined');
    }

    if (this.eventVersion < 1) {
      throw new Error('Event version must be at least 1');
    }
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns Record<string, any>
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      eventData: this.eventData,
      metadata: this.metadata,
      correlationId: this.correlationId,
      causationId: this.causationId
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON格式创建事件（静态方法）
   * @param json JSON数据
   * @returns BaseDomainEvent
   */
  static fromJSON(json: Record<string, any>): BaseDomainEvent {
    // 这是一个抽象方法，子类需要实现具体的反序列化逻辑
    throw new Error('fromJSON method must be implemented by subclasses');
  }

  /**
   * @method getEventName
   * @description 获取事件名称（用于日志和调试）
   * @returns string
   */
  getEventName(): string {
    return this.constructor.name;
  }

  /**
   * @method getEventSummary
   * @description 获取事件摘要（用于日志和调试）
   * @returns string
   */
  getEventSummary(): string {
    return `${this.getEventName()} for aggregate ${this.aggregateId}`;
  }

  /**
   * @method isReplayable
   * @description 检查事件是否可以重放
   * @returns boolean
   */
  isReplayable(): boolean {
    return true; // 默认所有事件都可以重放
  }

  /**
   * @method getEventKey
   * @description 获取事件键（用于去重和幂等性）
   * @returns string
   */
  getEventKey(): string {
    return `${this.aggregateId}:${this.eventType}:${this.eventVersion}`;
  }

  /**
   * @method equals
   * @description 比较两个事件是否相等
   * @param other 另一个事件
   * @returns boolean
   */
  equals(other: BaseDomainEvent): boolean {
    return this.eventId === other.eventId;
  }

  /**
   * @method clone
   * @description 克隆事件（创建新的事件ID）
   * @returns BaseDomainEvent
   */
  clone(): BaseDomainEvent {
    // 子类需要实现具体的克隆逻辑
    throw new Error('clone method must be implemented by subclasses');
  }

  /**
   * @method addMetadata
   * @description 添加元数据（创建新的事件实例）
   * @param key 键
   * @param value 值
   * @returns BaseDomainEvent
   */
  addMetadata(key: string, value: any): BaseDomainEvent {
    const newMetadata = { ...this.metadata, [key]: value };
    return this.createCopyWithMetadata(newMetadata);
  }

  /**
   * @method setCorrelationId
   * @description 设置关联ID（创建新的事件实例）
   * @param correlationId 关联ID
   * @returns BaseDomainEvent
   */
  setCorrelationId(correlationId: string): BaseDomainEvent {
    return this.createCopyWithOptions({ correlationId });
  }

  /**
   * @method setCausationId
   * @description 设置因果ID（创建新的事件实例）
   * @param causationId 因果ID
   * @returns BaseDomainEvent
   */
  setCausationId(causationId: string): BaseDomainEvent {
    return this.createCopyWithOptions({ causationId });
  }

  /**
   * @abstract method createCopyWithMetadata
   * @description 创建带有新元数据的事件副本，子类必须实现
   * @param metadata 新元数据
   * @returns BaseDomainEvent
   */
  protected abstract createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent;

  /**
   * @abstract method createCopyWithOptions
   * @description 创建带有新选项的事件副本，子类必须实现
   * @param options 新选项
   * @returns BaseDomainEvent
   */
  protected abstract createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent;
}

/**
 * @interface EventFactory
 * @description 事件工厂接口，用于创建和重建事件
 */
export interface EventFactory<T extends BaseDomainEvent = BaseDomainEvent> {
  /**
   * @method createEvent
   * @description 创建新事件
   * @param aggregateId 聚合根ID
   * @param eventData 事件数据
   * @param options 选项
   * @returns T
   */
  createEvent(
    aggregateId: string,
    eventData: Record<string, any>,
    options?: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    }
  ): T;

  /**
   * @method fromJSON
   * @description 从JSON重建事件
   * @param json JSON数据
   * @returns T
   */
  fromJSON(json: Record<string, any>): T;

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns string
   */
  getEventType(): string;
}

/**
 * @abstract class BaseEventFactory
 * @description 基础事件工厂类，提供通用实现
 */
export abstract class BaseEventFactory<T extends BaseDomainEvent = BaseDomainEvent> implements EventFactory<T> {
  /**
   * @abstract method createEvent
   * @description 创建新事件，子类必须实现
   */
  abstract createEvent(
    aggregateId: string,
    eventData: Record<string, any>,
    options?: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    }
  ): T;

  /**
   * @abstract method fromJSON
   * @description 从JSON重建事件，子类必须实现
   */
  abstract fromJSON(json: Record<string, any>): T;

  /**
   * @abstract method getEventType
   * @description 获取事件类型，子类必须实现
   */
  abstract getEventType(): string;

  /**
   * @method validateEventData
   * @description 验证事件数据
   * @param eventData 事件数据
   */
  protected validateEventData(eventData: Record<string, any>): void {
    if (!eventData) {
      throw new Error('Event data cannot be null or undefined');
    }
  }

  /**
   * @method createBaseOptions
   * @description 创建基础选项
   * @param options 用户选项
   * @returns 合并后的选项
   */
  protected createBaseOptions(options: {
    eventVersion?: number;
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  } = {}): {
    eventVersion: number;
    metadata: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  } {
    return {
      eventVersion: options.eventVersion || 1,
      metadata: {
        factory: this.constructor.name,
        ...options.metadata
      },
      correlationId: options.correlationId,
      causationId: options.causationId
    };
  }
}
