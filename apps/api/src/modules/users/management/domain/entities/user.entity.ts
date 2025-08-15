import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregate } from '@/shared/domain/event-sourcing/event-sourced-aggregate';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { Username } from '../value-objects/username';
import { Password } from '../value-objects/password';
import { UserStatus } from '../value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserStatusChangedEvent } from '../events/user-status-changed.event';
import { UserPasswordChangedEvent } from '../events/user-password-changed.event';

/**
 * @class User
 * @description 用户聚合根，管理用户基本信息
 * 
 * 核心职责：
 * 1. 管理用户的基本信息和状态
 * 2. 确保用户数据的完整性和一致性
 * 3. 支持用户信息的更新和状态变更
 * 4. 发布用户相关的领域事件
 * 
 * 业务规则：
 * - 邮箱地址必须全局唯一
 * - 用户名必须全局唯一
 * - 用户只能归属一个租户
 * - 用户状态转换必须符合业务规则
 * - 密码必须符合安全要求
 */
export class User extends EventSourcedAggregate {
  private _id: UserId;
  private _email: Email;
  private _username: Username;
  private _password: Password;
  private _firstName: string;
  private _lastName: string;
  private _nickname?: string;
  private _phoneNumber?: string;
  private _avatar?: string;
  private _bio?: string;
  private _status: UserStatus;
  private _tenantId: TenantId;
  private _primaryOrganizationId?: string;
  private _organizations: string[]; // 用户归属的组织ID列表
  private _roles: string[]; // 用户角色列表
  private _lastLoginAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   */
  private constructor() {
    super();
  }

  /**
   * @method create
   * @description 创建用户的工厂方法
   * @param email 邮箱地址
   * @param username 用户名
   * @param password 密码
   * @param firstName 名
   * @param lastName 姓
   * @param tenantId 租户ID
   * @param primaryOrganizationId 主要组织ID
   * @param nickname 昵称
   * @param phoneNumber 手机号
   * @returns User 新创建的用户实例
   */
  static create(
    email: Email,
    username: Username,
    password: Password,
    firstName: string,
    lastName: string,
    tenantId: TenantId,
    primaryOrganizationId?: string,
    nickname?: string,
    phoneNumber?: string
  ): User {
    const user = new User();
    const userId = new UserId(uuidv4());
    const now = new Date();

    // 设置基本属性
    user._id = userId;
    user._email = email;
    user._username = username;
    user._password = password;
    user._firstName = firstName;
    user._lastName = lastName;
    user._nickname = nickname;
    user._phoneNumber = phoneNumber;
    user._status = UserStatus.PENDING_ACTIVATION;
    user._tenantId = tenantId;
    user._primaryOrganizationId = primaryOrganizationId;
    user._organizations = primaryOrganizationId ? [primaryOrganizationId] : [];
    user._roles = [];
    user._createdAt = now;
    user._updatedAt = now;

    // 发布用户创建事件（在设置完所有属性后）
    user.apply(new UserCreatedEvent(user));

    return user;
  }

  /**
   * @method activate
   * @description 激活用户账号
   */
  activate(): void {
    if (this._status.equals(UserStatus.PENDING_ACTIVATION)) {
      this._status = UserStatus.ACTIVE;
      this._updatedAt = new Date();
      this.apply(new UserStatusChangedEvent(this, UserStatus.ACTIVE));
    }
  }

  /**
   * @method deactivate
   * @description 停用用户账号
   */
  deactivate(): void {
    if (this._status.equals(UserStatus.ACTIVE)) {
      this._status = UserStatus.INACTIVE;
      this._updatedAt = new Date();
      this.apply(new UserStatusChangedEvent(this, UserStatus.INACTIVE));
    }
  }

  /**
   * @method suspend
   * @description 暂停用户账号
   */
  suspend(): void {
    if (this._status.equals(UserStatus.ACTIVE)) {
      this._status = UserStatus.SUSPENDED;
      this._updatedAt = new Date();
      this.apply(new UserStatusChangedEvent(this, UserStatus.SUSPENDED));
    }
  }

  /**
   * @method updateProfile
   * @description 更新用户个人信息
   * @param firstName 名
   * @param lastName 姓
   * @param nickname 昵称
   * @param phoneNumber 手机号
   * @param avatar 头像
   * @param bio 个人简介
   */
  updateProfile(
    firstName?: string,
    lastName?: string,
    nickname?: string,
    phoneNumber?: string,
    avatar?: string,
    bio?: string
  ): void {
    let hasChanges = false;

    if (firstName !== undefined && firstName !== this._firstName) {
      this._firstName = firstName;
      hasChanges = true;
    }

    if (lastName !== undefined && lastName !== this._lastName) {
      this._lastName = lastName;
      hasChanges = true;
    }

    if (nickname !== undefined && nickname !== this._nickname) {
      this._nickname = nickname;
      hasChanges = true;
    }

    if (phoneNumber !== undefined && phoneNumber !== this._phoneNumber) {
      this._phoneNumber = phoneNumber;
      hasChanges = true;
    }

    if (avatar !== undefined && avatar !== this._avatar) {
      this._avatar = avatar;
      hasChanges = true;
    }

    if (bio !== undefined && bio !== this._bio) {
      this._bio = bio;
      hasChanges = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method changePassword
   * @description 修改用户密码
   * @param newPassword 新密码
   */
  changePassword(newPassword: Password): void {
    this._password = newPassword;
    this._updatedAt = new Date();
    this.apply(new UserPasswordChangedEvent(this));
  }

  /**
   * @method updateUsername
   * @description 更新用户名
   * @param newUsername 新用户名
   */
  updateUsername(newUsername: Username): void {
    this._username = newUsername;
    this._updatedAt = new Date();
    this.apply(new UserProfileUpdatedEvent(this));
  }

  /**
   * @method addOrganization
   * @description 添加用户到组织
   * @param organizationId 组织ID
   */
  addOrganization(organizationId: string): void {
    if (!this._organizations.includes(organizationId)) {
      this._organizations.push(organizationId);
      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method removeOrganization
   * @description 从组织移除用户
   * @param organizationId 组织ID
   */
  removeOrganization(organizationId: string): void {
    const index = this._organizations.indexOf(organizationId);
    if (index > -1) {
      this._organizations.splice(index, 1);

      // 如果移除的是主要组织，清空主要组织设置
      if (this._primaryOrganizationId === organizationId) {
        this._primaryOrganizationId = undefined;
      }

      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method setPrimaryOrganization
   * @description 设置主要组织
   * @param organizationId 组织ID
   */
  setPrimaryOrganization(organizationId: string): void {
    if (this._organizations.includes(organizationId)) {
      this._primaryOrganizationId = organizationId;
      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method addRole
   * @description 添加用户角色
   * @param roleId 角色ID
   */
  addRole(roleId: string): void {
    if (!this._roles.includes(roleId)) {
      this._roles.push(roleId);
      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method removeRole
   * @description 移除用户角色
   * @param roleId 角色ID
   */
  removeRole(roleId: string): void {
    const index = this._roles.indexOf(roleId);
    if (index > -1) {
      this._roles.splice(index, 1);
      this._updatedAt = new Date();
      this.apply(new UserProfileUpdatedEvent(this));
    }
  }

  /**
   * @method updateLastLogin
   * @description 更新最后登录时间
   */
  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * @method isActive
   * @description 判断用户是否处于激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this._status.equals(UserStatus.ACTIVE);
  }

  /**
   * @method isPendingActivation
   * @description 判断用户是否处于待激活状态
   * @returns boolean
   */
  isPendingActivation(): boolean {
    return this._status.equals(UserStatus.PENDING_ACTIVATION);
  }

  /**
   * @method isSuspended
   * @description 判断用户是否被暂停
   * @returns boolean
   */
  isSuspended(): boolean {
    return this._status.equals(UserStatus.SUSPENDED);
  }

  /**
   * @method isInactive
   * @description 判断用户是否处于非激活状态
   * @returns boolean
   */
  isInactive(): boolean {
    return this._status.equals(UserStatus.INACTIVE);
  }

  /**
   * @method belongsToOrganization
   * @description 判断用户是否属于指定组织
   * @param organizationId 组织ID
   * @returns boolean
   */
  belongsToOrganization(organizationId: string): boolean {
    return this._organizations.includes(organizationId);
  }

  /**
   * @method hasRole
   * @description 判断用户是否拥有指定角色
   * @param roleId 角色ID
   * @returns boolean
   */
  hasRole(roleId: string): boolean {
    return this._roles.includes(roleId);
  }

  /**
   * @method getFullName
   * @description 获取用户全名
   * @returns string
   */
  getFullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  /**
   * @method getDisplayName
   * @description 获取用户显示名称（优先使用昵称）
   * @returns string
   */
  getDisplayName(): string {
    return this._nickname || this.getFullName();
  }

  // Getters
  get id(): UserId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get username(): Username {
    return this._username;
  }

  get password(): Password {
    return this._password;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get nickname(): string | undefined {
    return this._nickname;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get bio(): string | undefined {
    return this._bio;
  }

  get status(): UserStatus {
    return this._status;
  }

  get tenantId(): TenantId {
    return this._tenantId;
  }

  get primaryOrganizationId(): string | undefined {
    return this._primaryOrganizationId;
  }

  get organizations(): string[] {
    return [...this._organizations];
  }

  get roles(): string[] {
    return [...this._roles];
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
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
    return 'User';
  }

  /**
   * @method handleEvent
   * @description 处理领域事件，实现EventSourcedAggregate抽象方法
   * @param event 领域事件
   */
  protected handleEvent(event: any): void {
    // 用户聚合根的事件处理逻辑
    // 目前用户聚合根不需要特殊的事件处理
  }

  /**
   * @method getSnapshotData
   * @description 获取快照数据，实现EventSourcedAggregate抽象方法
   * @returns Record<string, any>
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      email: this._email.value,
      username: this._username.value,
      passwordHash: this._password.value,
      firstName: this._firstName,
      lastName: this._lastName,
      nickname: this._nickname,
      phoneNumber: this._phoneNumber,
      avatar: this._avatar,
      bio: this._bio,
      status: this._status.value,
      tenantId: this._tenantId.value,
      primaryOrganizationId: this._primaryOrganizationId,
      organizations: [...this._organizations],
      roles: [...this._roles],
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this.version
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载状态，实现EventSourcedAggregate抽象方法
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new UserId(snapshotData.id);
    this._email = Email.create(snapshotData.email);
    this._username = Username.create(snapshotData.username);
    this._password = Password.fromHashed(snapshotData.passwordHash);
    this._firstName = snapshotData.firstName;
    this._lastName = snapshotData.lastName;
    this._nickname = snapshotData.nickname;
    this._phoneNumber = snapshotData.phoneNumber;
    this._avatar = snapshotData.avatar;
    this._bio = snapshotData.bio;
    this._status = UserStatus.create(snapshotData.status);
    this._tenantId = new TenantId(snapshotData.tenantId);
    this._primaryOrganizationId = snapshotData.primaryOrganizationId;
    this._organizations = snapshotData.organizations || [];
    this._roles = snapshotData.roles || [];
    this._lastLoginAt = snapshotData.lastLoginAt;
    this._createdAt = snapshotData.createdAt;
    this._updatedAt = snapshotData.updatedAt;
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照，用于事件溯源优化
   * @returns UserSnapshot
   */
  toSnapshot(): UserSnapshot {
    return {
      id: this._id.value,
      email: this._email.value,
      username: this._username.value,
      password: this._password.value,
      firstName: this._firstName,
      lastName: this._lastName,
      nickname: this._nickname,
      phoneNumber: this._phoneNumber,
      avatar: this._avatar,
      bio: this._bio,
      status: this._status.value,
      tenantId: this._tenantId.value,
      primaryOrganizationId: this._primaryOrganizationId,
      organizations: [...this._organizations],
      roles: [...this._roles],
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根状态
   * @param snapshot 用户快照
   * @returns User
   */
  static fromSnapshot(snapshot: UserSnapshot): User {
    const user = new User();

    user._id = new UserId(snapshot.id);
    user._email = Email.create(snapshot.email);
    user._username = Username.create(snapshot.username);
    user._password = Password.fromHashed(snapshot.password);
    user._firstName = snapshot.firstName;
    user._lastName = snapshot.lastName;
    user._nickname = snapshot.nickname;
    user._phoneNumber = snapshot.phoneNumber;
    user._avatar = snapshot.avatar;
    user._bio = snapshot.bio;
    user._status = UserStatus.create(snapshot.status);
    user._tenantId = new TenantId(snapshot.tenantId);
    user._primaryOrganizationId = snapshot.primaryOrganizationId;
    user._organizations = [...snapshot.organizations];
    user._roles = [...snapshot.roles];
    user._lastLoginAt = snapshot.lastLoginAt;
    user._createdAt = snapshot.createdAt;
    user._updatedAt = snapshot.updatedAt;

    return user;
  }
}

/**
 * @interface UserSnapshot
 * @description 用户快照接口，用于事件溯源优化
 */
export interface UserSnapshot {
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  status: string;
  tenantId: string;
  primaryOrganizationId?: string;
  organizations: string[];
  roles: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
