import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregate, DomainEvent } from '../../../../../shared/domain/event-sourcing/event-sourced-aggregate';
import { TenantId } from '../value-objects/tenant-id';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { TenantStatus, TenantStatusEnum } from '../value-objects/tenant-status';
import { UserId } from '../../../../users/management/domain/value-objects/user-id';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantRenamedEvent } from '../events/tenant-renamed.event';
import { TenantStatusChangedEvent } from '../events/tenant-status-changed.event';
import { TenantAdminChangedEvent } from '../events/tenant-admin-changed.event';

/**
 * @class Tenant
 * @description 租户聚合根，代表系统中的租户组织
 * 
 * 核心职责：
 * 1. 管理租户的基本信息（代码、名称、状态等）
 * 2. 确保租户业务规则的一致性
 * 3. 发布租户相关的领域事件
 * 4. 支持事件溯源和状态重建
 * 
 * 业务规则：
 * - 租户代码必须全局唯一
 * - 租户名称必须全局唯一
 * - 每个租户有且只能有一个管理员
 * - 默认系统租户不能被删除或停用
 * - 所有状态变更都通过事件记录
 */
export class Tenant extends EventSourcedAggregate {
  private _id: TenantId;
  private _code: TenantCode;
  private _name: TenantName;
  private _domain?: string;
  private _status: TenantStatus;
  private _adminId: UserId;
  private _description?: string;
  private _config: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;

  /**
   * @constructor
   * @description 构造函数，支持直接实例化（主要用于事件溯源）
   */
  constructor() {
    super();
  }

  /**
   * @method create
   * @description 创建新租户的工厂方法
   * @param code 租户代码
   * @param name 租户名称
   * @param adminId 租户管理员ID
   * @param description 租户描述
   * @param domain 租户域名
   * @returns Tenant 新创建的租户实例
   */
  static create(
    code: TenantCode,
    name: TenantName,
    adminId: UserId,
    description?: string,
    domain?: string
  ): Tenant {
    const tenant = new Tenant();
    const tenantId = new TenantId(uuidv4());
    const now = new Date();

    // 设置基本属性
    tenant._id = tenantId;
    tenant._code = code;
    tenant._name = name;
    tenant._adminId = adminId;
    tenant._description = description;
    tenant._domain = domain;
    tenant._status = TenantStatus.ACTIVE;
    tenant._config = {};
    tenant._createdAt = now;
    tenant._updatedAt = now;

    // 发布租户创建事件
    tenant.apply(new TenantCreatedEvent(
      tenant._id.value,
      {
        tenantId: tenant._id.value,
        code: tenant._code.value,
        name: tenant._name.value,
        adminId: tenant._adminId.value,
        description: tenant._description,
        domain: tenant._domain,
        status: tenant._status.value,
        config: tenant._config
      }
    ));

    return tenant;
  }

  /**
   * @method rename
   * @description 重命名租户
   * @param newName 新的租户名称
   * @param renamedBy 重命名操作人ID
   */
  rename(newName: TenantName, renamedBy: string): void {
    if (this._name.equals(newName)) {
      return; // 名称没有变化，不需要处理
    }

    const oldName = this._name.value;
    this._name = newName;
    this._updatedAt = new Date();

    // 发布租户重命名事件
    this.apply(new TenantRenamedEvent(
      this._id.value,
      {
        tenantId: this._id.value,
        oldName: oldName,
        newName: newName.value,
        renamedAt: this._updatedAt.toISOString(),
        renamedBy: renamedBy
      }
    ));
  }

  /**
   * @method changeStatus
   * @description 更改租户状态
   * @param newStatus 新的租户状态
   * @param changedBy 变更操作人ID
   * @param reason 变更原因（可选）
   */
  changeStatus(newStatus: TenantStatus, changedBy: string, reason?: string): void {
    // 业务规则：默认系统租户不能被停用
    if (this.isSystemTenant() && newStatus.equals(TenantStatus.INACTIVE)) {
      throw new Error('System tenant cannot be deactivated');
    }

    if (this._status.equals(newStatus)) {
      return; // 状态没有变化，不需要处理
    }

    const oldStatus = this._status.value;
    this._status = newStatus;
    this._updatedAt = new Date();

    // 发布租户状态变更事件
    this.apply(new TenantStatusChangedEvent(
      this._id.value,
      {
        tenantId: this._id.value,
        oldStatus: oldStatus,
        newStatus: newStatus.value,
        changedAt: this._updatedAt.toISOString(),
        changedBy: changedBy,
        reason: reason
      }
    ));
  }

  /**
   * @method changeAdmin
   * @description 更换租户管理员
   * @param newAdminId 新的管理员ID
   * @param changedBy 变更操作人ID
   * @param reason 变更原因（可选）
   */
  changeAdmin(newAdminId: UserId, changedBy: string, reason?: string): void {
    if (this._adminId.equals(newAdminId)) {
      return; // 管理员没有变化，不需要处理
    }

    const oldAdminId = this._adminId.value;
    this._adminId = newAdminId;
    this._updatedAt = new Date();

    // 发布租户管理员变更事件
    this.apply(new TenantAdminChangedEvent(
      this._id.value,
      {
        tenantId: this._id.value,
        oldAdminId: oldAdminId,
        newAdminId: newAdminId.value,
        changedAt: this._updatedAt.toISOString(),
        changedBy: changedBy,
        reason: reason
      }
    ));
  }

  /**
   * @method updateDomain
   * @description 更新租户域名
   * @param domain 新的域名
   */
  updateDomain(domain?: string): void {
    if (domain) {
      this.validateDomain(domain);
    }
    this._domain = domain;
    this._updatedAt = new Date();
  }

  /**
   * @method validateDomain
   * @description 验证域名格式
   * @param domain 域名
   * @throws Error 当域名格式无效时
   */
  private validateDomain(domain: string): void {
    // 域名长度：3-63个字符
    if (domain.length < 3 || domain.length > 63) {
      throw new Error('Domain length must be between 3 and 63 characters');
    }

    // 只能包含字母、数字、连字符
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!domainRegex.test(domain)) {
      throw new Error('Domain can only contain letters, numbers, and hyphens');
    }

    // 不能以连字符开头或结尾
    if (domain.startsWith('-') || domain.endsWith('-')) {
      throw new Error('Domain cannot start or end with a hyphen');
    }

    // 不能包含连续连字符
    if (domain.includes('--')) {
      throw new Error('Domain cannot contain consecutive hyphens');
    }
  }

  /**
   * @method updateDescription
   * @description 更新租户描述
   * @param description 新的描述
   */
  updateDescription(description?: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * @method updateConfig
   * @description 更新租户配置
   * @param config 新的配置
   */
  updateConfig(config: Record<string, any>): void {
    this._config = { ...this._config, ...config };
    this._updatedAt = new Date();
  }

  /**
   * @method setConfigValue
   * @description 设置租户配置项
   * @param key 配置键
   * @param value 配置值
   */
  setConfigValue(key: string, value: any): void {
    this._config[key] = value;
    this._updatedAt = new Date();
  }

  /**
   * @method getConfigValue
   * @description 获取租户配置项
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getConfigValue<T>(key: string, defaultValue?: T): T | undefined {
    return this._config[key] !== undefined ? this._config[key] : defaultValue;
  }

  /**
   * @method isSystemTenant
   * @description 判断是否为系统租户
   * @returns boolean
   */
  isSystemTenant(): boolean {
    return this._code.value === 'SYSTEM';
  }

  /**
   * @method isActive
   * @description 判断租户是否处于激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this._status.equals(TenantStatus.ACTIVE);
  }

  /**
   * @method canBeDeleted
   * @description 判断租户是否可以被删除
   * @returns boolean
   */
  canBeDeleted(): boolean {
    return !this.isSystemTenant();
  }

  /**
   * @method handleEvent
   * @description 处理领域事件，实现事件溯源
   * @param event 领域事件
   */
  protected handleEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'TenantCreated':
        this.handleTenantCreatedEvent(event);
        break;
      case 'TenantRenamed':
        this.handleTenantRenamedEvent(event);
        break;
      case 'TenantStatusChanged':
        this.handleTenantStatusChangedEvent(event);
        break;
      case 'TenantAdminChanged':
        this.handleTenantAdminChangedEvent(event);
        break;
      default:
        // 忽略未知事件类型
        break;
    }
  }

  /**
   * @method handleTenantCreatedEvent
   * @description 处理租户创建事件
   * @param event 租户创建事件
   */
  private handleTenantCreatedEvent(event: DomainEvent): void {
    // 租户创建事件在create方法中已经处理了状态设置
    // 这里主要用于事件重放时的状态重建
    if (this.isReplaying) {
      const data = event.eventData;
      this._id = new TenantId(data.tenantId);
      this._code = new TenantCode(data.code);
      this._name = new TenantName(data.name);
      this._adminId = new UserId(data.adminId);
      this._description = data.description;
      this._domain = data.domain;
      this._status = new TenantStatus(data.status);
      this._config = data.config;
      this._createdAt = new Date(event.occurredOn);
      this._updatedAt = new Date(event.occurredOn);
    }
  }

  /**
   * @method handleTenantRenamedEvent
   * @description 处理租户重命名事件
   * @param event 租户重命名事件
   */
  private handleTenantRenamedEvent(event: DomainEvent): void {
    if (this.isReplaying) {
      const data = event.eventData;
      this._name = new TenantName(data.newName);
      this._updatedAt = new Date(data.renamedAt);
    }
  }

  /**
   * @method handleTenantStatusChangedEvent
   * @description 处理租户状态变更事件
   * @param event 租户状态变更事件
   */
  private handleTenantStatusChangedEvent(event: DomainEvent): void {
    if (this.isReplaying) {
      const data = event.eventData;
      this._status = new TenantStatus(data.newStatus);
      this._updatedAt = new Date(data.changedAt);
    }
  }

  /**
   * @method handleTenantAdminChangedEvent
   * @description 处理租户管理员变更事件
   * @param event 租户管理员变更事件
   */
  private handleTenantAdminChangedEvent(event: DomainEvent): void {
    if (this.isReplaying) {
      const data = event.eventData;
      this._adminId = new UserId(data.newAdminId);
      this._updatedAt = new Date(data.changedAt);
    }
  }

  // Getters
  get id(): TenantId {
    return this._id;
  }

  get code(): TenantCode {
    return this._code;
  }

  get name(): TenantName {
    return this._name;
  }

  get domain(): string | undefined {
    return this._domain;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get adminId(): UserId {
    return this._adminId;
  }

  get description(): string | undefined {
    return this._description;
  }

  get config(): Record<string, any> {
    return { ...this._config };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID，用于事件溯源
   * @returns string
   */
  getAggregateId(): string {
    return this._id.value;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型，用于事件溯源
   * @returns string
   */
  getAggregateType(): string {
    return 'Tenant';
  }

  /**
   * @method getSnapshotData
   * @description 获取聚合根快照数据，用于事件溯源优化
   * @returns Record<string, any>
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      code: this._code.value,
      name: this._name.value,
      domain: this._domain,
      status: this._status.value,
      adminId: this._adminId.value,
      description: this._description,
      config: this._config,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载聚合根状态
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new TenantId(snapshotData.id);
    this._code = new TenantCode(snapshotData.code);
    this._name = new TenantName(snapshotData.name);
    this._domain = snapshotData.domain;
    this._status = new TenantStatus(snapshotData.status);
    this._adminId = new UserId(snapshotData.adminId);
    this._description = snapshotData.description;
    this._config = snapshotData.config;
    this._createdAt = new Date(snapshotData.createdAt);
    this._updatedAt = new Date(snapshotData.updatedAt);
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照，用于事件溯源优化
   * @returns TenantSnapshot
   */
  toSnapshot(): TenantSnapshot {
    return {
      id: this._id.value,
      code: this._code.value,
      name: this._name.value,
      domain: this._domain,
      status: this._status.value,
      adminId: this._adminId.value,
      description: this._description,
      config: this._config,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根状态
   * @param snapshot 租户快照
   * @returns Tenant
   */
  static fromSnapshot(snapshot: TenantSnapshot): Tenant {
    const tenant = new Tenant();

    tenant._id = new TenantId(snapshot.id);
    tenant._code = new TenantCode(snapshot.code);
    tenant._name = new TenantName(snapshot.name);
    tenant._domain = snapshot.domain;
    tenant._status = new TenantStatus(snapshot.status as TenantStatusEnum);
    tenant._adminId = new UserId(snapshot.adminId);
    tenant._description = snapshot.description;
    tenant._config = snapshot.config;
    tenant._createdAt = snapshot.createdAt;
    tenant._updatedAt = snapshot.updatedAt;

    return tenant;
  }
}

/**
 * @interface TenantSnapshot
 * @description 租户快照接口，用于事件溯源优化
 */
export interface TenantSnapshot {
  id: string;
  code: string;
  name: string;
  domain?: string;
  status: string;
  adminId: string;
  description?: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
