import { BaseDomainEvent } from '../../../../../shared/domain/events/base.event';

/**
 * @class TenantRenamedEvent
 * @description 租户重命名事件，表示租户名称已被修改
 * 
 * 事件数据包含：
 * - tenantId: 租户ID
 * - oldName: 旧租户名称
 * - newName: 新租户名称
 * - renamedAt: 重命名时间
 * - renamedBy: 重命名操作人ID
 * 
 * 业务规则：
 * - 租户名称必须全局唯一
 * - 重命名操作必须记录操作人
 * - 重命名后需要更新相关缓存和索引
 */
export class TenantRenamedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    eventData: {
      tenantId: string;
      oldName: string;
      newName: string;
      renamedAt: string;
      renamedBy: string;
    },
    options: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    } = {}
  ) {
    super(aggregateId, 'TenantRenamed', eventData, options);
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
   * @method getOldName
   * @description 获取旧租户名称
   * @returns string
   */
  getOldName(): string {
    return this.eventData.oldName;
  }

  /**
   * @method getNewName
   * @description 获取新租户名称
   * @returns string
   */
  getNewName(): string {
    return this.eventData.newName;
  }

  /**
   * @method getRenamedAt
   * @description 获取重命名时间
   * @returns string
   */
  getRenamedAt(): string {
    return this.eventData.renamedAt;
  }

  /**
   * @method getRenamedBy
   * @description 获取重命名操作人ID
   * @returns string
   */
  getRenamedBy(): string {
    return this.eventData.renamedBy;
  }

  /**
   * @method fromJSON
   * @description 从JSON重建事件
   * @param json JSON数据
   * @returns TenantRenamedEvent
   */
  static fromJSON(json: Record<string, any>): TenantRenamedEvent {
    return new TenantRenamedEvent(
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
   * @returns TenantRenamedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): TenantRenamedEvent {
    return new TenantRenamedEvent(
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
   * @returns TenantRenamedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): TenantRenamedEvent {
    return new TenantRenamedEvent(
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
   * @returns TenantRenamedEvent
   */
  clone(): TenantRenamedEvent {
    return new TenantRenamedEvent(
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

    if (!this.eventData.oldName) {
      throw new Error('Old tenant name cannot be empty');
    }

    if (!this.eventData.newName) {
      throw new Error('New tenant name cannot be empty');
    }

    if (this.eventData.oldName === this.eventData.newName) {
      throw new Error('Old name and new name cannot be the same');
    }

    if (!this.eventData.renamedAt) {
      throw new Error('Renamed at timestamp cannot be empty');
    }

    if (!this.eventData.renamedBy) {
      throw new Error('Renamed by user ID cannot be empty');
    }
  }
}
