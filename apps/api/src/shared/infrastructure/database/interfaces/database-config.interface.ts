/**
 * @interface DatabaseConfig
 * @description
 * 数据库配置接口，定义了数据库配置的基本契约。
 * 
 * 主要职责：
 * 1. 定义数据库连接配置
 * 2. 支持多种数据库类型
 * 3. 提供连接池配置
 * 4. 支持SSL和安全配置
 * 
 * 设计原则：
 * - 支持多种数据库类型（PostgreSQL、MongoDB等）
 * - 提供统一的配置接口
 * - 支持环境变量配置
 * - 支持连接池优化
 */
export interface DatabaseConfig {
  /**
   * 数据库类型
   */
  type: DatabaseType;

  /**
   * 数据库主机
   */
  host: string;

  /**
   * 数据库端口
   */
  port: number;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * 用户名
   */
  username: string;

  /**
   * 密码
   */
  password: string;

  /**
   * 连接池配置
   */
  pool?: ConnectionPoolConfig;

  /**
   * SSL配置
   */
  ssl?: SSLConfig;

  /**
   * 其他数据库特定配置
   */
  options?: Record<string, any>;

  /**
   * 是否启用调试模式
   */
  debug?: boolean;

  /**
   * 连接超时时间（毫秒）
   */
  connectTimeout?: number;

  /**
   * 查询超时时间（毫秒）
   */
  queryTimeout?: number;
}

/**
 * @enum DatabaseType
 * @description
 * 数据库类型枚举
 */
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
}

/**
 * @interface ConnectionPoolConfig
 * @description
 * 连接池配置
 */
export interface ConnectionPoolConfig {
  /**
   * 最小连接数
   */
  min?: number;

  /**
   * 最大连接数
   */
  max?: number;

  /**
   * 连接获取超时时间（毫秒）
   */
  acquireTimeout?: number;

  /**
   * 连接空闲超时时间（毫秒）
   */
  idleTimeout?: number;

  /**
   * 连接生命周期时间（毫秒）
   */
  lifetime?: number;

  /**
   * 是否在连接池满时等待
   */
  waitForConnections?: boolean;

  /**
   * 队列超时时间（毫秒）
   */
  queueLimit?: number;
}

/**
 * @interface SSLConfig
 * @description
 * SSL配置
 */
export interface SSLConfig {
  /**
   * 是否启用SSL
   */
  enabled: boolean;

  /**
   * 是否拒绝自签名证书
   */
  rejectUnauthorized?: boolean;

  /**
   * CA证书路径
   */
  ca?: string;

  /**
   * 客户端证书路径
   */
  cert?: string;

  /**
   * 客户端私钥路径
   */
  key?: string;
}

/**
 * @interface DatabaseConfigFactory
 * @description
 * 数据库配置工厂接口
 */
export interface DatabaseConfigFactory {
  /**
   * 创建数据库配置
   * 
   * @param type 数据库类型
   * @param options 配置选项
   * @returns 数据库配置
   */
  createConfig(type: DatabaseType, options: Partial<DatabaseConfig>): DatabaseConfig;

  /**
   * 从环境变量创建配置
   * 
   * @param type 数据库类型
   * @returns 数据库配置
   */
  createFromEnvironment(type: DatabaseType): DatabaseConfig;

  /**
   * 验证配置
   * 
   * @param config 数据库配置
   * @returns 验证结果
   */
  validateConfig(config: DatabaseConfig): ValidationResult;
}

/**
 * @interface ValidationResult
 * @description
 * 验证结果
 */
export interface ValidationResult {
  /**
   * 是否有效
   */
  isValid: boolean;

  /**
   * 错误信息列表
   */
  errors: string[];

  /**
   * 警告信息列表
   */
  warnings: string[];
}

/**
 * @interface DatabaseConfigValidator
 * @description
 * 数据库配置验证器接口
 */
export interface DatabaseConfigValidator {
  /**
   * 验证配置
   * 
   * @param config 数据库配置
   * @returns 验证结果
   */
  validate(config: DatabaseConfig): ValidationResult;

  /**
   * 验证连接
   * 
   * @param config 数据库配置
   * @returns 连接测试结果
   */
  testConnection(config: DatabaseConfig): Promise<ConnectionTestResult>;
}

/**
 * @interface ConnectionTestResult
 * @description
 * 连接测试结果
 */
export interface ConnectionTestResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 连接时间（毫秒）
   */
  connectionTime?: number;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 数据库版本信息
   */
  version?: string;
}
