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
 */
export class ApplicationStatus {
  private readonly _value: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 申请状态值
   */
  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

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
   * @method validate
   * @description 验证申请状态的有效性
   * @param value 申请状态值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid application status: ${value}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个申请状态是否相等
   * @param other 另一个申请状态
   * @returns boolean
   */
  equals(other: ApplicationStatus): boolean {
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
   * @description 获取申请状态值
   * @returns string
   */
  get value(): string {
    return this._value;
  }

  /**
   * @method isPending
   * @description 判断是否为待审核状态
   * @returns boolean
   */
  isPending(): boolean {
    return this._value === 'PENDING';
  }

  /**
   * @method isApproved
   * @description 判断是否为已通过状态
   * @returns boolean
   */
  isApproved(): boolean {
    return this._value === 'APPROVED';
  }

  /**
   * @method isRejected
   * @description 判断是否为已拒绝状态
   * @returns boolean
   */
  isRejected(): boolean {
    return this._value === 'REJECTED';
  }

  /**
   * @method isCancelled
   * @description 判断是否为已取消状态
   * @returns boolean
   */
  isCancelled(): boolean {
    return this._value === 'CANCELLED';
  }

  /**
   * @method isFinal
   * @description 判断是否为终态（不可再转换）
   * @returns boolean
   */
  isFinal(): boolean {
    return this._value === 'APPROVED' || this._value === 'REJECTED' || this._value === 'CANCELLED';
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
