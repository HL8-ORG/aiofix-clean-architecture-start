import type { ConfigValidationResult, ConfigKey } from './configuration.interface';
import { z } from 'zod';

/**
 * @interface ValidationRule
 * @description
 * 基于Zod的验证规则接口，定义配置验证的规则。
 */
export interface ValidationRule {
  /** 规则名称 */
  readonly name: string;
  /** 规则选项 */
  readonly options?: any;
  /** 自定义验证函数 */
  readonly validate?: (
    key: string,
    value: any,
    options?: any,
    context?: ValidationContext
  ) => Promise<{ isValid: boolean; error: ValidationError | null }>;
}

/**
 * @interface ValidationSchema
 * @description
 * 基于Zod的验证模式接口，定义配置的验证模式。
 */
export interface ValidationSchema {
  /** Zod模式 */
  readonly schema: z.ZodSchema;
  /** 自定义验证器 */
  readonly customValidators?: CustomValidator[];
  /** 默认值 */
  readonly defaultValue?: any;
  /** 描述 */
  readonly description?: string;
  /** 是否敏感信息 */
  readonly sensitive?: boolean;
}

/**
 * @interface CustomValidator
 * @description
 * 自定义验证器接口
 */
export interface CustomValidator {
  (
    key: string,
    value: any,
    context?: ValidationContext
  ): Promise<{ isValid: boolean; error: ValidationError | null }>;
}

/**
 * @interface ValidationContext
 * @description
 * 验证上下文接口，定义验证时的上下文信息。
 */
export interface ValidationContext {
  /** 当前配置值 */
  readonly currentValue?: any;
  /** 旧配置值 */
  readonly oldValue?: any;
  /** 配置作用域 */
  readonly scope?: string;
  /** 租户ID */
  readonly tenantId?: string;
  /** 用户ID */
  readonly userId?: string;
  /** 模块名 */
  readonly module?: string;
  /** 环境信息 */
  readonly environment?: string;
  /** 自定义上下文 */
  readonly custom?: Record<string, any>;
}

/**
 * @interface ValidationError
 * @description
 * 验证错误接口，定义验证错误的详细信息。
 */
export interface ValidationError {
  /** 配置键 */
  readonly key: string;
  /** 错误消息 */
  readonly message: string;
  /** 错误代码 */
  readonly code: string;
  /** 错误级别 */
  readonly severity: 'error' | 'warning' | 'info';
  /** 错误时间戳 */
  readonly timestamp: Date;
  /** 错误上下文 */
  readonly context?: any;
}

/**
 * @interface ValidationResult
 * @description
 * 验证结果接口，定义验证的详细结果。
 */
export interface ValidationResult {
  /** 是否有效 */
  readonly isValid: boolean;
  /** 错误列表 */
  readonly errors: ValidationError[];
  /** 验证时间 */
  readonly validatedAt: Date;
  /** 验证上下文 */
  readonly context?: ValidationContext;
  /** 验证后的值（可能被转换） */
  readonly validatedValue?: any;
}

/**
 * @interface IConfigurationValidator
 * @description
 * 基于Zod的配置验证器接口，定义配置验证的核心功能。
 * 
 * 主要职责：
 * 1. 利用Zod的强大验证能力进行配置验证
 * 2. 支持自定义验证规则和扩展
 * 3. 提供验证上下文和详细的错误信息
 * 4. 支持批量验证和单次验证
 * 5. 支持异步验证和条件验证
 * 6. 提供完整的TypeScript类型安全
 * 
 * 设计原则：
 * - 类型安全：确保配置值的类型正确
 * - 范围验证：验证配置值在有效范围内
 * - 格式验证：验证配置值的格式正确
 * - 可扩展：支持自定义验证规则
 * - 性能优化：高效的验证算法
 */
export interface IConfigurationValidator {
  /**
   * 验证单个配置项
   * 
   * @param key 配置键
   * @param value 配置值
   * @param schema 验证模式
   * @param context 验证上下文
   * @returns 验证结果
   */
  validate(
    key: string,
    value: any,
    schema: ValidationSchema,
    context?: ValidationContext
  ): Promise<ValidationResult>;

  /**
   * 批量验证多个配置项
   * 
   * @param configs 配置项映射
   * @param schemas 验证模式映射
   * @param context 验证上下文
   * @returns 验证结果
   */
  validateBatch(
    configs: Record<string, any>,
    schemas: Record<string, ValidationSchema>,
    context?: ValidationContext
  ): Promise<ValidationResult>;

  /**
   * 创建字符串验证模式
   * 
   * @param options 验证选项
   * @returns 验证模式
   */
  createStringSchema(options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    enum?: string[];
    default?: string;
  }): ValidationSchema;

  /**
   * 创建数字验证模式
   * 
   * @param options 验证选项
   * @returns 验证模式
   */
  createNumberSchema(options?: {
    required?: boolean;
    min?: number;
    max?: number;
    int?: boolean;
    positive?: boolean;
    negative?: boolean;
    enum?: number[];
    default?: number;
  }): ValidationSchema;

  /**
   * 创建布尔验证模式
   * 
   * @param options 验证选项
   * @returns 验证模式
   */
  createBooleanSchema(options?: {
    required?: boolean;
    default?: boolean;
  }): ValidationSchema;

  /**
   * 创建数组验证模式
   * 
   * @param options 验证选项
   * @returns 验证模式
   */
  createArraySchema(options?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemSchema?: z.ZodSchema;
    unique?: boolean;
    default?: any[];
  }): ValidationSchema;

  /**
   * 创建对象验证模式
   * 
   * @param options 验证选项
   * @returns 验证模式
   */
  createObjectSchema(options?: {
    required?: boolean;
    shape?: Record<string, z.ZodSchema>;
    strict?: boolean;
    passthrough?: boolean;
    strip?: boolean;
    default?: Record<string, any>;
  }): ValidationSchema;

  /**
   * 添加自定义验证规则
   * 
   * @param name 规则名称
   * @param rule 验证规则
   */
  addRule(name: string, rule: ValidationRule): void;

  /**
   * 移除验证规则
   * 
   * @param name 规则名称
   */
  removeRule(name: string): void;

  /**
   * 获取验证规则
   * 
   * @param name 规则名称
   * @returns 验证规则
   */
  getRule(name: string): ValidationRule | null;

  /**
   * 列出所有可用的自定义验证规则
   * 
   * @returns 规则名称列表
   */
  listRules(): string[];
}
