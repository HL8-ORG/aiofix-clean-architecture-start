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
 */
export class TenantCode {
  private readonly _value: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 租户代码值
   */
  constructor(value: string) {
    this.validate(value);
    this._value = value; // 保持原始大小写
  }

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
   * @method validate
   * @description 验证租户代码的有效性
   * @param value 租户代码值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
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
  }

  /**
   * @method equals
   * @description 比较两个租户代码是否相等
   * @param other 另一个租户代码
   * @returns boolean
   */
  equals(other: TenantCode): boolean {
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
   * @description 获取租户代码值
   * @returns string
   */
  get value(): string {
    return this._value;
  }

  /**
   * @method isSystemCode
   * @description 判断是否为系统租户代码
   * @returns boolean
   */
  isSystemCode(): boolean {
    return this._value === 'SYSTEM';
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
}
