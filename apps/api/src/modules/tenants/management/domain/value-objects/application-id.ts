import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class ApplicationId
 * @description 申请ID值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 * 
 * 主要原理与机制如下：
 * 1. 继承StringValueObject基类，获得字符串值对象的通用功能
 * 2. 实现自定义的验证逻辑，确保申请ID符合UUID格式
 * 3. 提供工厂方法create，简化对象创建
 * 4. 支持值对象的不可变性和相等性比较
 */
export class ApplicationId extends StringValueObject {

  /**
   * @method create
   * @description 创建申请ID的工厂方法
   * @param value 申请ID值
   * @returns ApplicationId
   */
  static create(value: string): ApplicationId {
    return new ApplicationId(value);
  }

  /**
   * @protected isValidValue
   * @description 验证申请ID的有效性
   * @param value 申请ID值
   * @returns boolean 是否有效
   * @throws Error 当值无效时抛出异常
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error('Application ID cannot be empty');
    }

    if (value.length > 255) {
      throw new Error('Application ID cannot exceed 255 characters');
    }

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Application ID must be a valid UUID');
    }

    return true;
  }
}
