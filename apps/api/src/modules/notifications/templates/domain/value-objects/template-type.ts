import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum TemplateTypeEnum
 * @description 模板类型枚举
 */
export enum TemplateTypeEnum {
  EMAIL = 'EMAIL',                     // 邮件模板
  SMS = 'SMS',                         // 短信模板
  PUSH = 'PUSH',                       // 推送模板
  SYSTEM = 'SYSTEM',                   // 系统通知模板
  WELCOME = 'WELCOME',                 // 欢迎模板
  PASSWORD_RESET = 'PASSWORD_RESET',   // 密码重置模板
  VERIFICATION = 'VERIFICATION',       // 验证码模板
  ANNOUNCEMENT = 'ANNOUNCEMENT',       // 公告模板
  ALERT = 'ALERT',                     // 告警模板
  REMINDER = 'REMINDER'                // 提醒模板
}

/**
 * @class TemplateType
 * @description
 * 模板类型值对象，用于表示通知模板的类型。
 * 
 * 主要功能与职责：
 * 1. 封装模板类型的枚举值，确保类型安全
 * 2. 提供模板类型的验证逻辑，确保类型值有效
 * 3. 继承EnumValueObject基类，获得通用的枚举值对象功能
 * 4. 支持模板类型的比较、序列化等操作
 * 
 * 业务规则：
 * - 模板类型必须是预定义的枚举值之一
 * - 不同类型的模板有不同的变量和格式要求
 * - 支持类型查询和类型分类操作
 * 
 * @extends EnumValueObject<TemplateTypeEnum>
 */
export class TemplateType extends EnumValueObject<TemplateTypeEnum> {
  /**
   * @constructor
   * @param value 模板类型的枚举值
   * @throws {Error} 当模板类型值无效时抛出异常
   */
  constructor(value: TemplateTypeEnum) {
    super(value, TemplateTypeEnum);
  }

  /**
   * @method isEmail
   * @description 检查是否为邮件模板
   * @returns {boolean} 是否为邮件模板
   */
  isEmail(): boolean {
    return this.value === TemplateTypeEnum.EMAIL;
  }

  /**
   * @method isSms
   * @description 检查是否为短信模板
   * @returns {boolean} 是否为短信模板
   */
  isSms(): boolean {
    return this.value === TemplateTypeEnum.SMS;
  }

  /**
   * @method isPush
   * @description 检查是否为推送模板
   * @returns {boolean} 是否为推送模板
   */
  isPush(): boolean {
    return this.value === TemplateTypeEnum.PUSH;
  }

  /**
   * @method isSystem
   * @description 检查是否为系统通知模板
   * @returns {boolean} 是否为系统通知模板
   */
  isSystem(): boolean {
    return this.value === TemplateTypeEnum.SYSTEM;
  }

  /**
   * @method isWelcome
   * @description 检查是否为欢迎模板
   * @returns {boolean} 是否为欢迎模板
   */
  isWelcome(): boolean {
    return this.value === TemplateTypeEnum.WELCOME;
  }

  /**
   * @method isPasswordReset
   * @description 检查是否为密码重置模板
   * @returns {boolean} 是否为密码重置模板
   */
  isPasswordReset(): boolean {
    return this.value === TemplateTypeEnum.PASSWORD_RESET;
  }

  /**
   * @method isVerification
   * @description 检查是否为验证码模板
   * @returns {boolean} 是否为验证码模板
   */
  isVerification(): boolean {
    return this.value === TemplateTypeEnum.VERIFICATION;
  }

  /**
   * @method isAnnouncement
   * @description 检查是否为公告模板
   * @returns {boolean} 是否为公告模板
   */
  isAnnouncement(): boolean {
    return this.value === TemplateTypeEnum.ANNOUNCEMENT;
  }

  /**
   * @method isAlert
   * @description 检查是否为告警模板
   * @returns {boolean} 是否为告警模板
   */
  isAlert(): boolean {
    return this.value === TemplateTypeEnum.ALERT;
  }

  /**
   * @method isReminder
   * @description 检查是否为提醒模板
   * @returns {boolean} 是否为提醒模板
   */
  isReminder(): boolean {
    return this.value === TemplateTypeEnum.REMINDER;
  }

  /**
   * @method requiresVariables
   * @description 检查是否需要变量替换
   * @returns {boolean} 是否需要变量替换
   */
  requiresVariables(): boolean {
    return this.isEmail() || this.isSms() || this.isPush() || this.isWelcome() ||
      this.isPasswordReset() || this.isVerification() || this.isAnnouncement();
  }

  /**
   * @method getDefaultVariables
   * @description 获取默认变量列表
   * @returns {string[]} 默认变量列表
   */
  getDefaultVariables(): string[] {
    const defaultVariables: Record<TemplateTypeEnum, string[]> = {
      [TemplateTypeEnum.EMAIL]: ['userName', 'userEmail', 'companyName', 'currentDate'],
      [TemplateTypeEnum.SMS]: ['userName', 'verificationCode', 'expiryTime'],
      [TemplateTypeEnum.PUSH]: ['title', 'message', 'actionUrl'],
      [TemplateTypeEnum.SYSTEM]: ['message', 'timestamp'],
      [TemplateTypeEnum.WELCOME]: ['userName', 'companyName', 'loginUrl'],
      [TemplateTypeEnum.PASSWORD_RESET]: ['userName', 'resetUrl', 'expiryTime'],
      [TemplateTypeEnum.VERIFICATION]: ['userName', 'verificationCode', 'expiryTime'],
      [TemplateTypeEnum.ANNOUNCEMENT]: ['title', 'content', 'publisher', 'publishDate'],
      [TemplateTypeEnum.ALERT]: ['alertType', 'message', 'severity', 'timestamp'],
      [TemplateTypeEnum.REMINDER]: ['userName', 'taskName', 'dueDate', 'priority']
    };

    return defaultVariables[this.value] || [];
  }

  /**
   * @method getDisplayName
   * @description 获取类型的显示名称
   * @returns {string} 类型的显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<TemplateTypeEnum, string> = {
      [TemplateTypeEnum.EMAIL]: '邮件模板',
      [TemplateTypeEnum.SMS]: '短信模板',
      [TemplateTypeEnum.PUSH]: '推送模板',
      [TemplateTypeEnum.SYSTEM]: '系统通知模板',
      [TemplateTypeEnum.WELCOME]: '欢迎模板',
      [TemplateTypeEnum.PASSWORD_RESET]: '密码重置模板',
      [TemplateTypeEnum.VERIFICATION]: '验证码模板',
      [TemplateTypeEnum.ANNOUNCEMENT]: '公告模板',
      [TemplateTypeEnum.ALERT]: '告警模板',
      [TemplateTypeEnum.REMINDER]: '提醒模板'
    };

    return displayNames[this.value];
  }

  /**
   * @method getDescription
   * @description 获取类型的描述信息
   * @returns {string} 类型的描述信息
   */
  getDescription(): string {
    const descriptions: Record<TemplateTypeEnum, string> = {
      [TemplateTypeEnum.EMAIL]: '用于发送电子邮件的模板',
      [TemplateTypeEnum.SMS]: '用于发送短信的模板',
      [TemplateTypeEnum.PUSH]: '用于发送推送通知的模板',
      [TemplateTypeEnum.SYSTEM]: '用于系统内部通知的模板',
      [TemplateTypeEnum.WELCOME]: '用于新用户欢迎的模板',
      [TemplateTypeEnum.PASSWORD_RESET]: '用于密码重置的模板',
      [TemplateTypeEnum.VERIFICATION]: '用于验证码发送的模板',
      [TemplateTypeEnum.ANNOUNCEMENT]: '用于系统公告的模板',
      [TemplateTypeEnum.ALERT]: '用于系统告警的模板',
      [TemplateTypeEnum.REMINDER]: '用于任务提醒的模板'
    };

    return descriptions[this.value];
  }
}
