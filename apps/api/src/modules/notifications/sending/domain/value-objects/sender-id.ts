import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class SenderId
 * @description
 * 通知发送者ID值对象，用于唯一标识通知发送者。
 * 
 * 主要功能与职责：
 * 1. 提供发送者的唯一标识符
 * 2. 确保ID的格式和有效性
 * 3. 支持ID的比较和相等性检查
 * 
 * 业务规则：
 * - 发送者ID必须唯一
 * - ID格式必须符合UUID v4标准
 * - ID不能为空或无效值
 * 
 * @extends StringValueObject
 */
export class SenderId extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  /**
   * @protected isValidValue
   * @description 验证发送者ID的有效性
   * @param value 要验证的ID值
   * @returns {boolean} 是否有效
   */
  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    // 验证UUID v4格式
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Pattern.test(value);
  }

  /**
   * @method toString
   * @description 转换为字符串
   * @returns {string} 字符串形式的ID
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method equals
   * @description 比较两个发送者ID是否相等
   * @param other 另一个发送者ID
   * @returns {boolean} 是否相等
   */
  equals(other: SenderId): boolean {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  }
}
