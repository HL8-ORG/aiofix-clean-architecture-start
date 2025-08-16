import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class TenantName
 * @description 租户名称值对象
 * 
 * 业务规则：
 * - 租户名称必须全局唯一
 * - 长度在2-100个字符之间
 * - 不能包含特殊字符（除了空格、连字符、括号）
 * - 不能以空格开头或结尾
 * - 不能包含连续的空格
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保租户名称符合命名规范
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class TenantName extends StringValueObject {

  /**
   * @method create
   * @description 创建租户名称的工厂方法
   * @param value 租户名称值
   * @returns TenantName
   */
  static create(value: string): TenantName {
    return new TenantName(value);
  }

  /**
   * @protected isValidValue
   * @description 验证租户名称的有效性
   * @param value 租户名称值
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Tenant name cannot be empty');
    }

    if (value.length < 2) {
      throw new Error('Tenant name must be at least 2 characters long');
    }

    if (value.length > 100) {
      throw new Error('Tenant name cannot exceed 100 characters');
    }

    // 验证字符格式：只能包含字母、数字、空格、连字符、括号和中文
    const validFormat = /^[a-zA-Z0-9\s\-()（）\u4e00-\u9fa5]+$/;
    if (!validFormat.test(value)) {
      throw new Error('Tenant name contains invalid characters');
    }

    // 验证不能以空格开头或结尾
    if (value.startsWith(' ') || value.endsWith(' ')) {
      throw new Error('Tenant name cannot start or end with spaces');
    }

    // 验证不能包含连续的空格
    if (value.includes('  ')) {
      throw new Error('Tenant name cannot contain consecutive spaces');
    }

    // 验证不能只包含空格
    if (value.trim().length === 0) {
      throw new Error('Tenant name cannot contain only spaces');
    }

    return true;
  }

  /**
   * @protected transformValue
   * @description 标准化租户名称
   * @param value 原始值
   * @returns string 标准化后的值
   */
  protected transformValue(value: string): string {
    // 去除首尾空格
    let normalized = value.trim();

    // 将多个连续空格替换为单个空格
    normalized = normalized.replace(/\s+/g, ' ');

    // 首字母大写
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return normalized;
  }

  /**
   * @method toUpperCase
   * @description 转换为大写形式
   * @returns TenantName
   */
  toUpperCase(): TenantName {
    return new TenantName(this.value.toUpperCase());
  }

  /**
   * @method toLowerCase
   * @description 转换为小写形式
   * @returns TenantName
   */
  toLowerCase(): TenantName {
    return new TenantName(this.value.toLowerCase());
  }

  /**
   * @method getInitials
   * @description 获取租户名称的首字母缩写
   * @returns string
   */
  getInitials(): string {
    return this.value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * @method getWordCount
   * @description 获取租户名称的单词数量
   * @returns number
   */
  getWordCount(): number {
    return this.value.split(' ').length;
  }
}
