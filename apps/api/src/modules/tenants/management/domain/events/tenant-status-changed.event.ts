import { BaseDomainEvent } from '../../../../../shared/domain/events/base.event';

/**
 * @class TenantStatusChangedEvent
 * @description 租户状态变更事件，表示租户状态已被修改
 * 
 * 事件数据包含：
 * - tenantId: 租户ID
 * - oldStatus: 旧状态
 * - newStatus: 新状态
 * - changedAt: 变更时间
 * - changedBy: 变更操作人ID
 * - reason: 变更原因（可选）
 * 
 * 业务规则：
 * - 默认系统租户不能被停用或删除
 * - 状态变更必须记录操作人和原因
 * - 状态变更后需要更新相关缓存和权限
 */
export class TenantStatusChangedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    eventData: {
      tenantId: string;
      oldStatus: string;
      newStatus: string;
      changedAt: string;
      changedBy: string;
      reason?: string;
    },
    options: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    } = {}
  ) {
    super(aggregateId, 'TenantStatusChanged', eventData, options);
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns string
   */
  protected getAggregateType(): string {
    return 'Tenant';
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns string
   */
  getTenantId(): string {
    return this.eventData.tenantId;
  }

  /**
   * @method getOldStatus
   * @description 获取旧状态
   * @returns string
   */
  getOldStatus(): string {
    return this.eventData.oldStatus;
  }

  /**
   * @method getNewStatus
   * @description 获取新状态
   * @returns string
   */
  getNewStatus(): string {
    return this.eventData.newStatus;
  }

  /**
   * @method getChangedAt
   * @description 获取变更时间
   * @returns string
   */
  getChangedAt(): string {
    return this.eventData.changedAt;
  }

  /**
   * @method getChangedBy
   * @description 获取变更操作人ID
   * @returns string
   */
  getChangedBy(): string {
    return this.eventData.changedBy;
  }

  /**
   * @method getReason
   * @description 获取变更原因
   * @returns string | undefined
   */
  getReason(): string | undefined {
    return this.eventData.reason;
  }

  /**
   * @method isActivation
   * @description 检查是否为激活操作
   * @returns boolean
   */
  isActivation(): boolean {
    return this.eventData.oldStatus === 'INACTIVE' && this.eventData.newStatus === 'ACTIVE';
  }

  /**
   * @method isDeactivation
   * @description 检查是否为停用操作
   * @returns boolean
   */
  isDeactivation(): boolean {
    return this.eventData.oldStatus === 'ACTIVE' && this.eventData.newStatus === 'INACTIVE';
  }

  /**
   * @method isDeletion
   * @description 检查是否为删除操作
   * @returns boolean
   */
  isDeletion(): boolean {
    return this.eventData.newStatus === 'DELETED';
  }

  /**
   * @method fromJSON
   * @description 从JSON重建事件
   * @param json JSON数据
   * @returns TenantStatusChangedEvent
   */
  static fromJSON(json: Record<string, any>): TenantStatusChangedEvent {
    return new TenantStatusChangedEvent(
      json.aggregateId,
      json.eventData,
      {
        eventVersion: json.eventVersion,
        metadata: json.metadata,
        correlationId: json.correlationId,
        causationId: json.causationId
      }
    );
  }

  /**
   * @method createCopyWithMetadata
   * @description 创建带有新元数据的事件副本
   * @param metadata 新元数据
   * @returns TenantStatusChangedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): TenantStatusChangedEvent {
    return new TenantStatusChangedEvent(
      this.aggregateId,
      this.eventData,
      {
        eventVersion: this.eventVersion,
        metadata,
        correlationId: this.correlationId,
        causationId: this.causationId
      }
    );
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的事件副本
   * @param options 新选项
   * @returns TenantStatusChangedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): TenantStatusChangedEvent {
    return new TenantStatusChangedEvent(
      this.aggregateId,
      this.eventData,
      {
        eventVersion: this.eventVersion,
        metadata: { ...this.metadata, ...options.metadata },
        correlationId: options.correlationId ?? this.correlationId,
        causationId: options.causationId ?? this.causationId
      }
    );
  }

  /**
   * @method clone
   * @description 克隆事件（创建新的事件ID）
   * @returns TenantStatusChangedEvent
   */
  clone(): TenantStatusChangedEvent {
    return new TenantStatusChangedEvent(
      this.aggregateId,
      this.eventData,
      {
        eventVersion: this.eventVersion,
        metadata: this.metadata,
        correlationId: this.correlationId,
        causationId: this.causationId
      }
    );
  }

  /**
   * @method validateEventData
   * @description 验证事件数据的有效性
   */
  protected validateEventData(): void {
    super.validateEventData();

    if (!this.eventData.tenantId) {
      throw new Error('Tenant ID cannot be empty');
    }

    if (!this.eventData.oldStatus) {
      throw new Error('Old status cannot be empty');
    }

    if (!this.eventData.newStatus) {
      throw new Error('New status cannot be empty');
    }

    if (this.eventData.oldStatus === this.eventData.newStatus) {
      throw new Error('Old status and new status cannot be the same');
    }

    if (!this.eventData.changedAt) {
      throw new Error('Changed at timestamp cannot be empty');
    }

    if (!this.eventData.changedBy) {
      throw new Error('Changed by user ID cannot be empty');
    }

    // 验证状态值的有效性
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'];
    if (!validStatuses.includes(this.eventData.oldStatus)) {
      throw new Error(`Invalid old status: ${this.eventData.oldStatus}`);
    }

    if (!validStatuses.includes(this.eventData.newStatus)) {
      throw new Error(`Invalid new status: ${this.eventData.newStatus}`);
    }

    // 检查是否为默认系统租户的删除操作
    if (this.eventData.tenantId === 'SYSTEM' && this.eventData.newStatus === 'DELETED') {
      throw new Error('Default system tenant cannot be deleted');
    }
  }
}
