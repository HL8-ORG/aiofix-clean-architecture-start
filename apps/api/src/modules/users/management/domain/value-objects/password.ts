import * as bcrypt from 'bcrypt';
import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class Password
 * @description 密码值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 * 
 * 业务规则：
 * - 密码长度8-128字符
 * - 密码必须包含字母和数字
 * - 密码不能包含常见弱密码
 * - 密码使用bcrypt加密存储
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保密码符合安全要求
 * 3. 提供工厂方法create和fromHashed，支持明文和密文创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class Password extends StringValueObject {
  private readonly _hashedValue: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 密码值
   * @param isHashed 是否为已加密的密码
   */
  private constructor(value: string, isHashed: boolean = false) {
    if (isHashed) {
      super(''); // 传递空字符串给基类，因为我们不存储明文
      this._hashedValue = value;
    } else {
      super(value); // 传递明文给基类进行验证
      this._hashedValue = this.hashPassword(value);
    }
  }

  /**
   * @method create
   * @description 创建密码的工厂方法
   * @param value 密码值
   * @returns Password
   */
  static create(value: string): Password {
    return new Password(value);
  }

  /**
   * @method fromHashed
   * @description 从已加密的密码创建实例
   * @param hashedValue 已加密的密码
   * @returns Password
   */
  static fromHashed(hashedValue: string): Password {
    return new Password(hashedValue, true);
  }

  /**
   * @protected isValidValue
   * @description 验证密码的有效性
   * @param value 密码值
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (value.length > 128) {
      throw new Error('Password cannot exceed 128 characters');
    }

    // 验证密码复杂度
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    if (!hasLetter) {
      throw new Error('Password must contain at least one letter');
    }

    if (!hasDigit) {
      throw new Error('Password must contain at least one digit');
    }

    // 验证不能包含常见弱密码
    const weakPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '123456789', '1234567890', '12345678901', '123456789012'
    ];

    if (weakPasswords.includes(value.toLowerCase())) {
      throw new Error('Password is too weak and cannot be used');
    }

    // 验证不能包含连续字符
    if (this.hasConsecutiveChars(value)) {
      throw new Error('Password cannot contain consecutive characters');
    }

    // 验证不能包含重复字符
    if (this.hasRepeatedChars(value)) {
      throw new Error('Password cannot contain repeated characters');
    }

    return true;
  }

  /**
   * @method hasConsecutiveChars
   * @description 检查是否包含连续字符
   * @param value 密码值
   * @returns boolean
   */
  private hasConsecutiveChars(value: string): boolean {
    for (let i = 0; i < value.length - 2; i++) {
      const char1 = value.charCodeAt(i);
      const char2 = value.charCodeAt(i + 1);
      const char3 = value.charCodeAt(i + 2);

      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * @method hasRepeatedChars
   * @description 检查是否包含重复字符
   * @param value 密码值
   * @returns boolean
   */
  private hasRepeatedChars(value: string): boolean {
    for (let i = 0; i < value.length - 2; i++) {
      const char = value[i];
      if (char === value[i + 1] && char === value[i + 2]) {
        return true;
      }
    }
    return false;
  }

  /**
   * @method hashPassword
   * @description 使用bcrypt加密密码
   * @param password 原始密码
   * @returns string 加密后的密码
   */
  private hashPassword(password: string): string {
    const saltRounds = 12; // 推荐的安全轮数
    return bcrypt.hashSync(password, saltRounds);
  }

  /**
   * @method verify
   * @description 验证密码是否正确
   * @param plainPassword 明文密码
   * @returns boolean
   */
  verify(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this._hashedValue);
  }

  /**
   * @method equals
   * @description 比较两个密码是否相等
   * @param other 另一个密码
   * @returns boolean
   */
  equals(other: Password): boolean {
    if (!other) return false;
    return this._hashedValue === other._hashedValue;
  }

  /**
   * @method toString
   * @description 转换为字符串（返回加密后的值）
   * @returns string
   */
  toString(): string {
    return this._hashedValue;
  }

  /**
   * @method getHashedValue
   * @description 获取加密后的密码值
   * @returns string
   */
  getHashedValue(): string {
    return this._hashedValue;
  }

  /**
   * @method getPlainValue
   * @description 获取明文密码值（仅用于创建时）
   * @returns string
   */
  getPlainValue(): string {
    return this.value;
  }

  /**
   * @method isHashed
   * @description 判断是否为已加密的密码
   * @returns boolean
   */
  isHashed(): boolean {
    return this.value === '';
  }

  /**
   * @method getStrength
   * @description 获取密码强度评分
   * @returns number 0-100的强度评分
   */
  getStrength(): number {
    if (this.isHashed()) {
      return 0; // 无法评估已加密密码的强度
    }

    let score = 0;
    const password = this.value;

    // 长度评分
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 字符类型评分
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;

    // 复杂度评分
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    // 避免常见模式
    if (!this.hasConsecutiveChars(password)) score += 10;
    if (!this.hasRepeatedChars(password)) score += 10;

    return Math.min(score, 100);
  }

  /**
   * @method getStrengthLevel
   * @description 获取密码强度等级
   * @returns string 强度等级描述
   */
  getStrengthLevel(): string {
    const strength = this.getStrength();

    if (strength >= 80) return 'Very Strong';
    if (strength >= 60) return 'Strong';
    if (strength >= 40) return 'Medium';
    if (strength >= 20) return 'Weak';
    return 'Very Weak';
  }
}
