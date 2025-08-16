import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class Username
 * @description 用户名字值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 * 
 * 业务规则：
 * - 用户名必须全局唯一
 * - 用户名长度2-20字符
 * - 只能包含字母、数字、下划线
 * - 不能以数字开头
 * - 不能包含连续下划线
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保用户名符合命名规范
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class Username extends StringValueObject {

  /**
   * @method create
   * @description 创建用户名的工厂方法
   * @param value 用户名
   * @returns Username
   */
  static create(value: string): Username {
    return new Username(value);
  }

  /**
   * @protected isValidValue
   * @description 验证用户名的有效性
   * @param value 用户名
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (value.length < 2) {
      throw new Error('Username must be at least 2 characters long');
    }

    if (value.length > 20) {
      throw new Error('Username cannot exceed 20 characters');
    }

    // 验证用户名格式：字母、数字、下划线，不能以数字开头
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!usernameRegex.test(value)) {
      throw new Error('Username must start with a letter and can only contain letters, numbers, and underscores');
    }

    // 验证不能包含连续下划线
    if (value.includes('__')) {
      throw new Error('Username cannot contain consecutive underscores');
    }

    // 验证不能以下划线结尾
    if (value.endsWith('_')) {
      throw new Error('Username cannot end with an underscore');
    }

    // 验证不能是保留用户名
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'guest', 'test',
      'user', 'users', 'account', 'accounts', 'profile', 'settings',
      'login', 'logout', 'register', 'signup', 'signin', 'password',
      'email', 'mail', 'support', 'help', 'info', 'contact'
    ];

    if (reservedUsernames.includes(value.toLowerCase())) {
      throw new Error('Username is reserved and cannot be used');
    }

    return true;
  }

  /**
   * @protected transformValue
   * @description 转换用户名值（转换为小写并去除首尾空格）
   * @param value 原始用户名值
   * @returns 转换后的用户名值
   */
  protected transformValue(value: string): string {
    return value.toLowerCase().trim();
  }

  /**
   * @method toUpperCase
   * @description 转换为大写
   * @returns Username
   */
  toUpperCase(): Username {
    return new Username(this.value.toUpperCase());
  }

  /**
   * @method toLowerCase
   * @description 转换为小写
   * @returns Username
   */
  toLowerCase(): Username {
    return new Username(this.value.toLowerCase());
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称（首字母大写）
   * @returns string
   */
  getDisplayName(): string {
    return this.value.charAt(0).toUpperCase() + this.value.slice(1);
  }

  /**
   * @method isReserved
   * @description 判断是否为保留用户名
   * @returns boolean
   */
  isReserved(): boolean {
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'guest', 'test',
      'user', 'users', 'account', 'accounts', 'profile', 'settings',
      'login', 'logout', 'register', 'signup', 'signin', 'password',
      'email', 'mail', 'support', 'help', 'info', 'contact'
    ];
    return reservedUsernames.includes(this.value.toLowerCase());
  }
}
