/**
 * @class TenantId
 * @description 租户ID值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 */
export class TenantId {
  private readonly _value: string;

  /**
   * @constructor
   * @description 构造函数，支持直接实例化
   * @param value 租户ID值
   */
  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * @method create
   * @description 创建租户ID的工厂方法
   * @param value 租户ID值
   * @returns TenantId
   */
  static create(value: string): TenantId {
    return new TenantId(value);
  }

  /**
   * @method validate
   * @description 验证租户ID的有效性
   * @param value 租户ID值
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Tenant ID cannot be empty');
    }

    if (value.length > 255) {
      throw new Error('Tenant ID cannot exceed 255 characters');
    }

    // 验证UUID格式（如果使用UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Tenant ID must be a valid UUID');
    }
  }

  /**
   * @method equals
   * @description 比较两个租户ID是否相等
   * @param other 另一个租户ID
   * @returns boolean
   */
  equals(other: TenantId): boolean {
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
   * @description 获取租户ID值
   * @returns string
   */
  get value(): string {
    return this._value;
  }
}
