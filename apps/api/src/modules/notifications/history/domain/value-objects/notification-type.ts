import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum NotificationTypeEnum
 * @description 通知类型枚举
 */
export enum NotificationTypeEnum {
  EMAIL = 'EMAIL',               // 邮件通知
  SMS = 'SMS',                   // 短信通知
  PUSH = 'PUSH',                 // 推送通知
  SYSTEM = 'SYSTEM',             // 系统通知
  ALERT = 'ALERT',               // 告警通知
  REMINDER = 'REMINDER',         // 提醒通知
  ANNOUNCEMENT = 'ANNOUNCEMENT', // 公告通知
  WELCOME = 'WELCOME'            // 欢迎通知
}

/**
 * @class NotificationType
 * @description
 * 通知类型值对象，用于表示通知的类型。
 * 
 * 主要功能与职责：
 * 1. 封装通知类型的枚举值，确保类型安全
 * 2. 提供通知类型的验证逻辑，确保类型值有效
 * 3. 继承EnumValueObject基类，获得通用的枚举值对象功能
 * 4. 支持通知类型的比较、序列化等操作
 * 
 * 业务规则：
 * - 通知类型必须是预定义的枚举值之一
 * - 不同类型的通知有不同的处理逻辑和模板
 * - 支持类型查询和类型分类操作
 * 
 * @extends EnumValueObject<NotificationTypeEnum>
 */
export class NotificationType extends EnumValueObject<NotificationTypeEnum> {
  /**
   * @constructor
   * @param value 通知类型的枚举值
   * @throws {Error} 当通知类型值无效时抛出异常
   */
  constructor(value: NotificationTypeEnum) {
    super(value, NotificationTypeEnum);
  }

  /**
   * @method isEmail
   * @description 检查是否为邮件通知
   * @returns {boolean} 是否为邮件通知
   */
  isEmail(): boolean {
    return this.value === NotificationTypeEnum.EMAIL;
  }

  /**
   * @method isSms
   * @description 检查是否为短信通知
   * @returns {boolean} 是否为短信通知
   */
  isSms(): boolean {
    return this.value === NotificationTypeEnum.SMS;
  }

  /**
   * @method isPush
   * @description 检查是否为推送通知
   * @returns {boolean} 是否为推送通知
   */
  isPush(): boolean {
    return this.value === NotificationTypeEnum.PUSH;
  }

  /**
   * @method isSystem
   * @description 检查是否为系统通知
   * @returns {boolean} 是否为系统通知
   */
  isSystem(): boolean {
    return this.value === NotificationTypeEnum.SYSTEM;
  }

  /**
   * @method isAlert
   * @description 检查是否为告警通知
   * @returns {boolean} 是否为告警通知
   */
  isAlert(): boolean {
    return this.value === NotificationTypeEnum.ALERT;
  }

  /**
   * @method isReminder
   * @description 检查是否为提醒通知
   * @returns {boolean} 是否为提醒通知
   */
  isReminder(): boolean {
    return this.value === NotificationTypeEnum.REMINDER;
  }

  /**
   * @method isAnnouncement
   * @description 检查是否为公告通知
   * @returns {boolean} 是否为公告通知
   */
  isAnnouncement(): boolean {
    return this.value === NotificationTypeEnum.ANNOUNCEMENT;
  }

  /**
   * @method isWelcome
   * @description 检查是否为欢迎通知
   * @returns {boolean} 是否为欢迎通知
   */
  isWelcome(): boolean {
    return this.value === NotificationTypeEnum.WELCOME;
  }

  /**
   * @method isExternal
   * @description 检查是否为外部通知（需要外部服务发送）
   * @returns {boolean} 是否为外部通知
   */
  isExternal(): boolean {
    return this.isEmail() || this.isSms() || this.isPush();
  }

  /**
   * @method isInternal
   * @description 检查是否为内部通知（系统内部处理）
   * @returns {boolean} 是否为内部通知
   */
  isInternal(): boolean {
    return this.isSystem() || this.isAlert() || this.isReminder() || this.isAnnouncement() || this.isWelcome();
  }

  /**
   * @method requiresTemplate
   * @description 检查是否需要模板
   * @returns {boolean} 是否需要模板
   */
  requiresTemplate(): boolean {
    return this.isEmail() || this.isSms() || this.isPush() || this.isAnnouncement() || this.isWelcome();
  }

  /**
   * @method getDisplayName
   * @description 获取类型的显示名称
   * @returns {string} 类型的显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<NotificationTypeEnum, string> = {
      [NotificationTypeEnum.EMAIL]: '邮件通知',
      [NotificationTypeEnum.SMS]: '短信通知',
      [NotificationTypeEnum.PUSH]: '推送通知',
      [NotificationTypeEnum.SYSTEM]: '系统通知',
      [NotificationTypeEnum.ALERT]: '告警通知',
      [NotificationTypeEnum.REMINDER]: '提醒通知',
      [NotificationTypeEnum.ANNOUNCEMENT]: '公告通知',
      [NotificationTypeEnum.WELCOME]: '欢迎通知'
    };

    return displayNames[this.value];
  }

  /**
   * @method getDescription
   * @description 获取类型的描述信息
   * @returns {string} 类型的描述信息
   */
  getDescription(): string {
    const descriptions: Record<NotificationTypeEnum, string> = {
      [NotificationTypeEnum.EMAIL]: '通过电子邮件发送的通知',
      [NotificationTypeEnum.SMS]: '通过短信发送的通知',
      [NotificationTypeEnum.PUSH]: '通过推送服务发送的通知',
      [NotificationTypeEnum.SYSTEM]: '系统内部生成的通知',
      [NotificationTypeEnum.ALERT]: '系统告警和异常通知',
      [NotificationTypeEnum.REMINDER]: '定时提醒和任务通知',
      [NotificationTypeEnum.ANNOUNCEMENT]: '系统公告和重要信息通知',
      [NotificationTypeEnum.WELCOME]: '用户注册和欢迎通知'
    };

    return descriptions[this.value];
  }
}
