import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationValidator } from './configuration-validator';
import { z } from 'zod';

describe('ConfigurationValidator', () => {
  let validator: ConfigurationValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigurationValidator],
    }).compile();

    validator = module.get<ConfigurationValidator>(ConfigurationValidator);
  });

  describe('validate', () => {
    it('should validate string successfully', async () => {
      const schema = {
        schema: z.string().min(3).max(10),
        description: 'Test string schema',
      };

      const result = await validator.validate('testKey', 'hello', schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedValue).toBe('hello');
    });

    it('should fail validation for invalid string', async () => {
      const schema = {
        schema: z.string().min(3).max(10),
        description: 'Test string schema',
      };

      const result = await validator.validate('testKey', 'hi', schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('>=3');
    });

    it('should validate number successfully', async () => {
      const schema = {
        schema: z.number().min(1).max(100),
        description: 'Test number schema',
      };

      const result = await validator.validate('testKey', 50, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedValue).toBe(50);
    });

    it('should validate boolean successfully', async () => {
      const schema = {
        schema: z.boolean(),
        description: 'Test boolean schema',
      };

      const result = await validator.validate('testKey', true, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedValue).toBe(true);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple configs successfully', async () => {
      const schemas = {
        name: {
          schema: z.string().min(2),
          description: 'Name schema',
        },
        age: {
          schema: z.number().min(0).max(150),
          description: 'Age schema',
        },
        active: {
          schema: z.boolean(),
          description: 'Active schema',
        },
      };

      const configs = {
        name: 'John',
        age: 30,
        active: true,
      };

      const result = await validator.validateBatch(configs, schemas);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedValue).toEqual(configs);
    });

    it('should fail batch validation with multiple errors', async () => {
      const schemas = {
        name: {
          schema: z.string().min(2),
          description: 'Name schema',
        },
        age: {
          schema: z.number().min(0).max(150),
          description: 'Age schema',
        },
      };

      const configs = {
        name: 'A', // Too short
        age: 200, // Too high
      };

      const result = await validator.validateBatch(configs, schemas);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createStringSchema', () => {
    it('should create string schema with options', () => {
      const schema = validator.createStringSchema({
        required: true,
        minLength: 3,
        maxLength: 10,
        email: true,
      });

      expect(schema.schema).toBeDefined();
      expect(schema.description).toBe('String validation schema');
    });
  });

  describe('createNumberSchema', () => {
    it('should create number schema with options', () => {
      const schema = validator.createNumberSchema({
        required: true,
        min: 0,
        max: 100,
        int: true,
      });

      expect(schema.schema).toBeDefined();
      expect(schema.description).toBe('Number validation schema');
    });
  });

  describe('createBooleanSchema', () => {
    it('should create boolean schema with options', () => {
      const schema = validator.createBooleanSchema({
        required: true,
        default: false,
      });

      expect(schema.schema).toBeDefined();
      expect(schema.description).toBe('Boolean validation schema');
    });
  });

  describe('createArraySchema', () => {
    it('should create array schema with options', () => {
      const schema = validator.createArraySchema({
        required: true,
        minLength: 1,
        maxLength: 10,
        itemSchema: z.string(),
      });

      expect(schema.schema).toBeDefined();
      expect(schema.description).toBe('Array validation schema');
    });
  });

  describe('createObjectSchema', () => {
    it('should create object schema with options', () => {
      const schema = validator.createObjectSchema({
        required: true,
        shape: {
          name: z.string(),
          age: z.number(),
        },
        strict: true,
      });

      expect(schema.schema).toBeDefined();
      expect(schema.description).toBe('Object validation schema');
    });
  });

  describe('custom rules', () => {
    it('should add and get custom rule', () => {
      const rule = {
        name: 'testRule',
        validate: async (key: string, value: any) => ({
          isValid: true,
          error: null,
        }),
      };

      validator.addRule('testRule', rule);
      const retrievedRule = validator.getRule('testRule');

      expect(retrievedRule).toBe(rule);
    });

    it('should list custom rules', () => {
      const rule1 = {
        name: 'rule1',
        validate: async (key: string, value: any) => ({
          isValid: true,
          error: null,
        }),
      };

      const rule2 = {
        name: 'rule2',
        validate: async (key: string, value: any) => ({
          isValid: true,
          error: null,
        }),
      };

      validator.addRule('rule1', rule1);
      validator.addRule('rule2', rule2);

      const rules = validator.listRules();
      expect(rules).toContain('rule1');
      expect(rules).toContain('rule2');
    });

    it('should remove custom rule', () => {
      const rule = {
        name: 'testRule',
        validate: async (key: string, value: any) => ({
          isValid: true,
          error: null,
        }),
      };

      validator.addRule('testRule', rule);
      expect(validator.getRule('testRule')).toBe(rule);

      validator.removeRule('testRule');
      expect(validator.getRule('testRule')).toBeNull();
    });
  });
});
