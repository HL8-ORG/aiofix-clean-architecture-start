import { EventSourcedAggregate, DomainEvent } from '@/shared/domain/event-sourcing/event-sourced-aggregate';
import { SenderId } from '../value-objects/sender-id';
import { SenderType, SenderTypeEnum } from '../value-objects/sender-type';
import { SenderStatus, SenderStatusEnum } from '../value-objects/sender-status';
import { SenderConfig } from './sender-config.entity';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class SenderName
 * @description 发送者名称值对象
 */
export class SenderName extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 200) {
      return false;
    }

    return true;
  }
}

/**
 * @class SenderDescription
 * @description 发送者描述值对象
 */
export class SenderDescription extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    return value.length <= 1000;
  }
}

/**
 * @class NotificationSender
 * @description
 * 通知发送者聚合根，用于管理通知发送者的完整生命周期。
 * 
 * 主要功能与职责：
 * 1. 管理发送者的基本信息和配置
 * 2. 控制发送者的状态和可用性
 * 3. 处理发送者的配置验证和管理
 * 4. 支持发送者的测试和监控
 * 5. 提供发送者的统计和性能数据
 * 
 * 业务规则：
 * - 发送者名称在租户内必须唯一
 * - 只有激活状态的发送者才能发送通知
 * - 发送者配置必须符合类型要求
 * - 发送者状态转换必须遵循预定义规则
 * - 敏感配置必须加密存储
 * 
 * @extends EventSourcedAggregate
 */
export class NotificationSender extends EventSourcedAggregate {
  private _id: SenderId;
  private _name: SenderName;
  private _description?: SenderDescription;
  private _type: SenderType;
  private _status: SenderStatus;
  private _configs: SenderConfig[];
  private _createdBy: UserId;
  private _tenantId?: TenantId;
  private _isDefault: boolean;
  private _metadata?: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastTestAt?: Date;
  private _lastUsedAt?: Date;
  private _successCount: number;
  private _failureCount: number;
  private _totalCount: number;
  private _averageResponseTime: number;

  constructor(
    id: SenderId,
    name: SenderName,
    type: SenderType,
    createdBy: UserId,
    description?: SenderDescription,
    tenantId?: TenantId,
    metadata?: Record<string, any>
  ) {
    super();
    this._id = id;
    this._name = name;
    this._description = description;
    this._type = type;
    this._status = new SenderStatus(SenderStatusEnum.INACTIVE);
    this._configs = [];
    this._createdBy = createdBy;
    this._tenantId = tenantId;
    this._isDefault = false;
    this._metadata = metadata;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._successCount = 0;
    this._failureCount = 0;
    this._totalCount = 0;
    this._averageResponseTime = 0;
  }

  // Getters
  get id(): SenderId {
    return this._id;
  }

  get name(): SenderName {
    return this._name;
  }

  get description(): SenderDescription | undefined {
    return this._description;
  }

  get type(): SenderType {
    return this._type;
  }

  get status(): SenderStatus {
    return this._status;
  }

  get configs(): SenderConfig[] {
    return [...this._configs];
  }

  get createdBy(): UserId {
    return this._createdBy;
  }

  get tenantId(): TenantId | undefined {
    return this._tenantId;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get lastTestAt(): Date | undefined {
    return this._lastTestAt ? new Date(this._lastTestAt) : undefined;
  }

  get lastUsedAt(): Date | undefined {
    return this._lastUsedAt ? new Date(this._lastUsedAt) : undefined;
  }

  get successCount(): number {
    return this._successCount;
  }

  get failureCount(): number {
    return this._failureCount;
  }

  get totalCount(): number {
    return this._totalCount;
  }

  get averageResponseTime(): number {
    return this._averageResponseTime;
  }

  get successRate(): number {
    if (this._totalCount === 0) {
      return 0;
    }
    return (this._successCount / this._totalCount) * 100;
  }

  /**
   * @protected handleEvent
   * @description 处理领域事件，实现EventSourcedAggregate抽象方法
   * @param event 领域事件
   */
  protected handleEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'SenderCreated':
        this.handleSenderCreated(event);
        break;
      case 'SenderUpdated':
        this.handleSenderUpdated(event);
        break;
      case 'SenderStatusChanged':
        this.handleSenderStatusChanged(event);
        break;
      case 'SenderConfigAdded':
        this.handleSenderConfigAdded(event);
        break;
      case 'SenderConfigUpdated':
        this.handleSenderConfigUpdated(event);
        break;
      case 'SenderConfigRemoved':
        this.handleSenderConfigRemoved(event);
        break;
      case 'SenderTested':
        this.handleSenderTested(event);
        break;
      case 'SenderUsed':
        this.handleSenderUsed(event);
        break;
      default:
        // 忽略未知事件类型
        break;
    }
  }

  /**
   * @method getSnapshotData
   * @description 获取快照数据，实现EventSourcedAggregate抽象方法
   * @returns {Record<string, any>} 快照数据
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      name: this._name.value,
      description: this._description?.value,
      type: this._type.value,
      status: this._status.value,
      configs: this._configs.map(c => c.toPlainObject()),
      createdBy: this._createdBy.value,
      tenantId: this._tenantId?.value,
      isDefault: this._isDefault,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      lastTestAt: this._lastTestAt?.toISOString(),
      lastUsedAt: this._lastUsedAt?.toISOString(),
      successCount: this._successCount,
      failureCount: this._failureCount,
      totalCount: this._totalCount,
      averageResponseTime: this._averageResponseTime
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载状态，实现EventSourcedAggregate抽象方法
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new SenderId(snapshotData.id);
    this._name = new SenderName(snapshotData.name);
    this._description = snapshotData.description ? new SenderDescription(snapshotData.description) : undefined;
    this._type = new SenderType(snapshotData.type as SenderTypeEnum);
    this._status = new SenderStatus(snapshotData.status as SenderStatusEnum);
    this._configs = snapshotData.configs?.map((c: any) =>
      new SenderConfig(
        new (SenderConfig as any).ConfigKey(c.key),
        new (SenderConfig as any).ConfigValue(c.value),
        c.isEncrypted,
        c.description,
        c.metadata
      )
    ) || [];
    this._createdBy = new UserId(snapshotData.createdBy);
    this._tenantId = snapshotData.tenantId ? new TenantId(snapshotData.tenantId) : undefined;
    this._isDefault = snapshotData.isDefault;
    this._metadata = snapshotData.metadata;
    this._createdAt = new Date(snapshotData.createdAt);
    this._updatedAt = new Date(snapshotData.updatedAt);
    this._lastTestAt = snapshotData.lastTestAt ? new Date(snapshotData.lastTestAt) : undefined;
    this._lastUsedAt = snapshotData.lastUsedAt ? new Date(snapshotData.lastUsedAt) : undefined;
    this._successCount = snapshotData.successCount;
    this._failureCount = snapshotData.failureCount;
    this._totalCount = snapshotData.totalCount;
    this._averageResponseTime = snapshotData.averageResponseTime;
  }

  // 私有事件处理方法
  private handleSenderCreated(event: DomainEvent): void {
    // 发送者创建事件处理逻辑
  }

  private handleSenderUpdated(event: DomainEvent): void {
    // 发送者更新事件处理逻辑
  }

  private handleSenderStatusChanged(event: DomainEvent): void {
    // 发送者状态变更事件处理逻辑
  }

  private handleSenderConfigAdded(event: DomainEvent): void {
    // 发送者配置添加事件处理逻辑
  }

  private handleSenderConfigUpdated(event: DomainEvent): void {
    // 发送者配置更新事件处理逻辑
  }

  private handleSenderConfigRemoved(event: DomainEvent): void {
    // 发送者配置移除事件处理逻辑
  }

  private handleSenderTested(event: DomainEvent): void {
    // 发送者测试事件处理逻辑
  }

  private handleSenderUsed(event: DomainEvent): void {
    // 发送者使用事件处理逻辑
  }
}
