import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class ApplicationStatus
 * @description 申请状态值对象
 * 
 * 申请状态枚举：
 * - PENDING: 待审核
 * - APPROVED: 已通过
 * - REJECTED: 已拒绝
 * - CANCELLED: 已取消
 * 
 * 状态转换规则：
 * - PENDING -> APPROVED/REJECTED (审核)
 * - PENDING -> CANCELLED (取消)
 * - 其他状态为终态，不能转换
 * 
 * 主要原理与机制如下：
 * 1. 继承EnumValueObject基类，获得枚举值对象的通用功能
 * 2. 实现getValidValues方法，提供有效的状态值列表
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class ApplicationStatus extends EnumValueObject<string> {

  /**
   * @method create
   * @description 创建申请状态的工厂方法
   * @param value 申请状态值
   * @returns ApplicationStatus
   */
  static create(value: string): ApplicationStatus {
    return new ApplicationStatus(value);
  }

  /**
   * @protected getValidValues
   * @description 获取有效的状态值列表
   * @returns 有效的状态值数组
   */
  protected getValidValues(): string[] {
    return ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  }

  /**
   * @method isPending
   * @description 判断是否为待审核状态
   * @returns boolean
   */
  isPending(): boolean {
    return this.value === 'PENDING';
  }

  /**
   * @method isApproved
   * @description 判断是否为已通过状态
   * @returns boolean
   */
  isApproved(): boolean {
    return this.value === 'APPROVED';
  }

  /**
   * @method isRejected
   * @description 判断是否为已拒绝状态
   * @returns boolean
   */
  isRejected(): boolean {
    return this.value === 'REJECTED';
  }

  /**
   * @method isCancelled
   * @description 判断是否为已取消状态
   * @returns boolean
   */
  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  /**
   * @method isFinal
   * @description 判断是否为终态（不可再转换）
   * @returns boolean
   */
  isFinal(): boolean {
    return this.value === 'APPROVED' || this.value === 'REJECTED' || this.value === 'CANCELLED';
  }

  /**
   * @method canTransitionTo
   * @description 判断是否可以转换到指定状态
   * @param targetStatus 目标状态
   * @returns boolean
   */
  canTransitionTo(targetStatus: ApplicationStatus): boolean {
    if (this.isFinal()) {
      return false;
    }

    if (this.isPending()) {
      return targetStatus.isApproved() || targetStatus.isRejected() || targetStatus.isCancelled();
    }

    return false;
  }

  // 静态常量
  static PENDING = new ApplicationStatus('PENDING');
  static APPROVED = new ApplicationStatus('APPROVED');
  static REJECTED = new ApplicationStatus('REJECTED');
  static CANCELLED = new ApplicationStatus('CANCELLED');
}
