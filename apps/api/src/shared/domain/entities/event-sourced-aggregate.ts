import { BaseEntity } from './base.entity';
import { BaseEvent, DomainEvent } from '../events/base.event';

/**
 * @interface EventSourcedAggregateRoot
 * @description
 * 事件溯源聚合根接口，定义了事件溯源聚合根的基本契约。
 * 
 * 主要职责：
 * 1. 管理聚合根的事件列表
 * 2. 提供事件应用和发布机制
 * 3. 支持从事件流重建聚合根状态
 * 4. 维护聚合根版本号
 * 
 * 设计原则：
 * - 聚合根是事件溯源的核心，所有状态变更都通过事件进行
 * - 聚合根负责确保业务规则的一致性
 * - 聚合根版本号用于乐观锁和并发控制
 */
export interface EventSourcedAggregateRoot {
  /**
   * 获取聚合根ID
   */
  readonly id: string;

  /**
   * 获取聚合根版本号
   */
  readonly version: number;

  /**
   * 获取未提交的事件列表
   */
  readonly uncommittedEvents: DomainEvent[];

  /**
   * 应用领域事件到聚合根
   */
  applyEvent(event: DomainEvent): void;

  /**
   * 从事件流重建聚合根状态
   */
  loadFromHistory(events: DomainEvent[]): void;

  /**
   * 标记所有事件为已提交
   */
  markEventsAsCommitted(): void;

  /**
   * 检查聚合根是否有未提交的事件
   */
  hasUncommittedEvents(): boolean;
}

/**
 * @abstract EventSourcedAggregate
 * @description
 * 事件溯源聚合根抽象基类，实现了事件溯源的核心功能。
 * 
 * 主要功能：
 * 1. 事件管理：收集、存储和应用领域事件
 * 2. 状态重建：从事件历史中重建聚合根状态
 * 3. 版本控制：维护聚合根版本号用于并发控制
 * 4. 快照支持：支持快照机制提高性能
 * 
 * 使用方式：
 * ```typescript
 * class Tenant extends EventSourcedAggregate {
 *   private _name: string;
 *   private _status: TenantStatus;
 * 
 *   constructor(id: string, name: string) {
 *     super(id);
 *     this.applyEvent(new TenantCreatedEvent(id, name));
 *   }
 * 
 *   rename(newName: string): void {
 *     this.applyEvent(new TenantRenamedEvent(this.id, newName));
 *   }
 * 
 *   // 事件处理器
 *   private onTenantCreated(event: TenantCreatedEvent): void {
 *     this._name = event.name;
 *     this._status = TenantStatus.ACTIVE;
 *   }
 * 
 *   private onTenantRenamed(event: TenantRenamedEvent): void {
 *     this._name = event.newName;
 *   }
 * }
 * ```
 */
export abstract class EventSourcedAggregate extends BaseEntity implements EventSourcedAggregateRoot {
  /**
   * 未提交的事件列表
   */
  private readonly _uncommittedEvents: DomainEvent[] = [];

  /**
   * 聚合根版本号，用于乐观锁
   */
  private _aggregateVersion: number = 0;

  /**
   * 构造函数
   * @param id 聚合根ID
   * @param skipInitialization 是否跳过初始化（用于从历史重建）
   */
  constructor(id: string, skipInitialization: boolean = false) {
    super(id);
  }

  /**
   * 获取聚合根版本号
   */
  get version(): number {
    return this._aggregateVersion;
  }

  /**
   * 获取未提交的事件列表
   */
  get uncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 应用领域事件到聚合根
   * 
   * @param event 领域事件
   * 
   * 处理流程：
   * 1. 将事件添加到未提交事件列表
   * 2. 调用对应的事件处理器方法
   * 3. 更新聚合根版本号
   * 4. 更新聚合根的更新时间
   */
  applyEvent(event: DomainEvent): void {
    // 验证事件
    this.validateEvent(event);

    // 将事件添加到未提交事件列表
    this._uncommittedEvents.push(event);

    // 调用事件处理器
    this.handleEvent(event);

    // 更新版本号
    this._aggregateVersion++;

    // 更新聚合根状态
    this._updatedAt = new Date();
  }

  /**
   * 从事件流重建聚合根状态
   * 
   * @param events 事件历史列表
   * 
   * 重建流程：
   * 1. 清空当前状态
   * 2. 按顺序应用所有事件
   * 3. 更新版本号到最新
   * 4. 清空未提交事件列表
   */
  loadFromHistory(events: DomainEvent[]): void {
    // 清空当前状态
    this.clearState();

    // 按顺序应用所有事件
    for (const event of events) {
      // 在重建过程中，直接调用事件处理器，不进行版本验证
      this.handleEventWithoutValidation(event);
      this._aggregateVersion++;
    }

    // 清空未提交事件列表
    this._uncommittedEvents.length = 0;

    // 更新聚合根状态
    this._updatedAt = new Date();
  }

  /**
   * 标记所有事件为已提交
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents.length = 0;
  }

  /**
   * 检查聚合根是否有未提交的事件
   */
  hasUncommittedEvents(): boolean {
    return this._uncommittedEvents.length > 0;
  }

  /**
   * 获取聚合根的快照
   * 
   * @returns 聚合根快照数据
   */
  toSnapshot(): Record<string, any> {
    const baseSnapshot = super.toSnapshot();
    return {
      ...baseSnapshot,
      version: this._aggregateVersion,
      uncommittedEventsCount: this._uncommittedEvents.length,
    };
  }

  /**
   * 从快照恢复聚合根状态
   * 
   * @param snapshot 快照数据
   */
  fromSnapshot(snapshot: Record<string, any>): void {
    super.fromSnapshot(snapshot);
    if (snapshot.version !== undefined) {
      this._aggregateVersion = snapshot.version;
    }
  }

  /**
   * 验证事件的有效性
   * 
   * @param event 领域事件
   */
  protected validateEvent(event: DomainEvent): void {
    if (!event) {
      throw new Error('事件不能为空');
    }

    if (event.aggregateId !== this.id) {
      throw new Error(`事件聚合根ID不匹配: 期望 ${this.id}, 实际 ${event.aggregateId}`);
    }

    if (event.aggregateVersion !== this._aggregateVersion) {
      throw new Error(`事件版本不匹配: 期望 ${this._aggregateVersion}, 实际 ${event.aggregateVersion}`);
    }
  }

  /**
 * 处理领域事件
 * 
 * @param event 领域事件
 * 
 * 事件处理机制：
 * 1. 根据事件类型动态调用对应的处理器方法
 * 2. 处理器方法命名规则：on + 事件类名（去掉Event后缀）
 * 3. 如果处理器不存在，则忽略该事件
 */
  protected handleEvent(event: DomainEvent): void {
    // 验证事件
    this.validateEvent(event);

    // 调用事件处理器
    this.handleEventWithoutValidation(event);
  }

  /**
   * 处理领域事件（不进行验证）
   * 
   * @param event 领域事件
   */
  protected handleEventWithoutValidation(event: DomainEvent): void {
    // 去掉事件类名末尾的"Event"后缀
    const eventClassName = event.constructor.name;
    const handlerName = eventClassName.endsWith('Event')
      ? `on${eventClassName.slice(0, -5)}`
      : `on${eventClassName}`;

    const handler = (this as any)[handlerName];

    if (typeof handler === 'function') {
      handler.call(this, event);
    } else {
      // 如果处理器不存在，记录警告但不抛出异常
      console.warn(`事件处理器 ${handlerName} 不存在，事件 ${event.constructor.name} 将被忽略`);
    }
  }

  /**
   * 清空聚合根状态
   * 
   * 子类应该重写此方法以清空自己的状态
   */
  protected clearState(): void {
    // 基类不做任何操作，子类应该重写此方法
  }

  /**
   * 创建聚合根实例（工厂方法）
   * 
   * @param id 聚合根ID
   * @returns 聚合根实例
   */
  static create<T extends EventSourcedAggregate>(
    this: new (id: string) => T,
    id: string
  ): T {
    return new this(id);
  }

  /**
 * 从事件历史重建聚合根实例
 * 
 * @param id 聚合根ID
 * @param events 事件历史
 * @returns 聚合根实例
 */
  static fromHistory<T extends EventSourcedAggregate>(
    this: new (id: string, skipInitialization?: boolean) => T,
    id: string,
    events: DomainEvent[]
  ): T {
    const aggregate = new this(id, true);
    aggregate.loadFromHistory(events);
    return aggregate;
  }
}
