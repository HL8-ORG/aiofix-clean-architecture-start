import { IEntity } from '@/shared/domain/entities/base.entity';
import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class VariableName
 * @description 变量名称值对象
 */
export class VariableName extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 100) {
      return false;
    }

    // 只允许字母、数字、下划线，且必须以字母开头
    const validPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return validPattern.test(value);
  }
}

/**
 * @class VariableDescription
 * @description 变量描述值对象
 */
export class VariableDescription extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    return value.length <= 500;
  }
}

/**
 * @class VariableDefaultValue
 * @description 变量默认值对象
 */
export class VariableDefaultValue extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    // 默认值可以为空字符串
    return value.length <= 1000;
  }
}

/**
 * @enum VariableTypeEnum
 * @description 变量类型枚举
 */
export enum VariableTypeEnum {
  STRING = 'STRING',           // 字符串类型
  NUMBER = 'NUMBER',           // 数字类型
  DATE = 'DATE',               // 日期类型
  BOOLEAN = 'BOOLEAN',         // 布尔类型
  EMAIL = 'EMAIL',             // 邮箱类型
  URL = 'URL',                 // URL类型
  PHONE = 'PHONE',             // 电话号码类型
  CURRENCY = 'CURRENCY',       // 货币类型
  PERCENTAGE = 'PERCENTAGE',   // 百分比类型
  CUSTOM = 'CUSTOM'            // 自定义类型
}

/**
 * @class VariableType
 * @description 变量类型值对象
 */
export class VariableType extends StringValueObject {
  constructor(value: VariableTypeEnum) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    return Object.values(VariableTypeEnum).includes(value as VariableTypeEnum);
  }

  /**
   * @method isString
   * @description 检查是否为字符串类型
   * @returns {boolean} 是否为字符串类型
   */
  isString(): boolean {
    return this.value === VariableTypeEnum.STRING;
  }

  /**
   * @method isNumber
   * @description 检查是否为数字类型
   * @returns {boolean} 是否为数字类型
   */
  isNumber(): boolean {
    return this.value === VariableTypeEnum.NUMBER;
  }

  /**
   * @method isDate
   * @description 检查是否为日期类型
   * @returns {boolean} 是否为日期类型
   */
  isDate(): boolean {
    return this.value === VariableTypeEnum.DATE;
  }

  /**
   * @method isBoolean
   * @description 检查是否为布尔类型
   * @returns {boolean} 是否为布尔类型
   */
  isBoolean(): boolean {
    return this.value === VariableTypeEnum.BOOLEAN;
  }

  /**
   * @method isEmail
   * @description 检查是否为邮箱类型
   * @returns {boolean} 是否为邮箱类型
   */
  isEmail(): boolean {
    return this.value === VariableTypeEnum.EMAIL;
  }

  /**
   * @method isUrl
   * @description 检查是否为URL类型
   * @returns {boolean} 是否为URL类型
   */
  isUrl(): boolean {
    return this.value === VariableTypeEnum.URL;
  }

  /**
   * @method isPhone
   * @description 检查是否为电话号码类型
   * @returns {boolean} 是否为电话号码类型
   */
  isPhone(): boolean {
    return this.value === VariableTypeEnum.PHONE;
  }

  /**
   * @method isCurrency
   * @description 检查是否为货币类型
   * @returns {boolean} 是否为货币类型
   */
  isCurrency(): boolean {
    return this.value === VariableTypeEnum.CURRENCY;
  }

  /**
   * @method isPercentage
   * @description 检查是否为百分比类型
   * @returns {boolean} 是否为百分比类型
   */
  isPercentage(): boolean {
    return this.value === VariableTypeEnum.PERCENTAGE;
  }

  /**
   * @method isCustom
   * @description 检查是否为自定义类型
   * @returns {boolean} 是否为自定义类型
   */
  isCustom(): boolean {
    return this.value === VariableTypeEnum.CUSTOM;
  }

  /**
   * @method getValidationPattern
   * @description 获取验证模式
   * @returns {string} 验证模式
   */
  getValidationPattern(): string {
    const patterns: Record<VariableTypeEnum, string> = {
      [VariableTypeEnum.STRING]: '.*',
      [VariableTypeEnum.NUMBER]: '^[0-9]+(\.[0-9]+)?$',
      [VariableTypeEnum.DATE]: '^\\d{4}-\\d{2}-\\d{2}$',
      [VariableTypeEnum.BOOLEAN]: '^(true|false)$',
      [VariableTypeEnum.EMAIL]: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      [VariableTypeEnum.URL]: '^https?://.*',
      [VariableTypeEnum.PHONE]: '^[+]?[0-9\\s\\-()]+$',
      [VariableTypeEnum.CURRENCY]: '^[0-9]+(\.[0-9]{2})?$',
      [VariableTypeEnum.PERCENTAGE]: '^[0-9]+(\.[0-9]+)?%?$',
      [VariableTypeEnum.CUSTOM]: '.*'
    };

    return patterns[this.value as VariableTypeEnum];
  }
}

/**
 * @class TemplateVariable
 * @description
 * 模板变量实体，用于表示通知模板中的变量。
 * 
 * 主要功能与职责：
 * 1. 定义模板变量的基本属性（名称、描述、类型、默认值等）
 * 2. 提供变量验证和格式化功能
 * 3. 支持变量的必填性检查和默认值处理
 * 4. 提供变量的元数据信息
 * 
 * 业务规则：
 * - 变量名称必须唯一且符合命名规范
 * - 变量类型决定了验证规则和格式化方式
 * - 必填变量不能有默认值
 * - 变量描述用于帮助用户理解变量用途
 * 
 * @extends Entity
 */
export class TemplateVariable {
  constructor(
    public readonly name: VariableName,
    public readonly description: VariableDescription,
    public readonly type: VariableType,
    public readonly isRequired: boolean = false,
    public readonly defaultValue?: VariableDefaultValue,
    public readonly validationPattern?: string,
    public readonly metadata?: Record<string, any>
  ) { }

  /**
   * @method validateValue
   * @description 验证变量值
   * @param value 要验证的值
   * @returns {boolean} 是否有效
   */
  validateValue(value: any): boolean {
    if (this.isRequired && (value === null || value === undefined || value === '')) {
      return false;
    }

    if (value === null || value === undefined) {
      return true; // 非必填字段可以为空
    }

    const stringValue = String(value);

    // 使用类型特定的验证模式
    const pattern = this.validationPattern || this.type.getValidationPattern();
    const regex = new RegExp(pattern);

    return regex.test(stringValue);
  }

  /**
   * @method formatValue
   * @description 格式化变量值
   * @param value 要格式化的值
   * @returns {string} 格式化后的值
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return this.defaultValue?.value || '';
    }

    const stringValue = String(value);

    // 根据类型进行格式化
    if (this.type.isDate()) {
      return this.formatDate(stringValue);
    } else if (this.type.isCurrency()) {
      return this.formatCurrency(stringValue);
    } else if (this.type.isPercentage()) {
      return this.formatPercentage(stringValue);
    } else if (this.type.isNumber()) {
      return this.formatNumber(stringValue);
    }

    return stringValue;
  }

  /**
   * @private formatDate
   * @description 格式化日期
   * @param value 日期值
   * @returns {string} 格式化后的日期
   */
  private formatDate(value: string): string {
    try {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    } catch {
      return value;
    }
  }

  /**
   * @private formatCurrency
   * @description 格式化货币
   * @param value 货币值
   * @returns {string} 格式化后的货币
   */
  private formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return value;
    }
    return num.toFixed(2);
  }

  /**
   * @private formatPercentage
   * @description 格式化百分比
   * @param value 百分比值
   * @returns {string} 格式化后的百分比
   */
  private formatPercentage(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return value;
    }
    return `${num.toFixed(2)}%`;
  }

  /**
   * @private formatNumber
   * @description 格式化数字
   * @param value 数字值
   * @returns {string} 格式化后的数字
   */
  private formatNumber(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return value;
    }
    return num.toString();
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return this.name.value;
  }

  /**
   * @method getTypeDisplayName
   * @description 获取类型显示名称
   * @returns {string} 类型显示名称
   */
  getTypeDisplayName(): string {
    const typeNames: Record<VariableTypeEnum, string> = {
      [VariableTypeEnum.STRING]: '字符串',
      [VariableTypeEnum.NUMBER]: '数字',
      [VariableTypeEnum.DATE]: '日期',
      [VariableTypeEnum.BOOLEAN]: '布尔值',
      [VariableTypeEnum.EMAIL]: '邮箱',
      [VariableTypeEnum.URL]: 'URL',
      [VariableTypeEnum.PHONE]: '电话号码',
      [VariableTypeEnum.CURRENCY]: '货币',
      [VariableTypeEnum.PERCENTAGE]: '百分比',
      [VariableTypeEnum.CUSTOM]: '自定义'
    };

    return typeNames[this.type.value as VariableTypeEnum];
  }

  /**
   * @method toPlainObject
   * @description 转换为普通对象
   * @returns {object} 普通对象
   */
  toPlainObject(): Record<string, any> {
    return {
      name: this.name.value,
      description: this.description.value,
      type: this.type.value,
      isRequired: this.isRequired,
      defaultValue: this.defaultValue?.value,
      validationPattern: this.validationPattern,
      metadata: this.metadata,
      displayName: this.getDisplayName(),
      typeDisplayName: this.getTypeDisplayName()
    };
  }
}
