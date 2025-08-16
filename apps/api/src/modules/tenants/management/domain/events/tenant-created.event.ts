import { BaseDomainEvent } from '../../../../../shared/domain/events/base.event';

/**
 * @class TenantCreatedEvent
 * @description 租户创建事件，表示租户已被创建
 * 
 * 事件数据包含：
 * - tenantId: 租户ID
 * - code: 租户代码
 * - name: 租户名称
 * - adminId: 租户管理员ID
 * - description: 租户描述（可选）
 * - domain: 租户域名（可选）
 * - status: 租户状态
 * - config: 租户配置
 * 
 * 业务规则：
 * - 租户创建后状态默认为ACTIVE
 * - 租户代码和名称必须全局唯一
 * - 每个租户有且只能有一个管理员
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    eventData: {
      tenantId: string;
      code: string;
      name: string;
      adminId: string;
      description?: string;
      domain?: string;
      status: string;
      config: Record<string, any>;
    },
    options: {
      eventVersion?: number;
      metadata?: Record<string, any>;
      correlationId?: string;
      causationId?: string;
    } = {}
  ) {
    super(aggregateId, 'TenantCreated', eventData, options);
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
   * @method getCode
   * @description 获取租户代码
   * @returns string
   */
  getCode(): string {
    return this.eventData.code;
  }

  /**
   * @method getName
   * @description 获取租户名称
   * @returns string
   */
  getName(): string {
    return this.eventData.name;
  }

  /**
   * @method getAdminId
   * @description 获取租户管理员ID
   * @returns string
   */
  getAdminId(): string {
    return this.eventData.adminId;
  }

  /**
   * @method getDescription
   * @description 获取租户描述
   * @returns string | undefined
   */
  getDescription(): string | undefined {
    return this.eventData.description;
  }

  /**
   * @method getDomain
   * @description 获取租户域名
   * @returns string | undefined
   */
  getDomain(): string | undefined {
    return this.eventData.domain;
  }

  /**
   * @method getStatus
   * @description 获取租户状态
   * @returns string
   */
  getStatus(): string {
    return this.eventData.status;
  }

  /**
   * @method getConfig
   * @description 获取租户配置
   * @returns Record<string, any>
   */
  getConfig(): Record<string, any> {
    return this.eventData.config;
  }

  /**
   * @method fromJSON
   * @description 从JSON重建事件
   * @param json JSON数据
   * @returns TenantCreatedEvent
   */
  static fromJSON(json: Record<string, any>): TenantCreatedEvent {
    return new TenantCreatedEvent(
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
   * @returns TenantCreatedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): TenantCreatedEvent {
    return new TenantCreatedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        code: string;
        name: string;
        adminId: string;
        description?: string;
        domain?: string;
        status: string;
        config: Record<string, any>;
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
   * @returns TenantCreatedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): TenantCreatedEvent {
    return new TenantCreatedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        code: string;
        name: string;
        adminId: string;
        description?: string;
        domain?: string;
        status: string;
        config: Record<string, any>;
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
   * @returns TenantCreatedEvent
   */
  clone(): TenantCreatedEvent {
    return new TenantCreatedEvent(
      this.aggregateId,
      this.eventData as {
        tenantId: string;
        code: string;
        name: string;
        adminId: string;
        description?: string;
        domain?: string;
        status: string;
        config: Record<string, any>;
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

    if (!this.eventData.code) {
      throw new Error('Tenant code cannot be empty');
    }

    if (!this.eventData.name) {
      throw new Error('Tenant name cannot be empty');
    }

    if (!this.eventData.adminId) {
      throw new Error('Tenant admin ID cannot be empty');
    }

    if (!this.eventData.status) {
      throw new Error('Tenant status cannot be empty');
    }

    if (!this.eventData.config) {
      throw new Error('Tenant config cannot be null or undefined');
    }
  }
}
