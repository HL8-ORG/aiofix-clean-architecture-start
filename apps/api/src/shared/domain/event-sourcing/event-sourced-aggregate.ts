import { v4 as uuidv4 } from 'uuid';

/**
 * @interface DomainEvent
 * @description 领域事件接口，所有领域事件都必须实现此接口
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly occurredOn: Date;
  readonly eventData: Record<string, any>;
  readonly metadata?: Record<string, any>;
  readonly correlationId?: string;
  readonly causationId?: string;
}

/**
 * @abstract class EventSourcedAggregate
 * @description 事件溯源聚合根基类，为所有聚合根提供事件溯源能力
 * 
 * 核心功能：
 * 1. 管理聚合根的状态变更
 * 2. 记录领域事件
 * 3. 支持事件重放和状态重建
 * 4. 提供事件发布机制
 * 
 * 设计原则：
 * - 聚合根通过事件记录所有状态变更
 * - 事件是不可变的，一旦创建就不能修改
 * - 聚合状态通过重放事件重建
 * - 支持事件版本管理和兼容性
 */
export abstract class EventSourcedAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _version: number = 0;
  private _isReplaying: boolean = false;

  /**
   * @property uncommittedEvents
   * @description 未提交的事件列表
   */
  get uncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * @property version
   * @description 聚合根当前版本号
   */
  get version(): number {
    return this._version;
  }

  /**
   * @property isReplaying
   * @description 是否正在重放事件
   */
  get isReplaying(): boolean {
    return this._isReplaying;
  }

  /**
   * @method apply
   * @description 应用领域事件到聚合根
   * @param event 领域事件
   */
  protected apply(event: DomainEvent): void {
    if (!this._isReplaying) {
      this._uncommittedEvents.push(event);
    }

    this._version++;
    this.handleEvent(event);
  }

  /**
   * @method loadFromHistory
   * @description 从历史事件重建聚合根状态
   * @param events 历史事件列表
   */
  loadFromHistory(events: DomainEvent[]): void {
    this._isReplaying = true;
    this._version = 0;

    for (const event of events) {
      this.handleEvent(event);
      this._version++;
    }

    this._isReplaying = false;
  }

  /**
   * @method markEventsAsCommitted
   * @description 标记事件为已提交
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * @method hasUncommittedEvents
   * @description 检查是否有未提交的事件
   */
  hasUncommittedEvents(): boolean {
    return this._uncommittedEvents.length > 0;
  }

  /**
   * @method getUncommittedEventsCount
   * @description 获取未提交事件数量
   */
  getUncommittedEventsCount(): number {
    return this._uncommittedEvents.length;
  }

  /**
   * @abstract method handleEvent
   * @description 处理领域事件，子类必须实现此方法
   * @param event 领域事件
   */
  protected abstract handleEvent(event: DomainEvent): void;

  /**
   * @method createEventId
   * @description 创建事件ID
   */
  protected createEventId(): string {
    return uuidv4();
  }

  /**
   * @method createEventMetadata
   * @description 创建事件元数据
   */
  protected createEventMetadata(): Record<string, any> {
    return {
      aggregateType: this.constructor.name,
      timestamp: new Date().toISOString(),
      version: this._version
    };
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param event 领域事件
   */
  protected validateEvent(event: DomainEvent): void {
    if (!event.eventId) {
      throw new Error('Event must have an eventId');
    }

    if (!event.aggregateId) {
      throw new Error('Event must have an aggregateId');
    }

    if (!event.eventType) {
      throw new Error('Event must have an eventType');
    }

    if (event.eventVersion < 0) {
      throw new Error('Event version must be non-negative');
    }
  }

  /**
   * @method getSnapshotData
   * @description 获取聚合根快照数据，用于性能优化
   */
  abstract getSnapshotData(): Record<string, any>;

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载聚合根状态
   * @param snapshotData 快照数据
   */
  abstract loadFromSnapshot(snapshotData: Record<string, any>): void;
}
