import { BaseDomainEvent } from '../../../../../shared/domain/events/base.event';

/**
 * @class TenantAdminChangedEvent
 * @description 租户管理员变更事件，表示租户管理员已被更换
 * 
 * 事件数据包含：
 * - tenantId: 租户ID
 * - oldAdminId: 旧管理员ID
 * - newAdminId: 新管理员ID
 * - changedAt: 变更时间
 * - changedBy: 变更操作人ID
 * - reason: 变更原因（可选）
 * 
 * 业务规则：
 * - 每个租户有且只能有一个管理员
 * - 管理员变更必须记录操作人和原因
 * - 新管理员必须是租户内的有效用户
 * - 管理员变更后需要更新相关权限和通知
 */
export class TenantAdminChangedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    eventData: {
      tenantId: string;
      oldAdminId: string;
      newAdminId: string;
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
    super(aggregateId, 'TenantAdminChanged', eventData, options);
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
   * @method getOldAdminId
   * @description 获取旧管理员ID
   * @returns string
   */
  getOldAdminId(): string {
    return this.eventData.oldAdminId;
  }

  /**
   * @method getNewAdminId
   * @description 获取新管理员ID
   * @returns string
   */
  getNewAdminId(): string {
    return this.eventData.newAdminId;
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
   * @method isSelfChange
   * @description 检查是否为管理员自己变更
   * @returns boolean
   */
  isSelfChange(): boolean {
    return this.eventData.oldAdminId === this.eventData.changedBy;
  }

  /**
   * @method isSystemChange
   * @description 检查是否为系统变更
   * @returns boolean
   */
  isSystemChange(): boolean {
    return this.eventData.changedBy === 'SYSTEM';
  }

  /**
   * @method fromJSON
   * @description 从JSON重建事件
   * @param json JSON数据
   * @returns TenantAdminChangedEvent
   */
  static fromJSON(json: Record<string, any>): TenantAdminChangedEvent {
    return new TenantAdminChangedEvent(
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
   * @returns TenantAdminChangedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): TenantAdminChangedEvent {
    return new TenantAdminChangedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        oldAdminId: string;
        newAdminId: string;
        changedAt: string;
        changedBy: string;
        reason?: string;
      },
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
   * @returns TenantAdminChangedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): TenantAdminChangedEvent {
    return new TenantAdminChangedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        oldAdminId: string;
        newAdminId: string;
        changedAt: string;
        changedBy: string;
        reason?: string;
      },
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
   * @returns TenantAdminChangedEvent
   */
  clone(): TenantAdminChangedEvent {
    return new TenantAdminChangedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        oldAdminId: string;
        newAdminId: string;
        changedAt: string;
        changedBy: string;
        reason?: string;
      },
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

    if (!this.eventData.oldAdminId) {
      throw new Error('Old admin ID cannot be empty');
    }

    if (!this.eventData.newAdminId) {
      throw new Error('New admin ID cannot be empty');
    }

    if (this.eventData.oldAdminId === this.eventData.newAdminId) {
      throw new Error('Old admin ID and new admin ID cannot be the same');
    }

    if (!this.eventData.changedAt) {
      throw new Error('Changed at timestamp cannot be empty');
    }

    if (!this.eventData.changedBy) {
      throw new Error('Changed by user ID cannot be empty');
    }

    // 验证用户ID格式（简单验证）
    if (!this.isValidUserId(this.eventData.oldAdminId)) {
      throw new Error('Invalid old admin ID format');
    }

    if (!this.isValidUserId(this.eventData.newAdminId)) {
      throw new Error('Invalid new admin ID format');
    }

    if (!this.isValidUserId(this.eventData.changedBy)) {
      throw new Error('Invalid changed by user ID format');
    }
  }

  /**
   * @method isValidUserId
   * @description 验证用户ID格式
   * @param userId 用户ID
   * @returns boolean
   */
  private isValidUserId(userId: string): boolean {
    // UUID格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId) || userId === 'SYSTEM';
  }
}
