/**
 * @file infrastructure/database.config.ts
 * @description 数据库配置文件
 * 
 * 核心职责：
 * 1. 管理数据库类型选择
 * 2. 提供数据库配置选项
 * 3. 支持环境变量配置
 * 4. 提供默认配置
 */

import { DatabaseType } from './database-adapter.factory';

/**
 * @interface DatabaseConfig
 * @description 数据库配置接口
 */
export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  options?: Record<string, any>;
}

/**
 * @class DatabaseConfigService
 * @description 数据库配置服务
 */
export class DatabaseConfigService {
  private static config: DatabaseConfig;

  /**
   * @method getConfig
   * @description 获取数据库配置
   * @returns DatabaseConfig
   */
  static getConfig(): DatabaseConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * @method setConfig
   * @description 设置数据库配置
   * @param config 数据库配置
   */
  static setConfig(config: DatabaseConfig): void {
    this.config = config;
  }

  /**
   * @method getDatabaseType
   * @description 获取数据库类型
   * @returns DatabaseType
   */
  static getDatabaseType(): DatabaseType {
    return this.getConfig().type;
  }

  /**
   * @method isPostgreSQL
   * @description 检查是否为PostgreSQL
   * @returns boolean
   */
  static isPostgreSQL(): boolean {
    return this.getDatabaseType() === DatabaseType.POSTGRESQL;
  }

  /**
   * @method isMongoDB
   * @description 检查是否为MongoDB
   * @returns boolean
   */
  static isMongoDB(): boolean {
    return this.getDatabaseType() === DatabaseType.MONGODB;
  }

  /**
   * @method loadConfig
   * @description 加载配置
   * @returns DatabaseConfig
   * @private
   */
  private static loadConfig(): DatabaseConfig {
    // 从环境变量加载配置
    const databaseType = process.env.USER_DATABASE_TYPE as DatabaseType || DatabaseType.POSTGRESQL;

    const config: DatabaseConfig = {
      type: databaseType,
      host: process.env.USER_DATABASE_HOST,
      port: process.env.USER_DATABASE_PORT ? parseInt(process.env.USER_DATABASE_PORT) : undefined,
      username: process.env.USER_DATABASE_USERNAME,
      password: process.env.USER_DATABASE_PASSWORD,
      database: process.env.USER_DATABASE_NAME,
      connectionString: process.env.USER_DATABASE_URL,
      options: {}
    };

    // 根据数据库类型设置默认配置
    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        config.host = config.host || 'localhost';
        config.port = config.port || 5432;
        config.database = config.database || 'aiofix_users';
        config.options = {
          ...config.options,
          ssl: process.env.NODE_ENV === 'production'
        };
        break;

      case DatabaseType.MONGODB:
        config.host = config.host || 'localhost';
        config.port = config.port || 27017;
        config.database = config.database || 'aiofix_users';
        config.options = {
          ...config.options,
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
        break;

      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }

    return config;
  }

  /**
   * @method getConnectionString
   * @description 获取连接字符串
   * @returns string
   */
  static getConnectionString(): string {
    const config = this.getConfig();

    if (config.connectionString) {
      return config.connectionString;
    }

    switch (config.type) {
      case DatabaseType.POSTGRESQL:
        return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

      case DatabaseType.MONGODB:
        return `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }

  /**
   * @method validateConfig
   * @description 验证配置
   * @returns boolean
   */
  static validateConfig(): boolean {
    try {
      const config = this.getConfig();

      if (!config.type) {
        throw new Error('Database type is required');
      }

      if (!config.connectionString && !config.host) {
        throw new Error('Database host or connection string is required');
      }

      return true;
    } catch (error) {
      console.error('Database configuration validation failed:', error);
      return false;
    }
  }
}
