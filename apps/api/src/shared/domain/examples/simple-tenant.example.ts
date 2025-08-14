import { EventSourcedAggregate } from '../entities/event-sourced-aggregate';
import { DomainEvent } from '../events/base.event';

/**
 * @class SimpleTenantCreatedEvent
 * @description
 * 简化租户创建事件
 */
export class SimpleTenantCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly name: string
  ) {
    super(aggregateId, 'SimpleTenant', 0);
  }

  protected serializeEventData(): Record<string, any> {
    return { name: this.name };
  }

  protected deserializeEventData(json: Record<string, any>): void {
    // 不需要反序列化
  }
}

/**
 * @class SimpleTenant
 * @description
 * 简化租户聚合根，用于测试事件溯源
 */
export class SimpleTenant extends EventSourcedAggregate {
  private _name: string = '';

  constructor(id: string, name: string, skipInitialization: boolean = false) {
    super(id, skipInitialization);
    if (!skipInitialization) {
      this.applyEvent(new SimpleTenantCreatedEvent(id, name));
    }
  }

  get name(): string {
    return this._name;
  }

  /**
   * 处理租户创建事件
   */
  private onSimpleTenantCreated(event: SimpleTenantCreatedEvent): void {
    this._name = event.name;
  }

  /**
   * 清空聚合根状态
   */
  protected clearState(): void {
    this._name = '';
  }
}
