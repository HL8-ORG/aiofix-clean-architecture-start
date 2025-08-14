import {
  DatabaseConfig,
  DatabaseType,
  DatabaseConfigFactory,
  ValidationResult,
  ConnectionTestResult
} from '../interfaces/database-config.interface';
import { PostgreSQLConfig } from '../configs/postgresql.config';
import { MongoDBConfig } from '../configs/mongodb.config';

/**
 * @class DatabaseConfigFactoryImpl
 * @description
 * 数据库配置工厂实现，用于创建和管理不同数据库类型的配置。
 * 
 * 主要功能：
 * 1. 根据数据库类型创建相应的配置对象
 * 2. 从环境变量自动创建配置
 * 3. 验证配置的有效性
 * 4. 支持配置的合并和覆盖
 * 
 * 使用示例：
 * ```typescript
 * const factory = new DatabaseConfigFactoryImpl();
 * 
 * // 创建PostgreSQL配置
 * const pgConfig = factory.createConfig(DatabaseType.POSTGRESQL, {
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'iam_system',
 *   username: 'postgres',
 *   password: 'password'
 * });
 * 
 * // 从环境变量创建配置
 * const envConfig = factory.createFromEnvironment(DatabaseType.MONGODB);
 * 
 * // 验证配置
 * const validation = factory.validateConfig(pgConfig);
 * if (!validation.isValid) {
 *   console.error('配置验证失败:', validation.errors);
 * }
 * ```
 */
export class DatabaseConfigFactoryImpl implements DatabaseConfigFactory {
  /**
   * 创建数据库配置
   * 
   * @param type 数据库类型
   * @param options 配置选项
   * @returns 数据库配置
   */
  createConfig(type: DatabaseType, options: Partial<DatabaseConfig>): DatabaseConfig {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConfig(options);

      case DatabaseType.MONGODB:
        return new MongoDBConfig(options);

      case DatabaseType.MYSQL:
        // TODO: 实现MySQL配置
        throw new Error('MySQL配置暂未实现');

      case DatabaseType.SQLITE:
        // TODO: 实现SQLite配置
        throw new Error('SQLite配置暂未实现');

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 从环境变量创建配置
   * 
   * @param type 数据库类型
   * @returns 数据库配置
   */
  createFromEnvironment(type: DatabaseType): DatabaseConfig {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return PostgreSQLConfig.fromEnvironment();

      case DatabaseType.MONGODB:
        return MongoDBConfig.fromEnvironment();

      case DatabaseType.MYSQL:
        // TODO: 实现MySQL环境变量配置
        throw new Error('MySQL环境变量配置暂未实现');

      case DatabaseType.SQLITE:
        // TODO: 实现SQLite环境变量配置
        throw new Error('SQLite环境变量配置暂未实现');

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 验证配置
   * 
   * @param config 数据库配置
   * @returns 验证结果
   */
  validateConfig(config: DatabaseConfig): ValidationResult {
    // 根据配置类型调用相应的验证方法
    if (config instanceof PostgreSQLConfig) {
      return config.validate();
    }

    if (config instanceof MongoDBConfig) {
      return config.validate();
    }

    // 通用验证
    return this.validateGenericConfig(config);
  }

  /**
   * 通用配置验证
   * 
   * @param config 数据库配置
   * @returns 验证结果
   */
  private validateGenericConfig(config: DatabaseConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证基本字段
    if (!config.host) {
      errors.push('数据库主机不能为空');
    }

    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('数据库端口必须在1-65535之间');
    }

    if (!config.database) {
      errors.push('数据库名称不能为空');
    }

    // 验证超时配置
    if (config.connectTimeout && config.connectTimeout < 1000) {
      warnings.push('连接超时时间过短，可能导致连接失败');
    }

    if (config.queryTimeout && config.queryTimeout < 1000) {
      warnings.push('查询超时时间过短，可能导致查询失败');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 测试数据库连接
   * 
   * @param config 数据库配置
   * @returns 连接测试结果
   */
  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 根据数据库类型进行连接测试
      switch (config.type) {
        case DatabaseType.POSTGRESQL:
          return await this.testPostgreSQLConnection(config as PostgreSQLConfig);

        case DatabaseType.MONGODB:
          return await this.testMongoDBConnection(config as MongoDBConfig);

        default:
          return {
            success: false,
            error: `不支持的数据库类型: ${config.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        connectionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 测试PostgreSQL连接
   * 
   * @param config PostgreSQL配置
   * @returns 连接测试结果
   */
  private async testPostgreSQLConnection(config: PostgreSQLConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 这里应该使用实际的PostgreSQL客户端进行连接测试
      // 暂时返回模拟结果
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟连接延迟

      return {
        success: true,
        connectionTime: Date.now() - startTime,
        version: 'PostgreSQL 14.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        connectionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 测试MongoDB连接
   * 
   * @param config MongoDB配置
   * @returns 连接测试结果
   */
  private async testMongoDBConnection(config: MongoDBConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 这里应该使用实际的MongoDB客户端进行连接测试
      // 暂时返回模拟结果
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟连接延迟

      return {
        success: true,
        connectionTime: Date.now() - startTime,
        version: 'MongoDB 6.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        connectionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 合并配置
   * 
   * @param baseConfig 基础配置
   * @param overrideConfig 覆盖配置
   * @returns 合并后的配置
   */
  mergeConfig(baseConfig: DatabaseConfig, overrideConfig: Partial<DatabaseConfig>): DatabaseConfig {
    // 确保类型一致（只有当overrideConfig明确指定了type时才检查）
    if (overrideConfig.type && baseConfig.type !== overrideConfig.type) {
      throw new Error('无法合并不同类型的数据库配置');
    }

    // 根据类型进行合并
    switch (baseConfig.type) {
      case DatabaseType.POSTGRESQL:
        return (baseConfig as PostgreSQLConfig).clone(overrideConfig);

      case DatabaseType.MONGODB:
        return (baseConfig as MongoDBConfig).clone(overrideConfig);

      default:
        throw new Error(`不支持的数据库类型: ${baseConfig.type}`);
    }
  }

  /**
   * 获取支持的数据库类型
   * 
   * @returns 支持的数据库类型列表
   */
  getSupportedDatabaseTypes(): DatabaseType[] {
    return [
      DatabaseType.POSTGRESQL,
      DatabaseType.MONGODB,
      // DatabaseType.MYSQL,    // 暂未实现
      // DatabaseType.SQLITE,   // 暂未实现
    ];
  }

  /**
   * 检查数据库类型是否支持
   * 
   * @param type 数据库类型
   * @returns 是否支持
   */
  isDatabaseTypeSupported(type: DatabaseType): boolean {
    return this.getSupportedDatabaseTypes().includes(type);
  }

  /**
   * 获取默认配置
   * 
   * @param type 数据库类型
   * @returns 默认配置
   */
  getDefaultConfig(type: DatabaseType): DatabaseConfig {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConfig({});

      case DatabaseType.MONGODB:
        return new MongoDBConfig({});

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }
}
