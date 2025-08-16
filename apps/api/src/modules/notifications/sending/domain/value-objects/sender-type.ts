import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum SenderTypeEnum
 * @description 发送者类型枚举
 */
export enum SenderTypeEnum {
  EMAIL = 'EMAIL',           // 邮件发送者
  SMS = 'SMS',               // 短信发送者
  PUSH = 'PUSH',             // 推送通知发送者
  WEBHOOK = 'WEBHOOK',       // Webhook发送者
  SLACK = 'SLACK',           // Slack发送者
  DINGTALK = 'DINGTALK',     // 钉钉发送者
  WECHAT = 'WECHAT',         // 微信发送者
  TELEGRAM = 'TELEGRAM',     // Telegram发送者
  DISCORD = 'DISCORD',       // Discord发送者
  CUSTOM = 'CUSTOM'          // 自定义发送者
}

/**
 * @class SenderType
 * @description
 * 通知发送者类型值对象，用于定义发送者的类型。
 * 
 * 主要功能与职责：
 * 1. 定义发送者的类型（邮件、短信、推送等）
 * 2. 提供类型特定的配置和验证
 * 3. 支持类型间的比较和转换
 * 
 * 业务规则：
 * - 发送者类型必须是预定义的有效类型
 * - 不同类型支持不同的配置选项
 * - 类型决定了发送策略和重试机制
 * 
 * @extends EnumValueObject
 */
export class SenderType extends EnumValueObject<SenderTypeEnum> {
  constructor(value: SenderTypeEnum) {
    super(value);
  }

  /**
   * @protected getValidValues
   * @description 获取有效的枚举值
   * @returns {SenderTypeEnum[]} 有效的枚举值数组
   */
  protected getValidValues(): SenderTypeEnum[] {
    return Object.values(SenderTypeEnum);
  }

  /**
   * @method isEmail
   * @description 检查是否为邮件类型
   * @returns {boolean} 是否为邮件类型
   */
  isEmail(): boolean {
    return this.value === SenderTypeEnum.EMAIL;
  }

  /**
   * @method isSms
   * @description 检查是否为短信类型
   * @returns {boolean} 是否为短信类型
   */
  isSms(): boolean {
    return this.value === SenderTypeEnum.SMS;
  }

  /**
   * @method isPush
   * @description 检查是否为推送类型
   * @returns {boolean} 是否为推送类型
   */
  isPush(): boolean {
    return this.value === SenderTypeEnum.PUSH;
  }

  /**
   * @method isWebhook
   * @description 检查是否为Webhook类型
   * @returns {boolean} 是否为Webhook类型
   */
  isWebhook(): boolean {
    return this.value === SenderTypeEnum.WEBHOOK;
  }

  /**
   * @method isCustom
   * @description 检查是否为自定义类型
   * @returns {boolean} 是否为自定义类型
   */
  isCustom(): boolean {
    return this.value === SenderTypeEnum.CUSTOM;
  }

  /**
   * @method requiresAuthentication
   * @description 检查是否需要认证
   * @returns {boolean} 是否需要认证
   */
  requiresAuthentication(): boolean {
    const typesRequiringAuth = [
      SenderTypeEnum.EMAIL,
      SenderTypeEnum.SMS,
      SenderTypeEnum.PUSH,
      SenderTypeEnum.SLACK,
      SenderTypeEnum.DINGTALK,
      SenderTypeEnum.WECHAT,
      SenderTypeEnum.TELEGRAM,
      SenderTypeEnum.DISCORD
    ];
    return typesRequiringAuth.includes(this.value);
  }

  /**
   * @method supportsRetry
   * @description 检查是否支持重试
   * @returns {boolean} 是否支持重试
   */
  supportsRetry(): boolean {
    const typesSupportingRetry = [
      SenderTypeEnum.EMAIL,
      SenderTypeEnum.SMS,
      SenderTypeEnum.PUSH,
      SenderTypeEnum.WEBHOOK
    ];
    return typesSupportingRetry.includes(this.value);
  }

  /**
   * @method getMaxRetryCount
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  getMaxRetryCount(): number {
    const retryConfigs: Record<SenderTypeEnum, number> = {
      [SenderTypeEnum.EMAIL]: 3,
      [SenderTypeEnum.SMS]: 2,
      [SenderTypeEnum.PUSH]: 3,
      [SenderTypeEnum.WEBHOOK]: 5,
      [SenderTypeEnum.SLACK]: 2,
      [SenderTypeEnum.DINGTALK]: 2,
      [SenderTypeEnum.WECHAT]: 2,
      [SenderTypeEnum.TELEGRAM]: 2,
      [SenderTypeEnum.DISCORD]: 2,
      [SenderTypeEnum.CUSTOM]: 3
    };
    return retryConfigs[this.value] || 0;
  }

  /**
   * @method getTimeout
   * @description 获取超时时间（毫秒）
   * @returns {number} 超时时间
   */
  getTimeout(): number {
    const timeoutConfigs: Record<SenderTypeEnum, number> = {
      [SenderTypeEnum.EMAIL]: 30000,    // 30秒
      [SenderTypeEnum.SMS]: 10000,      // 10秒
      [SenderTypeEnum.PUSH]: 15000,     // 15秒
      [SenderTypeEnum.WEBHOOK]: 60000,  // 60秒
      [SenderTypeEnum.SLACK]: 20000,    // 20秒
      [SenderTypeEnum.DINGTALK]: 20000, // 20秒
      [SenderTypeEnum.WECHAT]: 20000,   // 20秒
      [SenderTypeEnum.TELEGRAM]: 20000, // 20秒
      [SenderTypeEnum.DISCORD]: 20000,  // 20秒
      [SenderTypeEnum.CUSTOM]: 30000    // 30秒
    };
    return timeoutConfigs[this.value] || 30000;
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<SenderTypeEnum, string> = {
      [SenderTypeEnum.EMAIL]: '邮件',
      [SenderTypeEnum.SMS]: '短信',
      [SenderTypeEnum.PUSH]: '推送通知',
      [SenderTypeEnum.WEBHOOK]: 'Webhook',
      [SenderTypeEnum.SLACK]: 'Slack',
      [SenderTypeEnum.DINGTALK]: '钉钉',
      [SenderTypeEnum.WECHAT]: '微信',
      [SenderTypeEnum.TELEGRAM]: 'Telegram',
      [SenderTypeEnum.DISCORD]: 'Discord',
      [SenderTypeEnum.CUSTOM]: '自定义'
    };
    return displayNames[this.value];
  }

  /**
   * @method getDescription
   * @description 获取描述信息
   * @returns {string} 描述信息
   */
  getDescription(): string {
    const descriptions: Record<SenderTypeEnum, string> = {
      [SenderTypeEnum.EMAIL]: '通过SMTP服务器发送邮件通知',
      [SenderTypeEnum.SMS]: '通过短信网关发送短信通知',
      [SenderTypeEnum.PUSH]: '通过推送服务发送移动端通知',
      [SenderTypeEnum.WEBHOOK]: '通过HTTP请求发送Webhook通知',
      [SenderTypeEnum.SLACK]: '通过Slack API发送频道消息',
      [SenderTypeEnum.DINGTALK]: '通过钉钉API发送工作通知',
      [SenderTypeEnum.WECHAT]: '通过微信API发送企业消息',
      [SenderTypeEnum.TELEGRAM]: '通过Telegram Bot API发送消息',
      [SenderTypeEnum.DISCORD]: '通过Discord Webhook发送消息',
      [SenderTypeEnum.CUSTOM]: '自定义发送方式，需要配置发送逻辑'
    };
    return descriptions[this.value];
  }
}
