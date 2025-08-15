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
 */
export class TenantName {
  private readonly _value: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 租户名称值
   */
  constructor(value: string) {
    this.validate(value);
    this._value = this.normalize(value);
  }

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
   * @method validate
   * @description 验证租户名称的有效性
   * @param value 租户名称值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
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
  }

  /**
   * @method normalize
   * @description 标准化租户名称
   * @param value 原始值
   * @returns string 标准化后的值
   */
  private normalize(value: string): string {
    // 去除首尾空格
    let normalized = value.trim();

    // 将多个连续空格替换为单个空格
    normalized = normalized.replace(/\s+/g, ' ');

    // 首字母大写
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return normalized;
  }

  /**
   * @method equals
   * @description 比较两个租户名称是否相等
   * @param other 另一个租户名称
   * @returns boolean
   */
  equals(other: TenantName): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * @method toString
   * @description 转换为字符串
   * @returns string
   */
  toString(): string {
    return this._value;
  }

  /**
   * @method value
   * @description 获取租户名称值
   * @returns string
   */
  get value(): string {
    return this._value;
  }

  /**
   * @method toUpperCase
   * @description 转换为大写形式
   * @returns string
   */
  toUpperCase(): string {
    return this._value.toUpperCase();
  }

  /**
   * @method toLowerCase
   * @description 转换为小写形式
   * @returns string
   */
  toLowerCase(): string {
    return this._value.toLowerCase();
  }

  /**
   * @method getInitials
   * @description 获取租户名称的首字母缩写
   * @returns string
   */
  getInitials(): string {
    return this._value
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
    return this._value.split(' ').length;
  }
}
