import { EventSourcedAggregate } from '../entities/event-sourced-aggregate';
import { DomainEvent } from '../events/base.event';
import { StringValueObject } from '../value-objects/base.value-object';
import { ValidationException, BusinessRuleException } from '../exceptions/domain.exception';

/**
 * @class TenantName
 * @description
 * 租户名称值对象
 */
export class TenantName extends StringValueObject {
  protected validate(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('租户名称不能为空', 'name', value);
    }

    if (value.length > 100) {
      throw new ValidationException('租户名称长度不能超过100个字符', 'name', value);
    }

    return value.trim();
  }
}

/**
 * @class TenantCode
 * @description
 * 租户代码值对象
 */
export class TenantCode extends StringValueObject {
  protected validate(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('租户代码不能为空', 'code', value);
    }

    if (!/^[A-Za-z0-9_-]{3,20}$/.test(value)) {
      throw new ValidationException('租户代码格式不正确，只能包含字母、数字、下划线和连字符，长度3-20位', 'code', value);
    }

    return value.toUpperCase().trim();
  }
}

/**
 * @enum TenantStatus
 * @description
 * 租户状态枚举
 */
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * @class TenantCreatedEvent
 * @description
 * 租户创建事件
 */
export class TenantCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly status: TenantStatus
  ) {
    super(aggregateId, 'Tenant', 0);
  }

  protected serializeEventData(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
    };
  }

  protected deserializeEventData(json: Record<string, any>): void {
    // 事件数据在构造函数中已经设置，这里不需要反序列化
  }
}

/**
 * @class TenantRenamedEvent
 * @description
 * 租户重命名事件
 */
export class TenantRenamedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly oldName: string,
    public readonly newName: string
  ) {
    super(aggregateId, 'Tenant', 0);
  }

  protected serializeEventData(): Record<string, any> {
    return {
      oldName: this.oldName,
      newName: this.newName,
    };
  }

  protected deserializeEventData(json: Record<string, any>): void {
    // 事件数据在构造函数中已经设置，这里不需要反序列化
  }
}

/**
 * @class TenantStatusChangedEvent
 * @description
 * 租户状态变更事件
 */
export class TenantStatusChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly oldStatus: TenantStatus,
    public readonly newStatus: TenantStatus,
    public readonly reason?: string
  ) {
    super(aggregateId, 'Tenant', 0);
  }

  protected serializeEventData(): Record<string, any> {
    return {
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      reason: this.reason,
    };
  }

  protected deserializeEventData(json: Record<string, any>): void {
    // 事件数据在构造函数中已经设置，这里不需要反序列化
  }
}

/**
 * @class Tenant
 * @description
 * 租户聚合根示例，演示如何使用事件溯源
 * 
 * 主要功能：
 * 1. 租户的创建和管理
 * 2. 租户名称的修改
 * 3. 租户状态的变更
 * 4. 业务规则验证
 * 
 * 使用示例：
 * ```typescript
 * // 创建租户
 * const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
 * 
 * // 重命名租户
 * tenant.rename('Acme Corporation');
 * 
 * // 变更状态
 * tenant.changeStatus(TenantStatus.SUSPENDED, '违反服务条款');
 * 
 * // 获取未提交的事件
 * const events = tenant.uncommittedEvents;
 * ```
 */
export class Tenant extends EventSourcedAggregate {
  private _name: TenantName;
  private _code: TenantCode;
  private _status: TenantStatus;
  private _description?: string;

  /**
   * 构造函数
   * 
   * @param id 租户ID
   * @param name 租户名称
   * @param code 租户代码
   * @param description 租户描述（可选）
   */
  constructor(id: string, name: string, code: string, description?: string) {
    super(id);

    // 验证输入参数
    const tenantName = new TenantName(name);
    const tenantCode = new TenantCode(code);

    // 应用创建事件
    this.applyEvent(new TenantCreatedEvent(
      id,
      tenantName.value,
      tenantCode.value,
      TenantStatus.ACTIVE
    ));

    // 设置描述
    if (description) {
      this._description = description;
    }
  }

  /**
   * 获取租户名称
   */
  get name(): string {
    return this._name.value;
  }

  /**
   * 获取租户代码
   */
  get code(): string {
    return this._code.value;
  }

  /**
   * 获取租户状态
   */
  get status(): TenantStatus {
    return this._status;
  }

  /**
   * 获取租户描述
   */
  get description(): string | undefined {
    return this._description;
  }

  /**
   * 重命名租户
   * 
   * @param newName 新名称
   */
  rename(newName: string): void {
    // 验证业务规则
    if (this._status === TenantStatus.DELETED) {
      throw new BusinessRuleException(
        '已删除的租户不能重命名',
        'TENANT_DELETED_CANNOT_RENAME',
        { tenantId: this.id, currentStatus: this._status }
      );
    }

    const oldName = this._name.value;
    const tenantName = new TenantName(newName);

    // 应用重命名事件
    this.applyEvent(new TenantRenamedEvent(
      this.id,
      oldName,
      tenantName.value
    ));
  }

  /**
   * 变更租户状态
   * 
   * @param newStatus 新状态
   * @param reason 变更原因（可选）
   */
  changeStatus(newStatus: TenantStatus, reason?: string): void {
    // 验证状态转换的合法性
    this.validateStatusTransition(newStatus);

    const oldStatus = this._status;

    // 应用状态变更事件
    this.applyEvent(new TenantStatusChangedEvent(
      this.id,
      oldStatus,
      newStatus,
      reason
    ));
  }

  /**
   * 验证状态转换的合法性
   * 
   * @param newStatus 新状态
   */
  private validateStatusTransition(newStatus: TenantStatus): void {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.ACTIVE]: [TenantStatus.INACTIVE, TenantStatus.SUSPENDED, TenantStatus.DELETED],
      [TenantStatus.INACTIVE]: [TenantStatus.ACTIVE, TenantStatus.DELETED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.DELETED],
      [TenantStatus.DELETED]: [], // 删除状态不能转换到其他状态
    };

    const allowedTransitions = validTransitions[this._status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BusinessRuleException(
        `不允许从状态 '${this._status}' 转换到状态 '${newStatus}'`,
        'INVALID_STATUS_TRANSITION',
        {
          currentStatus: this._status,
          newStatus,
          allowedTransitions,
        }
      );
    }
  }

  /**
   * 更新租户描述
   * 
   * @param description 新描述
   */
  updateDescription(description: string): void {
    if (this._status === TenantStatus.DELETED) {
      throw new BusinessRuleException(
        '已删除的租户不能更新描述',
        'TENANT_DELETED_CANNOT_UPDATE',
        { tenantId: this.id, currentStatus: this._status }
      );
    }

    this._description = description;
  }

  /**
   * 检查租户是否处于活跃状态
   */
  isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  /**
   * 检查租户是否已被删除
   */
  isDeleted(): boolean {
    return this._status === TenantStatus.DELETED;
  }

  // 事件处理器方法

  /**
   * 处理租户创建事件
   */
  private onTenantCreated(event: TenantCreatedEvent): void {
    this._name = new TenantName(event.name);
    this._code = new TenantCode(event.code);
    this._status = event.status;
  }

  /**
   * 处理租户重命名事件
   */
  private onTenantRenamed(event: TenantRenamedEvent): void {
    this._name = new TenantName(event.newName);
  }

  /**
   * 处理租户状态变更事件
   */
  private onTenantStatusChanged(event: TenantStatusChangedEvent): void {
    this._status = event.newStatus;
  }

  /**
   * 清空聚合根状态
   */
  protected clearState(): void {
    this._name = new TenantName('');
    this._code = new TenantCode('');
    this._status = TenantStatus.ACTIVE;
    this._description = undefined;
  }

  /**
   * 获取聚合根的快照
   */
  toSnapshot(): Record<string, any> {
    const baseSnapshot = super.toSnapshot();
    return {
      ...baseSnapshot,
      name: this._name.value,
      code: this._code.value,
      status: this._status,
      description: this._description,
    };
  }

  /**
   * 从快照恢复聚合根状态
   */
  fromSnapshot(snapshot: Record<string, any>): void {
    super.fromSnapshot(snapshot);
    
    if (snapshot.name) {
      this._name = new TenantName(snapshot.name);
    }
    if (snapshot.code) {
      this._code = new TenantCode(snapshot.code);
    }
    if (snapshot.status) {
      this._status = snapshot.status;
    }
    if (snapshot.description !== undefined) {
      this._description = snapshot.description;
    }
  }
}
