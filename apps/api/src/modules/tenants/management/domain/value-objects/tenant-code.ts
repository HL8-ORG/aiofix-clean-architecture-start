import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class TenantCode
 * @description 租户代码值对象
 * 
 * 业务规则：
 * - 租户代码必须全局唯一
 * - 只能包含字母、数字、下划线和连字符
 * - 长度在3-50个字符之间
 * - 不能以数字开头
 * - 不能包含连续的下划线或连字符
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保租户代码符合命名规范
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class TenantCode extends StringValueObject {

  /**
   * @method create
   * @description 创建租户代码的工厂方法
   * @param value 租户代码值
   * @returns TenantCode
   */
  static create(value: string): TenantCode {
    return new TenantCode(value);
  }

  /**
   * @protected isValidValue
   * @description 验证租户代码的有效性
   * @param value 租户代码值
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Tenant code cannot be empty');
    }

    if (value.length < 3) {
      throw new Error('Tenant code must be at least 3 characters long');
    }

    if (value.length > 50) {
      throw new Error('Tenant code cannot exceed 50 characters');
    }

    // 验证字符格式：只能包含字母、数字、下划线和连字符
    const validFormat = /^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/;
    if (!validFormat.test(value)) {
      throw new Error('Tenant code must start with a letter and contain only letters, numbers, underscores, and hyphens');
    }

    // 验证不能包含连续的下划线或连字符
    if (value.includes('__') || value.includes('--') || value.includes('_-') || value.includes('-_')) {
      throw new Error('Tenant code cannot contain consecutive underscores or hyphens');
    }

    // 验证不能以连字符或下划线结尾
    if (value.endsWith('-') || value.endsWith('_')) {
      throw new Error('Tenant code cannot end with a hyphen or underscore');
    }

    return true;
  }

  /**
   * @method isSystemCode
   * @description 判断是否为系统租户代码
   * @returns boolean
   */
  isSystemCode(): boolean {
    return this.value === 'SYSTEM';
  }

  /**
   * @method toUpperCase
   * @description 转换为大写形式
   * @returns TenantCode
   */
  toUpperCase(): TenantCode {
    return new TenantCode(this.value.toUpperCase());
  }

  /**
   * @method toLowerCase
   * @description 转换为小写形式
   * @returns TenantCode
   */
  toLowerCase(): TenantCode {
    return new TenantCode(this.value.toLowerCase());
  }
}
