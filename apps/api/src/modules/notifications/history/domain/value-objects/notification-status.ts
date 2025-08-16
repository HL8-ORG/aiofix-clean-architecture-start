import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum NotificationStatusEnum
 * @description 通知状态枚举
 */
export enum NotificationStatusEnum {
  PENDING = 'PENDING',           // 待发送
  SENDING = 'SENDING',           // 发送中
  SENT = 'SENT',                 // 已发送
  DELIVERED = 'DELIVERED',       // 已送达
  READ = 'READ',                 // 已读
  FAILED = 'FAILED',             // 发送失败
  CANCELLED = 'CANCELLED',       // 已取消
  EXPIRED = 'EXPIRED'            // 已过期
}

/**
 * @class NotificationStatus
 * @description
 * 通知状态值对象，用于表示通知的当前状态。
 * 
 * 主要功能与职责：
 * 1. 封装通知状态的枚举值，确保类型安全
 * 2. 提供通知状态的验证逻辑，确保状态值有效
 * 3. 继承EnumValueObject基类，获得通用的枚举值对象功能
 * 4. 支持通知状态的比较、序列化等操作
 * 
 * 业务规则：
 * - 通知状态必须是预定义的枚举值之一
 * - 通知状态转换必须遵循特定的业务规则
 * - 支持状态查询和状态变更操作
 * 
 * @extends EnumValueObject<NotificationStatusEnum>
 */
export class NotificationStatus extends EnumValueObject<NotificationStatusEnum> {
  /**
   * @constructor
   * @param value 通知状态的枚举值
   * @throws {Error} 当通知状态值无效时抛出异常
   */
  constructor(value: NotificationStatusEnum) {
    super(value, NotificationStatusEnum);
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  isPending(): boolean {
    return this.value === NotificationStatusEnum.PENDING;
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  isSending(): boolean {
    return this.value === NotificationStatusEnum.SENDING;
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  isSent(): boolean {
    return this.value === NotificationStatusEnum.SENT;
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  isDelivered(): boolean {
    return this.value === NotificationStatusEnum.DELIVERED;
  }

  /**
   * @method isRead
   * @description 检查是否为已读状态
   * @returns {boolean} 是否为已读状态
   */
  isRead(): boolean {
    return this.value === NotificationStatusEnum.READ;
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  isFailed(): boolean {
    return this.value === NotificationStatusEnum.FAILED;
  }

  /**
   * @method isCancelled
   * @description 检查是否为已取消状态
   * @returns {boolean} 是否为已取消状态
   */
  isCancelled(): boolean {
    return this.value === NotificationStatusEnum.CANCELLED;
  }

  /**
   * @method isExpired
   * @description 检查是否为已过期状态
   * @returns {boolean} 是否为已过期状态
   */
  isExpired(): boolean {
    return this.value === NotificationStatusEnum.EXPIRED;
  }

  /**
   * @method canTransitionTo
   * @description 检查是否可以转换到指定状态
   * @param targetStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  canTransitionTo(targetStatus: NotificationStatus): boolean {
    const validTransitions: Record<NotificationStatusEnum, NotificationStatusEnum[]> = {
      [NotificationStatusEnum.PENDING]: [
        NotificationStatusEnum.SENDING,
        NotificationStatusEnum.CANCELLED,
        NotificationStatusEnum.EXPIRED
      ],
      [NotificationStatusEnum.SENDING]: [
        NotificationStatusEnum.SENT,
        NotificationStatusEnum.FAILED,
        NotificationStatusEnum.CANCELLED
      ],
      [NotificationStatusEnum.SENT]: [
        NotificationStatusEnum.DELIVERED,
        NotificationStatusEnum.FAILED
      ],
      [NotificationStatusEnum.DELIVERED]: [
        NotificationStatusEnum.READ,
        NotificationStatusEnum.EXPIRED
      ],
      [NotificationStatusEnum.READ]: [
        NotificationStatusEnum.EXPIRED
      ],
      [NotificationStatusEnum.FAILED]: [
        NotificationStatusEnum.PENDING, // 重试
        NotificationStatusEnum.CANCELLED
      ],
      [NotificationStatusEnum.CANCELLED]: [],
      [NotificationStatusEnum.EXPIRED]: []
    };

    return validTransitions[this.value].includes(targetStatus.value);
  }

  /**
   * @method getDisplayName
   * @description 获取状态的显示名称
   * @returns {string} 状态的显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<NotificationStatusEnum, string> = {
      [NotificationStatusEnum.PENDING]: '待发送',
      [NotificationStatusEnum.SENDING]: '发送中',
      [NotificationStatusEnum.SENT]: '已发送',
      [NotificationStatusEnum.DELIVERED]: '已送达',
      [NotificationStatusEnum.READ]: '已读',
      [NotificationStatusEnum.FAILED]: '发送失败',
      [NotificationStatusEnum.CANCELLED]: '已取消',
      [NotificationStatusEnum.EXPIRED]: '已过期'
    };

    return displayNames[this.value];
  }
}
