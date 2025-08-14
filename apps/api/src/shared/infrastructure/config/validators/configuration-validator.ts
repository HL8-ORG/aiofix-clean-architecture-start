import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  IConfigurationValidator,
  ValidationRule,
  ValidationSchema,
  ValidationContext,
  ValidationError,
  ValidationResult,
} from '../interfaces/configuration-validator.interface';

/**
 * @class ConfigurationValidator
 * @description
 * 基于Zod的配置验证器实现类，提供强大的配置项验证功能。
 * 
 * 主要功能包括：
 * 1. 利用Zod的强大验证能力（类型、范围、格式、自定义规则等）
 * 2. 支持自定义验证规则和扩展
 * 3. 提供验证上下文和详细的错误信息
 * 4. 支持批量验证和单次验证
 * 5. 支持异步验证和条件验证
 * 6. 提供完整的TypeScript类型安全
 * 
 * @implements {IConfigurationValidator}
 */
@Injectable()
export class ConfigurationValidator implements IConfigurationValidator {
  private readonly customRules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.initializeCustomRules();
  }

  /**
   * @method validate
   * @description 验证单个配置项
   * @param key 配置键
   * @param value 配置值
   * @param schema 验证模式
   * @param context 验证上下文
   * @returns {ValidationResult} 验证结果
   */
  async validate(
    key: string,
    value: any,
    schema: ValidationSchema,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    try {
      // 执行Zod验证
      const validationResult = await schema.schema.parseAsync(value);

      // 应用自定义验证器
      if (schema.customValidators) {
        for (const validator of schema.customValidators) {
          const result = await validator(key, validationResult, context);
          if (!result.isValid && result.error) {
            return {
              isValid: false,
              errors: [result.error],
              validatedAt: new Date(),
              context,
            };
          }
        }
      }

      return {
        isValid: true,
        errors: [],
        validatedAt: new Date(),
        context,
        validatedValue: validationResult,
      };
    } catch (error) {
      // 转换Zod错误为我们的错误格式
      const errors = this.convertZodErrors(key, error);

      return {
        isValid: false,
        errors,
        validatedAt: new Date(),
        context,
      };
    }
  }

  /**
   * @method validateBatch
   * @description 批量验证多个配置项
   * @param configs 配置项映射
   * @param schemas 验证模式映射
   * @param context 验证上下文
   * @returns {ValidationResult} 验证结果
   */
  async validateBatch(
    configs: Record<string, any>,
    schemas: Record<string, ValidationSchema>,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];

    try {
      // 构建完整的Zod对象模式
      const shape: Record<string, z.ZodSchema> = {};
      for (const [key, schema] of Object.entries(schemas)) {
        shape[key] = schema.schema;
      }

      const objectSchema = z.object(shape);
      const validationResult = await objectSchema.parseAsync(configs);

      // 应用自定义验证器
      for (const [key, schema] of Object.entries(schemas)) {
        if (schema.customValidators) {
          for (const validator of schema.customValidators) {
            const result = await validator(key, validationResult[key], context);
            if (!result.isValid && result.error) {
              allErrors.push(result.error);
            }
          }
        }
      }

      if (allErrors.length > 0) {
        return {
          isValid: false,
          errors: allErrors,
          validatedAt: new Date(),
          context,
        };
      }

      return {
        isValid: true,
        errors: [],
        validatedAt: new Date(),
        context,
        validatedValue: validationResult,
      };
    } catch (error) {
      // 转换Zod错误
      const errors = this.convertZodErrors('batch_validation', error);

      return {
        isValid: false,
        errors,
        validatedAt: new Date(),
        context,
      };
    }
  }

  /**
   * @method createStringSchema
   * @description 创建字符串验证模式
   * @param options 验证选项
   * @returns {ValidationSchema} 验证模式
   */
  createStringSchema(options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    enum?: string[];
    default?: string;
  } = {}): ValidationSchema {
    let schema: any = z.string();

    if (options.minLength !== undefined) {
      schema = schema.min(options.minLength);
    }

    if (options.maxLength !== undefined) {
      schema = schema.max(options.maxLength);
    }

    if (options.pattern) {
      schema = schema.regex(options.pattern);
    }

    if (options.email) {
      schema = schema.email();
    }

    if (options.url) {
      schema = schema.url();
    }

    if (options.uuid) {
      schema = schema.uuid();
    }

    if (options.enum) {
      schema = z.enum(options.enum as [string, ...string[]]);
    }

    if (options.default !== undefined) {
      schema = schema.default(options.default);
    }

    if (!options.required) {
      schema = schema.optional();
    }

    return {
      schema,
      defaultValue: options.default,
      description: 'String validation schema',
    };
  }

  /**
   * @method createNumberSchema
   * @description 创建数字验证模式
   * @param options 验证选项
   * @returns {ValidationSchema} 验证模式
   */
  createNumberSchema(options: {
    required?: boolean;
    min?: number;
    max?: number;
    int?: boolean;
    positive?: boolean;
    negative?: boolean;
    enum?: number[];
    default?: number;
  } = {}): ValidationSchema {
    let schema: any = z.number();

    if (options.min !== undefined) {
      schema = schema.min(options.min);
    }

    if (options.max !== undefined) {
      schema = schema.max(options.max);
    }

    if (options.int) {
      schema = schema.int();
    }

    if (options.positive) {
      schema = schema.positive();
    }

    if (options.negative) {
      schema = schema.negative();
    }

    if (options.enum) {
      // 对于数字枚举，我们需要使用union
      const enumSchemas = options.enum.map(val => z.literal(val));
      schema = z.union(enumSchemas);
    }

    if (options.default !== undefined) {
      schema = schema.default(options.default);
    }

    if (!options.required) {
      schema = schema.optional();
    }

    return {
      schema,
      defaultValue: options.default,
      description: 'Number validation schema',
    };
  }

  /**
   * @method createBooleanSchema
   * @description 创建布尔验证模式
   * @param options 验证选项
   * @returns {ValidationSchema} 验证模式
   */
  createBooleanSchema(options: {
    required?: boolean;
    default?: boolean;
  } = {}): ValidationSchema {
    let schema: any = z.boolean();

    if (options.default !== undefined) {
      schema = schema.default(options.default);
    }

    if (!options.required) {
      schema = schema.optional();
    }

    return {
      schema,
      defaultValue: options.default,
      description: 'Boolean validation schema',
    };
  }

  /**
   * @method createArraySchema
   * @description 创建数组验证模式
   * @param options 验证选项
   * @returns {ValidationSchema} 验证模式
   */
  createArraySchema(options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemSchema?: z.ZodSchema;
    unique?: boolean;
    default?: any[];
  } = {}): ValidationSchema {
    let schema: any = z.array(options.itemSchema || z.any());

    if (options.minLength !== undefined) {
      schema = schema.min(options.minLength);
    }

    if (options.maxLength !== undefined) {
      schema = schema.max(options.maxLength);
    }

    if (options.unique) {
      schema = schema.refine(
        (arr) => arr.length === new Set(arr).size,
        'Array items must be unique'
      );
    }

    if (options.default !== undefined) {
      schema = schema.default(options.default);
    }

    if (!options.required) {
      schema = schema.optional();
    }

    return {
      schema,
      defaultValue: options.default,
      description: 'Array validation schema',
    };
  }

  /**
   * @method createObjectSchema
   * @description 创建对象验证模式
   * @param options 验证选项
   * @returns {ValidationSchema} 验证模式
   */
  createObjectSchema(options: {
    required?: boolean;
    shape?: Record<string, z.ZodSchema>;
    strict?: boolean;
    passthrough?: boolean;
    strip?: boolean;
    default?: Record<string, any>;
  } = {}): ValidationSchema {
    let schema: any = z.object(options.shape || {});

    if (options.strict) {
      schema = schema.strict();
    }

    if (options.passthrough) {
      schema = schema.passthrough();
    }

    if (options.strip) {
      schema = schema.strip();
    }

    if (options.default !== undefined) {
      schema = schema.default(options.default);
    }

    if (!options.required) {
      schema = schema.optional();
    }

    return {
      schema,
      defaultValue: options.default,
      description: 'Object validation schema',
    };
  }

  /**
   * @method addRule
   * @description 添加自定义验证规则
   * @param name 规则名称
   * @param rule 验证规则
   */
  addRule(name: string, rule: ValidationRule): void {
    this.customRules.set(name, rule);
  }

  /**
   * @method removeRule
   * @description 移除验证规则
   * @param name 规则名称
   */
  removeRule(name: string): void {
    this.customRules.delete(name);
  }

  /**
   * @method getRule
   * @description 获取验证规则
   * @param name 规则名称
   * @returns {ValidationRule | null} 验证规则
   */
  getRule(name: string): ValidationRule | null {
    return this.customRules.get(name) || null;
  }

  /**
   * @method listRules
   * @description 列出所有可用的自定义验证规则
   * @returns {string[]} 规则名称列表
   */
  listRules(): string[] {
    return Array.from(this.customRules.keys());
  }

  /**
   * @private
   * @method convertZodErrors
   * @description 转换Zod错误为我们的错误格式
   * @param key 配置键
   * @param error Zod错误
   * @returns {ValidationError[]} 转换后的错误数组
   */
  private convertZodErrors(key: string, error: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        const errorKey = issue.path.length > 0 ? issue.path.join('.') : key;
        errors.push({
          key: errorKey,
          message: issue.message,
          code: issue.code,
          severity: 'error',
          timestamp: new Date(),
          context: {
            path: issue.path,
          },
        });
      }
    } else {
      errors.push({
        key,
        message: error.message || '验证失败',
        code: 'VALIDATION_ERROR',
        severity: 'error',
        timestamp: new Date(),
      });
    }

    return errors;
  }

  /**
   * @private
   * @method initializeCustomRules
   * @description 初始化自定义验证规则
   */
  private initializeCustomRules(): void {
    // 这里可以添加一些项目特定的自定义验证规则
    // 例如：数据库连接字符串验证、JWT密钥验证等
  }
}
