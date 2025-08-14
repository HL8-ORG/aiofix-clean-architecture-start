/**
 * @file base.value-object.ts
 * @description 值对象基础类
 * 
 * 该文件定义了所有值对象的基类，提供值对象的通用功能和属性。
 * 遵循DDD原则，值对象是不可变的，通过属性值判断相等性。
 * 
 * 主要功能：
 * 1. 提供值对象的不可变性
 * 2. 提供值对象的相等性比较
 * 3. 提供值对象的验证能力
 * 4. 提供值对象的序列化能力
 * 5. 提供值对象的克隆能力
 */

/**
 * @interface IValueObject
 * @description 值对象接口，定义值对象的基本契约
 */
export interface IValueObject<T = any> {
  /** 值对象的值 */
  readonly value: T;

  /** 获取值对象的值 */
  getValue(): T;
  /** 检查值对象是否相等 */
  equals(valueObject: IValueObject<T>): boolean;
  /** 验证值对象有效性 */
  validate(): boolean;
  /** 克隆值对象 */
  clone(): IValueObject<T>;
  /** 转换为字符串 */
  toString(): string;
  /** 转换为JSON */
  toJSON(): any;
}

/**
 * @abstract BaseValueObject
 * @description 值对象基础抽象类
 * 
 * 提供所有值对象的通用功能，包括：
 * - 不可变性保证
 * - 相等性比较
 * - 验证能力
 * - 序列化能力
 * - 克隆能力
 */
export abstract class BaseValueObject<T = any> implements IValueObject<T> {
  /** 值对象的值 */
  protected readonly _value: T;

  /**
   * @constructor
   * @param value 值对象的值
   */
  constructor(value: T) {
    this._value = this.validateAndTransform(value);
  }

  /**
   * @getter value
   * @description 获取值对象的值
   */
  get value(): T {
    return this._value;
  }

  /**
   * @method getValue
   * @description 获取值对象的值
   * @returns 值对象的值
   */
  getValue(): T {
    return this._value;
  }

  /**
   * @method equals
   * @description 检查值对象是否相等
   * @param valueObject 要比较的值对象
   * @returns 是否相等
   */
  equals(valueObject: IValueObject<T>): boolean {
    if (!valueObject) return false;
    if (this === valueObject) return true;
    if (this.constructor !== valueObject.constructor) return false;
    return this.compareValues(this._value, valueObject.value);
  }

  /**
   * @method validate
   * @description 验证值对象有效性
   * @returns 是否有效
   */
  validate(): boolean {
    return this.isValidValue(this._value);
  }

  /**
   * @method clone
   * @description 克隆值对象
   * @returns 新的值对象实例
   */
  clone(): IValueObject<T> {
    return new (this.constructor as any)(this._value);
  }

  /**
   * @method toString
   * @description 将值对象转换为字符串
   * @returns 字符串表示
   */
  toString(): string {
    return String(this._value);
  }

  /**
   * @method toJSON
   * @description 将值对象转换为JSON
   * @returns JSON表示
   */
  toJSON(): any {
    return this._value;
  }

  /**
   * @protected validateAndTransform
   * @description 验证并转换值
   * @param value 原始值
   * @returns 验证和转换后的值
   */
  protected validateAndTransform(value: T): T {
    if (!this.isValidValue(value)) {
      throw new Error(`Invalid value for ${this.constructor.name}: ${value}`);
    }
    return this.transformValue(value);
  }

  /**
   * @protected isValidValue
   * @description 检查值是否有效
   * @param value 要检查的值
   * @returns 是否有效
   */
  protected abstract isValidValue(value: T): boolean;

  /**
   * @protected transformValue
   * @description 转换值（如需要）
   * @param value 原始值
   * @returns 转换后的值
   */
  protected transformValue(value: T): T {
    return value;
  }

  /**
   * @protected compareValues
   * @description 比较两个值是否相等
   * @param value1 第一个值
   * @param value2 第二个值
   * @returns 是否相等
   */
  protected compareValues(value1: T, value2: T): boolean {
    return value1 === value2;
  }
}

/**
 * @class StringValueObject
 * @description 字符串值对象基类
 */
export abstract class StringValueObject extends BaseValueObject<string> {
  /**
   * @protected isValidValue
   * @description 检查字符串值是否有效
   * @param value 要检查的字符串值
   * @returns 是否有效
   */
  protected isValidValue(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * @protected transformValue
   * @description 转换字符串值（去除首尾空格）
   * @param value 原始字符串值
   * @returns 转换后的字符串值
   */
  protected transformValue(value: string): string {
    return value.trim();
  }

  /**
   * @method length
   * @description 获取字符串长度
   * @returns 字符串长度
   */
  length(): number {
    return this._value.length;
  }

  /**
   * @method isEmpty
   * @description 检查字符串是否为空
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this._value.length === 0;
  }

  /**
   * @method toUpperCase
   * @description 转换为大写
   * @returns 大写字符串值对象
   */
  toUpperCase(): StringValueObject {
    return new (this.constructor as any)(this._value.toUpperCase());
  }

  /**
   * @method toLowerCase
   * @description 转换为小写
   * @returns 小写字符串值对象
   */
  toLowerCase(): StringValueObject {
    return new (this.constructor as any)(this._value.toLowerCase());
  }
}

/**
 * @class NumberValueObject
 * @description 数字值对象基类
 */
export abstract class NumberValueObject extends BaseValueObject<number> {
  /**
   * @protected isValidValue
   * @description 检查数字值是否有效
   * @param value 要检查的数字值
   * @returns 是否有效
   */
  protected isValidValue(value: number): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * @method add
   * @description 加法运算
   * @param other 另一个数字值对象
   * @returns 新的数字值对象
   */
  add(other: NumberValueObject): NumberValueObject {
    return new (this.constructor as any)(this._value + other.value);
  }

  /**
   * @method subtract
   * @description 减法运算
   * @param other 另一个数字值对象
   * @returns 新的数字值对象
   */
  subtract(other: NumberValueObject): NumberValueObject {
    return new (this.constructor as any)(this._value - other.value);
  }

  /**
   * @method multiply
   * @description 乘法运算
   * @param other 另一个数字值对象
   * @returns 新的数字值对象
   */
  multiply(other: NumberValueObject): NumberValueObject {
    return new (this.constructor as any)(this._value * other.value);
  }

  /**
   * @method divide
   * @description 除法运算
   * @param other 另一个数字值对象
   * @returns 新的数字值对象
   */
  divide(other: NumberValueObject): NumberValueObject {
    if (other.value === 0) {
      throw new Error('Division by zero');
    }
    return new (this.constructor as any)(this._value / other.value);
  }

  /**
   * @method isPositive
   * @description 检查是否为正数
   * @returns 是否为正数
   */
  isPositive(): boolean {
    return this._value > 0;
  }

  /**
   * @method isNegative
   * @description 检查是否为负数
   * @returns 是否为负数
   */
  isNegative(): boolean {
    return this._value < 0;
  }

  /**
   * @method isZero
   * @description 检查是否为零
   * @returns 是否为零
   */
  isZero(): boolean {
    return this._value === 0;
  }
}

/**
 * @class BooleanValueObject
 * @description 布尔值对象基类
 */
export abstract class BooleanValueObject extends BaseValueObject<boolean> {
  /**
   * @protected isValidValue
   * @description 检查布尔值是否有效
   * @param value 要检查的布尔值
   * @returns 是否有效
   */
  protected isValidValue(value: boolean): boolean {
    return typeof value === 'boolean';
  }

  /**
   * @method and
   * @description 逻辑与运算
   * @param other 另一个布尔值对象
   * @returns 新的布尔值对象
   */
  and(other: BooleanValueObject): BooleanValueObject {
    return new (this.constructor as any)(this._value && other.value);
  }

  /**
   * @method or
   * @description 逻辑或运算
   * @param other 另一个布尔值对象
   * @returns 新的布尔值对象
   */
  or(other: BooleanValueObject): BooleanValueObject {
    return new (this.constructor as any)(this._value || other.value);
  }

  /**
   * @method not
   * @description 逻辑非运算
   * @returns 新的布尔值对象
   */
  not(): BooleanValueObject {
    return new (this.constructor as any)(!this._value);
  }

  /**
   * @method isTrue
   * @description 检查是否为真
   * @returns 是否为真
   */
  isTrue(): boolean {
    return this._value === true;
  }

  /**
   * @method isFalse
   * @description 检查是否为假
   * @returns 是否为假
   */
  isFalse(): boolean {
    return this._value === false;
  }
}
