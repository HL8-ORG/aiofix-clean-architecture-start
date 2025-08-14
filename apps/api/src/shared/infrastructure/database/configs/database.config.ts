import { DatabaseType } from '../interfaces/database-config.interface';
import { PostgreSQLConfig } from './postgresql.config';
import { MongoDBConfig } from './mongodb.config';

/**
 * @class DatabaseConfig
 * @description
 * 实际应用的数据库配置类，根据环境变量和用户提供的参数创建配置。
 * 
 * 主要功能：
 * 1. 从环境变量读取数据库配置
 * 2. 支持PostgreSQL和MongoDB
 * 3. 提供开发、测试、生产环境的配置
 * 4. 支持连接字符串解析
 * 
 * 环境变量配置：
 * - DATABASE_URL: 完整的数据库连接字符串
 * - DATABASE_HOST: 数据库主机
 * - DATABASE_PORT: 数据库端口
 * - DATABASE_NAME: 数据库名称
 * - DATABASE_USER: 数据库用户名
 * - DATABASE_PASSWORD: 数据库密码
 * - DATABASE_TYPE: 数据库类型 (postgresql/mongodb)
 */
export class DatabaseConfig {
  /**
   * 获取PostgreSQL配置
   * 
   * @returns PostgreSQL配置实例
   */
  static getPostgreSQLConfig(): PostgreSQLConfig {
    // 优先使用DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      return this.parsePostgreSQLUrl(databaseUrl);
    }

    // 使用环境变量
    return new PostgreSQLConfig({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      database: process.env.DATABASE_NAME || 'iam_db',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      debug: process.env.NODE_ENV === 'development',
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
      pool: {
        min: parseInt(process.env.DB_POOL_MIN || '5', 10),
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
        idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '300000', 10),
        lifetime: parseInt(process.env.DB_POOL_LIFETIME || '1800000', 10),
      },
    });
  }

  /**
   * 获取MongoDB配置
   * 
   * @returns MongoDB配置实例
   */
  static getMongoDBConfig(): MongoDBConfig {
    // 优先使用DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      return this.parseMongoDBUrl(databaseUrl);
    }

    // 使用环境变量
    return new MongoDBConfig({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '27017', 10),
      database: process.env.DATABASE_NAME || 'iam_db',
      username: process.env.DATABASE_USER || '',
      password: process.env.DATABASE_PASSWORD || '',
      authSource: process.env.DB_AUTH_SOURCE || 'admin',
      replicaSet: process.env.DB_REPLICA_SET,
      readPreference: process.env.DB_READ_PREFERENCE || 'primary',
      writeConcern: process.env.DB_WRITE_CONCERN || 'majority',
      debug: process.env.NODE_ENV === 'development',
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '0', 10),
    });
  }

  /**
   * 根据环境获取数据库配置
   * 
   * @returns 数据库配置实例
   */
  static getConfig(): PostgreSQLConfig | MongoDBConfig {
    const databaseType = process.env.DATABASE_TYPE?.toLowerCase() || 'postgresql';

    switch (databaseType) {
      case 'postgresql':
      case 'postgres':
        return this.getPostgreSQLConfig();

      case 'mongodb':
      case 'mongo':
        return this.getMongoDBConfig();

      default:
        // 默认使用PostgreSQL
        return this.getPostgreSQLConfig();
    }
  }

  /**
   * 解析PostgreSQL连接字符串
   * 
   * @param url PostgreSQL连接字符串
   * @returns PostgreSQL配置实例
   */
  private static parsePostgreSQLUrl(url: string): PostgreSQLConfig {
    try {
      const parsedUrl = new URL(url);

      // 提取数据库名称（去掉开头的/）
      const database = parsedUrl.pathname.substring(1);

      // 提取用户名和密码
      const username = parsedUrl.username;
      const password = parsedUrl.password;

      // 提取主机和端口
      const host = parsedUrl.hostname;
      const port = parseInt(parsedUrl.port || '5432', 10);

      // 解析查询参数
      const searchParams = parsedUrl.searchParams;
      const debug = searchParams.get('debug') === 'true';
      const connectTimeout = parseInt(searchParams.get('connect_timeout') || '30000', 10);
      const queryTimeout = parseInt(searchParams.get('query_timeout') || '30000', 10);

      return new PostgreSQLConfig({
        host,
        port,
        database,
        username,
        password,
        debug,
        connectTimeout,
        queryTimeout,
      });
    } catch (error) {
      throw new Error(`无效的PostgreSQL连接字符串: ${url}`);
    }
  }

  /**
   * 解析MongoDB连接字符串
   * 
   * @param url MongoDB连接字符串
   * @returns MongoDB配置实例
   */
  private static parseMongoDBUrl(url: string): MongoDBConfig {
    try {
      const parsedUrl = new URL(url);

      // 提取数据库名称（去掉开头的/）
      const database = parsedUrl.pathname.substring(1);

      // 提取用户名和密码
      const username = parsedUrl.username;
      const password = parsedUrl.password;

      // 提取主机和端口
      const host = parsedUrl.hostname;
      const port = parseInt(parsedUrl.port || '27017', 10);

      // 解析查询参数
      const searchParams = parsedUrl.searchParams;
      const authSource = searchParams.get('authSource') || 'admin';
      const replicaSet = searchParams.get('replicaSet') || undefined;
      const readPreference = searchParams.get('readPreference') || 'primary';
      const writeConcern = searchParams.get('w') || 'majority';
      const maxPoolSize = parseInt(searchParams.get('maxPoolSize') || '10', 10);
      const minPoolSize = parseInt(searchParams.get('minPoolSize') || '0', 10);

      return new MongoDBConfig({
        host,
        port,
        database,
        username,
        password,
        authSource,
        replicaSet,
        readPreference,
        writeConcern,
        maxPoolSize,
        minPoolSize,
      });
    } catch (error) {
      throw new Error(`无效的MongoDB连接字符串: ${url}`);
    }
  }

  /**
   * 获取开发环境配置
   * 
   * @returns 开发环境数据库配置
   */
  static getDevelopmentConfig(): PostgreSQLConfig {
    return new PostgreSQLConfig({
      host: 'localhost',
      port: 25432, // 使用您提供的端口
      database: 'iam_db',
      username: 'postgres',
      password: 'postgres',
      debug: true,
      pool: {
        min: 2,
        max: 10,
        acquireTimeout: 30000,
        idleTimeout: 300000,
        lifetime: 1800000,
      },
    });
  }

  /**
   * 获取测试环境配置
   * 
   * @returns 测试环境数据库配置
   */
  static getTestConfig(): PostgreSQLConfig {
    return new PostgreSQLConfig({
      host: 'localhost',
      port: 25432,
      database: 'iam_test_db',
      username: 'postgres',
      password: 'postgres',
      debug: false,
      pool: {
        min: 1,
        max: 5,
        acquireTimeout: 10000,
        idleTimeout: 60000,
        lifetime: 300000,
      },
    });
  }

  /**
   * 获取生产环境配置
   * 
   * @returns 生产环境数据库配置
   */
  static getProductionConfig(): PostgreSQLConfig {
    return new PostgreSQLConfig({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      database: process.env.DATABASE_NAME || 'iam_prod_db',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      debug: false,
      ssl: {
        enabled: true,
        rejectUnauthorized: false,
      },
      pool: {
        min: 5,
        max: 20,
        acquireTimeout: 60000,
        idleTimeout: 300000,
        lifetime: 1800000,
      },
    });
  }

  /**
   * 根据NODE_ENV获取环境特定配置
   * 
   * @returns 环境特定的数据库配置
   */
  static getEnvironmentConfig(): PostgreSQLConfig | MongoDBConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';

    switch (nodeEnv) {
      case 'development':
        return this.getDevelopmentConfig();

      case 'test':
        return this.getTestConfig();

      case 'production':
        return this.getProductionConfig();

      default:
        return this.getDevelopmentConfig();
    }
  }
}
