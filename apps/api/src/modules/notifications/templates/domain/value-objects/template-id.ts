import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class TemplateId
 * @description
 * 通知模板ID值对象，用于唯一标识系统中的通知模板。
 * 
 * 主要功能与职责：
 * 1. 封装模板ID的字符串值，确保类型安全
 * 2. 提供模板ID的验证逻辑，确保格式正确
 * 3. 继承StringValueObject基类，获得通用的字符串值对象功能
 * 4. 支持模板ID的比较、序列化等操作
 * 
 * 业务规则：
 * - 模板ID必须为非空字符串
 * - 模板ID长度必须在1-255个字符之间
 * - 模板ID只能包含字母、数字、连字符和下划线
 * - 模板ID在租户内必须唯一
 * 
 * @extends StringValueObject
 */
export class TemplateId extends StringValueObject {
  /**
   * @constructor
   * @param value 模板ID的字符串值
   * @throws {Error} 当模板ID格式不正确时抛出异常
   */
  constructor(value: string) {
    super(value);
  }

  /**
   * @protected isValidValue
   * @description 检查模板ID值是否有效
   * @param value 要检查的模板ID值
   * @returns 是否有效
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 255) {
      return false;
    }

    // 只允许字母、数字、连字符和下划线
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(value);
  }

  /**
   * @method toString
   * @description 将模板ID转换为字符串
   * @returns {string} 模板ID的字符串表示
   */
  toString(): string {
    return this.value;
  }
}
