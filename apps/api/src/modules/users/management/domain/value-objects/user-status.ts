import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

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
 * 
 * 主要原理与机制如下：
 * 1. 继承EnumValueObject基类，获得枚举值对象的通用功能
 * 2. 实现getValidValues方法，提供有效的状态值列表
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class UserStatus extends EnumValueObject<string> {

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
   * @protected getValidValues
   * @description 获取有效的状态值列表
   * @returns 有效的状态值数组
   */
  protected getValidValues(): string[] {
    return ['PENDING_ACTIVATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'];
  }

  /**
   * @method isPendingActivation
   * @description 判断是否为待激活状态
   * @returns boolean
   */
  isPendingActivation(): boolean {
    return this.value === 'PENDING_ACTIVATION';
  }

  /**
   * @method isActive
   * @description 判断是否为激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this.value === 'ACTIVE';
  }

  /**
   * @method isInactive
   * @description 判断是否为非激活状态
   * @returns boolean
   */
  isInactive(): boolean {
    return this.value === 'INACTIVE';
  }

  /**
   * @method isSuspended
   * @description 判断是否为暂停状态
   * @returns boolean
   */
  isSuspended(): boolean {
    return this.value === 'SUSPENDED';
  }

  /**
   * @method isDeleted
   * @description 判断是否为已删除状态
   * @returns boolean
   */
  isDeleted(): boolean {
    return this.value === 'DELETED';
  }

  /**
   * @method isFinal
   * @description 判断是否为终态（不可再转换）
   * @returns boolean
   */
  isFinal(): boolean {
    return this.value === 'DELETED';
  }

  /**
   * @method canLogin
   * @description 判断用户是否可以登录
   * @returns boolean
   */
  canLogin(): boolean {
    return this.value === 'ACTIVE';
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

    switch (this.value) {
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
    return displayNames[this.value] || this.value;
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
    return descriptions[this.value] || '';
  }

  // 静态常量
  static PENDING_ACTIVATION = new UserStatus('PENDING_ACTIVATION');
  static ACTIVE = new UserStatus('ACTIVE');
  static INACTIVE = new UserStatus('INACTIVE');
  static SUSPENDED = new UserStatus('SUSPENDED');
  static DELETED = new UserStatus('DELETED');
}
