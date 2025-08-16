import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum NotificationPriorityEnum
 * @description 通知优先级枚举
 */
export enum NotificationPriorityEnum {
  LOW = 'LOW',                   // 低优先级
  NORMAL = 'NORMAL',             // 普通优先级
  HIGH = 'HIGH',                 // 高优先级
  URGENT = 'URGENT',             // 紧急优先级
  CRITICAL = 'CRITICAL'          // 关键优先级
}

/**
 * @class NotificationPriority
 * @description
 * 通知优先级值对象，用于表示通知的优先级。
 * 
 * 主要功能与职责：
 * 1. 封装通知优先级的枚举值，确保类型安全
 * 2. 提供通知优先级的验证逻辑，确保优先级值有效
 * 3. 继承EnumValueObject基类，获得通用的枚举值对象功能
 * 4. 支持通知优先级的比较、序列化等操作
 * 
 * 业务规则：
 * - 通知优先级必须是预定义的枚举值之一
 * - 不同优先级的通知有不同的处理策略和发送顺序
 * - 支持优先级比较和优先级排序操作
 * 
 * @extends EnumValueObject<NotificationPriorityEnum>
 */
export class NotificationPriority extends EnumValueObject<NotificationPriorityEnum> {
  /**
   * @constructor
   * @param value 通知优先级的枚举值
   * @throws {Error} 当通知优先级值无效时抛出异常
   */
  constructor(value: NotificationPriorityEnum) {
    super(value, NotificationPriorityEnum);
  }

  /**
   * @method isLow
   * @description 检查是否为低优先级
   * @returns {boolean} 是否为低优先级
   */
  isLow(): boolean {
    return this.value === NotificationPriorityEnum.LOW;
  }

  /**
   * @method isNormal
   * @description 检查是否为普通优先级
   * @returns {boolean} 是否为普通优先级
   */
  isNormal(): boolean {
    return this.value === NotificationPriorityEnum.NORMAL;
  }

  /**
   * @method isHigh
   * @description 检查是否为高优先级
   * @returns {boolean} 是否为高优先级
   */
  isHigh(): boolean {
    return this.value === NotificationPriorityEnum.HIGH;
  }

  /**
   * @method isUrgent
   * @description 检查是否为紧急优先级
   * @returns {boolean} 是否为紧急优先级
   */
  isUrgent(): boolean {
    return this.value === NotificationPriorityEnum.URGENT;
  }

  /**
   * @method isCritical
   * @description 检查是否为关键优先级
   * @returns {boolean} 是否为关键优先级
   */
  isCritical(): boolean {
    return this.value === NotificationPriorityEnum.CRITICAL;
  }

  /**
   * @method getNumericValue
   * @description 获取优先级的数值表示
   * @returns {number} 优先级的数值
   */
  getNumericValue(): number {
    const numericValues: Record<NotificationPriorityEnum, number> = {
      [NotificationPriorityEnum.LOW]: 1,
      [NotificationPriorityEnum.NORMAL]: 2,
      [NotificationPriorityEnum.HIGH]: 3,
      [NotificationPriorityEnum.URGENT]: 4,
      [NotificationPriorityEnum.CRITICAL]: 5
    };

    return numericValues[this.value];
  }

  /**
   * @method isHigherThan
   * @description 检查是否比指定优先级更高
   * @param other 要比较的优先级
   * @returns {boolean} 是否更高
   */
  isHigherThan(other: NotificationPriority): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  /**
   * @method isLowerThan
   * @description 检查是否比指定优先级更低
   * @param other 要比较的优先级
   * @returns {boolean} 是否更低
   */
  isLowerThan(other: NotificationPriority): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }

  /**
   * @method isEqualTo
   * @description 检查是否与指定优先级相等
   * @param other 要比较的优先级
   * @returns {boolean} 是否相等
   */
  isEqualTo(other: NotificationPriority): boolean {
    return this.getNumericValue() === other.getNumericValue();
  }

  /**
   * @method requiresImmediateAction
   * @description 检查是否需要立即处理
   * @returns {boolean} 是否需要立即处理
   */
  requiresImmediateAction(): boolean {
    return this.isUrgent() || this.isCritical();
  }

  /**
   * @method requiresRetry
   * @description 检查失败时是否需要重试
   * @returns {boolean} 是否需要重试
   */
  requiresRetry(): boolean {
    return this.isHigh() || this.isUrgent() || this.isCritical();
  }

  /**
   * @method getRetryCount
   * @description 获取失败时的重试次数
   * @returns {number} 重试次数
   */
  getRetryCount(): number {
    const retryCounts: Record<NotificationPriorityEnum, number> = {
      [NotificationPriorityEnum.LOW]: 1,
      [NotificationPriorityEnum.NORMAL]: 2,
      [NotificationPriorityEnum.HIGH]: 3,
      [NotificationPriorityEnum.URGENT]: 5,
      [NotificationPriorityEnum.CRITICAL]: 10
    };

    return retryCounts[this.value];
  }

  /**
   * @method getDisplayName
   * @description 获取优先级的显示名称
   * @returns {string} 优先级的显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<NotificationPriorityEnum, string> = {
      [NotificationPriorityEnum.LOW]: '低优先级',
      [NotificationPriorityEnum.NORMAL]: '普通优先级',
      [NotificationPriorityEnum.HIGH]: '高优先级',
      [NotificationPriorityEnum.URGENT]: '紧急优先级',
      [NotificationPriorityEnum.CRITICAL]: '关键优先级'
    };

    return displayNames[this.value];
  }

  /**
   * @method getDescription
   * @description 获取优先级的描述信息
   * @returns {string} 优先级的描述信息
   */
  getDescription(): string {
    const descriptions: Record<NotificationPriorityEnum, string> = {
      [NotificationPriorityEnum.LOW]: '低优先级通知，可以延迟处理',
      [NotificationPriorityEnum.NORMAL]: '普通优先级通知，按正常流程处理',
      [NotificationPriorityEnum.HIGH]: '高优先级通知，需要优先处理',
      [NotificationPriorityEnum.URGENT]: '紧急优先级通知，需要立即处理',
      [NotificationPriorityEnum.CRITICAL]: '关键优先级通知，需要最高优先级处理'
    };

    return descriptions[this.value];
  }
}
