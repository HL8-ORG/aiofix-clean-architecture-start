/**
 * @enum TenantStatusEnum
 * @description 租户状态枚举
 */
export enum TenantStatusEnum {
  ACTIVE = 'ACTIVE',           // 激活状态
  INACTIVE = 'INACTIVE',       // 停用状态
  SUSPENDED = 'SUSPENDED',     // 暂停状态
  PENDING = 'PENDING',         // 待审核状态
  DELETED = 'DELETED'          // 已删除状态
}

/**
 * @class TenantStatus
 * @description 租户状态值对象
 * 
 * 业务规则：
 * - 状态值必须是预定义的枚举值
 * - 状态转换有特定的业务规则
 * - 系统租户不能被设置为INACTIVE或DELETED状态
 */
export class TenantStatus {
  private readonly _value: TenantStatusEnum;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 租户状态值
   */
  constructor(value: TenantStatusEnum) {
    this.validate(value);
    this._value = value;
  }

  /**
   * @method create
   * @description 创建租户状态的工厂方法
   * @param value 租户状态值
   * @returns TenantStatus
   */
  static create(value: TenantStatusEnum): TenantStatus {
    return new TenantStatus(value);
  }

  /**
   * @method validate
   * @description 验证租户状态的有效性
   * @param value 租户状态值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: TenantStatusEnum): void {
    if (!Object.values(TenantStatusEnum).includes(value)) {
      throw new Error(`Invalid tenant status: ${value}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个租户状态是否相等
   * @param other 另一个租户状态
   * @returns boolean
   */
  equals(other: TenantStatus): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * @method toString
   * @description 转换为字符串
   * @returns string
   */
  toString(): string {
    return this._value;
  }

  /**
   * @method value
   * @description 获取租户状态值
   * @returns TenantStatusEnum
   */
  get value(): TenantStatusEnum {
    return this._value;
  }

  /**
   * @method isActive
   * @description 判断是否为激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this._value === TenantStatusEnum.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 判断是否为停用状态
   * @returns boolean
   */
  isInactive(): boolean {
    return this._value === TenantStatusEnum.INACTIVE;
  }

  /**
   * @method isSuspended
   * @description 判断是否为暂停状态
   * @returns boolean
   */
  isSuspended(): boolean {
    return this._value === TenantStatusEnum.SUSPENDED;
  }

  /**
   * @method isPending
   * @description 判断是否为待审核状态
   * @returns boolean
   */
  isPending(): boolean {
    return this._value === TenantStatusEnum.PENDING;
  }

  /**
   * @method isDeleted
   * @description 判断是否为已删除状态
   * @returns boolean
   */
  isDeleted(): boolean {
    return this._value === TenantStatusEnum.DELETED;
  }

  /**
   * @method canBeActivated
   * @description 判断是否可以激活
   * @returns boolean
   */
  canBeActivated(): boolean {
    return this._value === TenantStatusEnum.INACTIVE ||
      this._value === TenantStatusEnum.SUSPENDED ||
      this._value === TenantStatusEnum.PENDING;
  }

  /**
   * @method canBeDeactivated
   * @description 判断是否可以停用
   * @returns boolean
   */
  canBeDeactivated(): boolean {
    return this._value === TenantStatusEnum.ACTIVE ||
      this._value === TenantStatusEnum.SUSPENDED;
  }

  /**
   * @method canBeSuspended
   * @description 判断是否可以暂停
   * @returns boolean
   */
  canBeSuspended(): boolean {
    return this._value === TenantStatusEnum.ACTIVE;
  }

  /**
   * @method canBeDeleted
   * @description 判断是否可以删除
   * @returns boolean
   */
  canBeDeleted(): boolean {
    return this._value === TenantStatusEnum.INACTIVE ||
      this._value === TenantStatusEnum.SUSPENDED;
  }

  /**
   * @method getDisplayName
   * @description 获取状态的显示名称
   * @returns string
   */
  getDisplayName(): string {
    const displayNames = {
      [TenantStatusEnum.ACTIVE]: '激活',
      [TenantStatusEnum.INACTIVE]: '停用',
      [TenantStatusEnum.SUSPENDED]: '暂停',
      [TenantStatusEnum.PENDING]: '待审核',
      [TenantStatusEnum.DELETED]: '已删除'
    };
    return displayNames[this._value] || this._value;
  }

  /**
   * @method getDescription
   * @description 获取状态的描述
   * @returns string
   */
  getDescription(): string {
    const descriptions = {
      [TenantStatusEnum.ACTIVE]: '租户处于正常使用状态',
      [TenantStatusEnum.INACTIVE]: '租户已被停用，无法使用',
      [TenantStatusEnum.SUSPENDED]: '租户被临时暂停，等待恢复',
      [TenantStatusEnum.PENDING]: '租户申请待审核',
      [TenantStatusEnum.DELETED]: '租户已被删除'
    };
    return descriptions[this._value] || '';
  }

  // 静态工厂方法
  static ACTIVE = new TenantStatus(TenantStatusEnum.ACTIVE);
  static INACTIVE = new TenantStatus(TenantStatusEnum.INACTIVE);
  static SUSPENDED = new TenantStatus(TenantStatusEnum.SUSPENDED);
  static PENDING = new TenantStatus(TenantStatusEnum.PENDING);
  static DELETED = new TenantStatus(TenantStatusEnum.DELETED);
}
