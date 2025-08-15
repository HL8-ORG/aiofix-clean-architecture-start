/**
 * @class UserStatus
 * @description 用户状态值对象
 * 
 * 用户状态枚举：
 * - PENDING_ACTIVATION: 待激活
 * - ACTIVE: 激活
 * - INACTIVE: 非激活
 * - SUSPENDED: 暂停
 * - DELETED: 已删除
 * 
 * 状态转换规则：
 * - PENDING_ACTIVATION -> ACTIVE (激活)
 * - ACTIVE -> INACTIVE/SUSPENDED (停用/暂停)
 * - INACTIVE/SUSPENDED -> ACTIVE (重新激活)
 * - 任何状态 -> DELETED (删除)
 * - DELETED 为终态，不能转换
 */
export class UserStatus {
  private readonly _value: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 用户状态值
   */
  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * @method create
   * @description 创建用户状态的工厂方法
   * @param value 用户状态值
   * @returns UserStatus
   */
  static create(value: string): UserStatus {
    return new UserStatus(value);
  }

  /**
   * @method validate
   * @description 验证用户状态的有效性
   * @param value 用户状态值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
    const validStatuses = ['PENDING_ACTIVATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'];
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid user status: ${value}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个用户状态是否相等
   * @param other 另一个用户状态
   * @returns boolean
   */
  equals(other: UserStatus): boolean {
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
   * @description 获取用户状态值
   * @returns string
   */
  get value(): string {
    return this._value;
  }

  /**
   * @method isPendingActivation
   * @description 判断是否为待激活状态
   * @returns boolean
   */
  isPendingActivation(): boolean {
    return this._value === 'PENDING_ACTIVATION';
  }

  /**
   * @method isActive
   * @description 判断是否为激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this._value === 'ACTIVE';
  }

  /**
   * @method isInactive
   * @description 判断是否为非激活状态
   * @returns boolean
   */
  isInactive(): boolean {
    return this._value === 'INACTIVE';
  }

  /**
   * @method isSuspended
   * @description 判断是否为暂停状态
   * @returns boolean
   */
  isSuspended(): boolean {
    return this._value === 'SUSPENDED';
  }

  /**
   * @method isDeleted
   * @description 判断是否为已删除状态
   * @returns boolean
   */
  isDeleted(): boolean {
    return this._value === 'DELETED';
  }

  /**
   * @method isFinal
   * @description 判断是否为终态（不可再转换）
   * @returns boolean
   */
  isFinal(): boolean {
    return this._value === 'DELETED';
  }

  /**
   * @method canLogin
   * @description 判断用户是否可以登录
   * @returns boolean
   */
  canLogin(): boolean {
    return this._value === 'ACTIVE';
  }

  /**
   * @method canTransitionTo
   * @description 判断是否可以转换到指定状态
   * @param targetStatus 目标状态
   * @returns boolean
   */
  canTransitionTo(targetStatus: UserStatus): boolean {
    if (this.isFinal()) {
      return false;
    }

    if (targetStatus.isDeleted()) {
      return true; // 任何非终态都可以删除
    }

    switch (this._value) {
      case 'PENDING_ACTIVATION':
        return targetStatus.isActive();

      case 'ACTIVE':
        return targetStatus.isInactive() || targetStatus.isSuspended();

      case 'INACTIVE':
      case 'SUSPENDED':
        return targetStatus.isActive();

      default:
        return false;
    }
  }

  /**
   * @method getDisplayName
   * @description 获取状态的显示名称
   * @returns string
   */
  getDisplayName(): string {
    const displayNames = {
      'PENDING_ACTIVATION': '待激活',
      'ACTIVE': '激活',
      'INACTIVE': '非激活',
      'SUSPENDED': '暂停',
      'DELETED': '已删除'
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
      'PENDING_ACTIVATION': '用户已注册但尚未激活，需要激活后才能使用系统',
      'ACTIVE': '用户已激活，可以正常使用系统',
      'INACTIVE': '用户已被停用，无法登录系统',
      'SUSPENDED': '用户已被暂停，暂时无法使用系统',
      'DELETED': '用户已被删除，数据不可恢复'
    };
    return descriptions[this._value] || '';
  }

  // 静态常量
  static PENDING_ACTIVATION = new UserStatus('PENDING_ACTIVATION');
  static ACTIVE = new UserStatus('ACTIVE');
  static INACTIVE = new UserStatus('INACTIVE');
  static SUSPENDED = new UserStatus('SUSPENDED');
  static DELETED = new UserStatus('DELETED');
}
