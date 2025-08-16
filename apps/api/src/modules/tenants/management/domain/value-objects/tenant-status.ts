import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

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
 * 
 * 主要原理与机制如下：
 * 1. 继承EnumValueObject基类，获得枚举值对象的通用功能
 * 2. 实现getValidValues方法，提供有效的枚举值列表
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class TenantStatus extends EnumValueObject<TenantStatusEnum> {

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
   * @protected getValidValues
   * @description 获取有效的枚举值列表
   * @returns 有效的枚举值数组
   */
  protected getValidValues(): TenantStatusEnum[] {
    return Object.values(TenantStatusEnum);
  }

  /**
   * @method isActive
   * @description 判断是否为激活状态
   * @returns boolean
   */
  isActive(): boolean {
    return this.value === TenantStatusEnum.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 判断是否为停用状态
   * @returns boolean
   */
  isInactive(): boolean {
    return this.value === TenantStatusEnum.INACTIVE;
  }

  /**
   * @method isSuspended
   * @description 判断是否为暂停状态
   * @returns boolean
   */
  isSuspended(): boolean {
    return this.value === TenantStatusEnum.SUSPENDED;
  }

  /**
   * @method isPending
   * @description 判断是否为待审核状态
   * @returns boolean
   */
  isPending(): boolean {
    return this.value === TenantStatusEnum.PENDING;
  }

  /**
   * @method isDeleted
   * @description 判断是否为已删除状态
   * @returns boolean
   */
  isDeleted(): boolean {
    return this.value === TenantStatusEnum.DELETED;
  }

  /**
   * @method canBeActivated
   * @description 判断是否可以激活
   * @returns boolean
   */
  canBeActivated(): boolean {
    return this.value === TenantStatusEnum.INACTIVE ||
      this.value === TenantStatusEnum.SUSPENDED ||
      this.value === TenantStatusEnum.PENDING;
  }

  /**
   * @method canBeDeactivated
   * @description 判断是否可以停用
   * @returns boolean
   */
  canBeDeactivated(): boolean {
    return this.value === TenantStatusEnum.ACTIVE ||
      this.value === TenantStatusEnum.SUSPENDED;
  }

  /**
   * @method canBeSuspended
   * @description 判断是否可以暂停
   * @returns boolean
   */
  canBeSuspended(): boolean {
    return this.value === TenantStatusEnum.ACTIVE;
  }

  /**
   * @method canBeDeleted
   * @description 判断是否可以删除
   * @returns boolean
   */
  canBeDeleted(): boolean {
    return this.value === TenantStatusEnum.INACTIVE ||
      this.value === TenantStatusEnum.SUSPENDED;
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
    return displayNames[this.value] || this.value;
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
    return descriptions[this.value] || '';
  }

  // 静态工厂方法
  static ACTIVE = new TenantStatus(TenantStatusEnum.ACTIVE);
  static INACTIVE = new TenantStatus(TenantStatusEnum.INACTIVE);
  static SUSPENDED = new TenantStatus(TenantStatusEnum.SUSPENDED);
  static PENDING = new TenantStatus(TenantStatusEnum.PENDING);
  static DELETED = new TenantStatus(TenantStatusEnum.DELETED);
}
