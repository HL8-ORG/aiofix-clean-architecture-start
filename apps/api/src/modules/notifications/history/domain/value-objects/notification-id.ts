import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class NotificationId
 * @description
 * 通知ID值对象，用于唯一标识系统中的通知实体。
 * 
 * 主要功能与职责：
 * 1. 封装通知ID的字符串值，确保类型安全
 * 2. 提供通知ID的验证逻辑，确保格式正确
 * 3. 继承StringValueObject基类，获得通用的字符串值对象功能
 * 4. 支持通知ID的比较、序列化等操作
 * 
 * 业务规则：
 * - 通知ID必须为非空字符串
 * - 通知ID长度必须在1-255个字符之间
 * - 通知ID只能包含字母、数字、连字符和下划线
 * 
 * @extends StringValueObject
 */
export class NotificationId extends StringValueObject {
  /**
   * @constructor
   * @param value 通知ID的字符串值
   * @throws {Error} 当通知ID格式不正确时抛出异常
   */
  constructor(value: string) {
    super(value);
  }

  /**
   * @protected isValidValue
   * @description 检查通知ID值是否有效
   * @param value 要检查的通知ID值
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
   * @description 将通知ID转换为字符串
   * @returns {string} 通知ID的字符串表示
   */
  toString(): string {
    return this.value;
  }
}
