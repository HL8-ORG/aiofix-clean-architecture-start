import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class Email
 * @description 邮箱值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 * 
 * 业务规则：
 * - 邮箱地址必须全局唯一
 * - 邮箱格式必须符合RFC标准
 * - 邮箱长度不能超过254个字符
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保邮箱符合RFC标准
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class Email extends StringValueObject {

  /**
   * @method create
   * @description 创建邮箱的工厂方法
   * @param value 邮箱地址
   * @returns Email
   */
  static create(value: string): Email {
    return new Email(value);
  }

  /**
   * @protected isValidValue
   * @description 验证邮箱地址的有效性
   * @param value 邮箱地址
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (value.length > 254) {
      throw new Error('Email cannot exceed 254 characters');
    }

    // 验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    // 验证邮箱部分长度
    const parts = value.split('@');
    if (parts.length !== 2) {
      throw new Error('Email must contain exactly one @ symbol');
    }

    const localPart = parts[0];
    const domainPart = parts[1];

    if (localPart.length > 64) {
      throw new Error('Local part of email cannot exceed 64 characters');
    }

    if (domainPart.length > 253) {
      throw new Error('Domain part of email cannot exceed 253 characters');
    }

    // 验证域名格式
    const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domainPart)) {
      throw new Error('Invalid domain format');
    }

    // 验证顶级域名至少2个字符
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
      throw new Error('Domain must have at least one dot');
    }

    const topLevelDomain = domainParts[domainParts.length - 1];
    if (topLevelDomain.length < 2) {
      throw new Error('Top-level domain must be at least 2 characters');
    }

    return true;
  }

  /**
   * @protected transformValue
   * @description 转换邮箱地址值（转换为小写并去除首尾空格）
   * @param value 原始邮箱地址值
   * @returns 转换后的邮箱地址值
   */
  protected transformValue(value: string): string {
    return value.toLowerCase().trim();
  }

  /**
   * @method getDomain
   * @description 获取邮箱域名部分
   * @returns string
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * @method getLocalPart
   * @description 获取邮箱本地部分
   * @returns string
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * @method isSystemEmail
   * @description 判断是否为系统邮箱
   * @returns boolean
   */
  isSystemEmail(): boolean {
    const systemDomains = ['admin', 'system', 'noreply', 'support'];
    const localPart = this.getLocalPart().toLowerCase();
    return systemDomains.includes(localPart);
  }

  /**
   * @method isDisposableEmail
   * @description 判断是否为一次性邮箱（简单实现）
   * @returns boolean
   */
  isDisposableEmail(): boolean {
    const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org',
      'throwaway.email'
    ];
    const domain = this.getDomain().toLowerCase();
    return disposableDomains.includes(domain);
  }
}
