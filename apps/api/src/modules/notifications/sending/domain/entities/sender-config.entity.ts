import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';
import { SenderType, SenderTypeEnum } from '../value-objects/sender-type';

/**
 * @class ConfigKey
 * @description 配置键值对象
 */
export class ConfigKey extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 100) {
      return false;
    }

    // 只允许字母、数字、下划线、点号
    const validPattern = /^[a-zA-Z0-9_.]+$/;
    return validPattern.test(value);
  }
}

/**
 * @class ConfigValue
 * @description 配置值对象
 */
export class ConfigValue extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    return value.length <= 1000;
  }
}

/**
 * @class SenderConfig
 * @description
 * 发送者配置实体，用于存储发送者的配置信息。
 * 
 * 主要功能与职责：
 * 1. 存储发送者的配置参数
 * 2. 提供配置的验证和管理
 * 3. 支持不同类型发送者的特定配置
 * 
 * 业务规则：
 * - 配置键必须唯一
 * - 配置值必须符合类型要求
 * - 敏感配置需要加密存储
 * 
 */
export class SenderConfig {
  constructor(
    public readonly key: ConfigKey,
    public readonly value: ConfigValue,
    public readonly isEncrypted: boolean = false,
    public readonly description?: string,
    public readonly metadata?: Record<string, any>
  ) { }

  /**
   * @method getValue
   * @description 获取配置值（解密后的值）
   * @returns {string} 配置值
   */
  getValue(): string {
    // 这里应该实现解密逻辑
    // 暂时直接返回原始值
    return this.value.value;
  }

  /**
   * @method toPlainObject
   * @description 转换为普通对象
   * @returns {object} 普通对象
   */
  toPlainObject(): Record<string, any> {
    return {
      key: this.key.value,
      value: this.isEncrypted ? '***' : this.value.value,
      isEncrypted: this.isEncrypted,
      description: this.description,
      metadata: this.metadata
    };
  }

  /**
   * @method validateForType
   * @description 根据发送者类型验证配置
   * @param senderType 发送者类型
   * @returns {boolean} 是否有效
   */
  validateForType(senderType: SenderType): boolean {
    const key = this.key.value;
    const value = this.value.value;

    switch (senderType.value) {
      case SenderTypeEnum.EMAIL:
        return this.validateEmailConfig(key, value);
      case SenderTypeEnum.SMS:
        return this.validateSmsConfig(key, value);
      case SenderTypeEnum.PUSH:
        return this.validatePushConfig(key, value);
      case SenderTypeEnum.WEBHOOK:
        return this.validateWebhookConfig(key, value);
      case SenderTypeEnum.SLACK:
        return this.validateSlackConfig(key, value);
      case SenderTypeEnum.DINGTALK:
        return this.validateDingTalkConfig(key, value);
      case SenderTypeEnum.WECHAT:
        return this.validateWeChatConfig(key, value);
      case SenderTypeEnum.TELEGRAM:
        return this.validateTelegramConfig(key, value);
      case SenderTypeEnum.DISCORD:
        return this.validateDiscordConfig(key, value);
      case SenderTypeEnum.CUSTOM:
        return this.validateCustomConfig(key, value);
      default:
        return true;
    }
  }

  /**
   * @private validateEmailConfig
   * @description 验证邮件配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateEmailConfig(key: string, value: string): boolean {
    const requiredKeys = ['host', 'port', 'username', 'password', 'from'];

    if (requiredKeys.includes(key)) {
      if (key === 'port') {
        const port = parseInt(value);
        return !isNaN(port) && port > 0 && port <= 65535;
      }
      if (key === 'from') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(value);
      }
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateSmsConfig
   * @description 验证短信配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateSmsConfig(key: string, value: string): boolean {
    const requiredKeys = ['apiKey', 'apiSecret', 'endpoint'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validatePushConfig
   * @description 验证推送配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validatePushConfig(key: string, value: string): boolean {
    const requiredKeys = ['appId', 'appKey', 'masterSecret'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateWebhookConfig
   * @description 验证Webhook配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateWebhookConfig(key: string, value: string): boolean {
    if (key === 'url') {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * @private validateSlackConfig
   * @description 验证Slack配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateSlackConfig(key: string, value: string): boolean {
    const requiredKeys = ['token', 'channel'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateDingTalkConfig
   * @description 验证钉钉配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateDingTalkConfig(key: string, value: string): boolean {
    const requiredKeys = ['appKey', 'appSecret', 'agentId'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateWeChatConfig
   * @description 验证微信配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateWeChatConfig(key: string, value: string): boolean {
    const requiredKeys = ['corpId', 'corpSecret', 'agentId'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateTelegramConfig
   * @description 验证Telegram配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateTelegramConfig(key: string, value: string): boolean {
    const requiredKeys = ['botToken', 'chatId'];

    if (requiredKeys.includes(key)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * @private validateDiscordConfig
   * @description 验证Discord配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateDiscordConfig(key: string, value: string): boolean {
    if (key === 'webhookUrl') {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * @private validateCustomConfig
   * @description 验证自定义配置
   * @param key 配置键
   * @param value 配置值
   * @returns {boolean} 是否有效
   */
  private validateCustomConfig(key: string, value: string): boolean {
    // 自定义配置的验证逻辑由用户定义
    return true;
  }

  /**
   * @method isRequired
   * @description 检查是否为必需配置
   * @param senderType 发送者类型
   * @returns {boolean} 是否为必需配置
   */
  isRequired(senderType: SenderType): boolean {
    const key = this.key.value;

    switch (senderType.value) {
      case SenderTypeEnum.EMAIL:
        return ['host', 'port', 'username', 'password', 'from'].includes(key);
      case SenderTypeEnum.SMS:
        return ['apiKey', 'apiSecret', 'endpoint'].includes(key);
      case SenderTypeEnum.PUSH:
        return ['appId', 'appKey', 'masterSecret'].includes(key);
      case SenderTypeEnum.WEBHOOK:
        return ['url'].includes(key);
      case SenderTypeEnum.SLACK:
        return ['token', 'channel'].includes(key);
      case SenderTypeEnum.DINGTALK:
        return ['appKey', 'appSecret', 'agentId'].includes(key);
      case SenderTypeEnum.WECHAT:
        return ['corpId', 'corpSecret', 'agentId'].includes(key);
      case SenderTypeEnum.TELEGRAM:
        return ['botToken', 'chatId'].includes(key);
      case SenderTypeEnum.DISCORD:
        return ['webhookUrl'].includes(key);
      default:
        return false;
    }
  }
}
