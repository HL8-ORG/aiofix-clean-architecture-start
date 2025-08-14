import {
  DatabaseConfig,
  DatabaseType,
  ConnectionTestResult
} from '../../interfaces/database-config.interface';
import {
  MikroORMOptions,
  EntityManager,
  Connection,
  IDatabaseDriver
} from '@mikro-orm/core';

/**
 * @interface IMikroOrmAdapter
 * @description
 * MikroORM适配器接口，定义数据库适配器的标准契约。
 * 
 * 主要职责：
 * 1. 将数据库配置转换为MikroORM配置
 * 2. 管理数据库连接
 * 3. 提供事务管理
 * 4. 处理连接池和性能优化
 * 5. 支持数据库特定的功能
 * 
 * 设计原则：
 * - 适配器模式：将不同数据库的差异封装在适配器中
 * - 依赖倒置：高层模块不依赖具体的数据库实现
 * - 开闭原则：支持扩展新的数据库类型
 */
export interface IMikroOrmAdapter {
  /**
   * 获取适配器支持的数据库类型
   */
  readonly supportedDatabaseType: DatabaseType;

  /**
   * 获取适配器名称
   */
  readonly adapterName: string;

  /**
   * 将数据库配置转换为MikroORM配置
   * 
   * @param config 数据库配置
   * @param entities 实体类数组
   * @param migrations 迁移配置
   * @returns MikroORM模块选项
   */
  createMikroOrmConfig(
    config: DatabaseConfig,
    entities?: any[],
    migrations?: any
  ): MikroORMOptions;

  /**
   * 验证配置是否适用于此适配器
   * 
   * @param config 数据库配置
   * @returns 验证结果
   */
  validateConfig(config: DatabaseConfig): boolean;

  /**
   * 测试数据库连接
   * 
   * @param config 数据库配置
   * @returns 连接测试结果
   */
  testConnection(config: DatabaseConfig): Promise<ConnectionTestResult>;

  /**
   * 获取连接字符串
   * 
   * @param config 数据库配置
   * @returns 连接字符串
   */
  getConnectionString(config: DatabaseConfig): string;

  /**
   * 获取数据库特定的配置选项
   * 
   * @param config 数据库配置
   * @returns 数据库特定选项
   */
  getDatabaseSpecificOptions(config: DatabaseConfig): Record<string, any>;

  /**
   * 检查是否支持指定的数据库类型
   * 
   * @param databaseType 数据库类型
   * @returns 是否支持
   */
  supportsDatabaseType(databaseType: DatabaseType): boolean;
}

/**
 * @interface IMikroOrmConnectionManager
 * @description
 * MikroORM连接管理器接口，负责管理数据库连接的生命周期。
 * 
 * 主要职责：
 * 1. 创建和维护数据库连接
 * 2. 管理连接池
 * 3. 处理连接错误和重连
 * 4. 提供连接状态监控
 * 5. 支持多租户连接管理
 */
export interface IMikroOrmConnectionManager {
  /**
   * 获取连接管理器名称
   */
  readonly managerName: string;

  /**
   * 创建数据库连接
   * 
   * @param config 数据库配置
   * @returns 数据库连接
   */
  createConnection(config: DatabaseConfig): Promise<Connection>;

  /**
   * 获取现有连接
   * 
   * @param connectionName 连接名称
   * @returns 数据库连接
   */
  getConnection(connectionName?: string): Connection | null;

  /**
   * 关闭数据库连接
   * 
   * @param connectionName 连接名称
   */
  closeConnection(connectionName?: string): Promise<void>;

  /**
   * 关闭所有连接
   */
  closeAllConnections(): Promise<void>;

  /**
   * 检查连接是否有效
   * 
   * @param connection 数据库连接
   * @returns 连接是否有效
   */
  isConnectionValid(connection: Connection): Promise<boolean>;

  /**
   * 获取连接统计信息
   * 
   * @returns 连接统计
   */
  getConnectionStats(): ConnectionStats;

  /**
   * 健康检查
   * 
   * @returns 健康检查结果
   */
  healthCheck(): Promise<HealthCheckResult>;
}

/**
 * @interface IMikroOrmTransactionManager
 * @description
 * MikroORM事务管理器接口，负责管理数据库事务。
 * 
 * 主要职责：
 * 1. 创建和管理事务
 * 2. 处理事务嵌套
 * 3. 提供事务隔离级别控制
 * 4. 支持分布式事务
 * 5. 事务回滚和提交
 */
export interface IMikroOrmTransactionManager {
  /**
   * 获取事务管理器名称
   */
  readonly managerName: string;

  /**
   * 开始事务
   * 
   * @param entityManager 实体管理器
   * @param isolationLevel 隔离级别
   * @returns 事务对象
   */
  beginTransaction(
    entityManager: EntityManager,
    isolationLevel?: TransactionIsolationLevel
  ): Promise<ITransaction>;

  /**
   * 提交事务
   * 
   * @param transaction 事务对象
   */
  commitTransaction(transaction: ITransaction): Promise<void>;

  /**
   * 回滚事务
   * 
   * @param transaction 事务对象
   */
  rollbackTransaction(transaction: ITransaction): Promise<void>;

  /**
   * 在事务中执行操作
   * 
   * @param entityManager 实体管理器
   * @param operation 要执行的操作
   * @param isolationLevel 隔离级别
   * @returns 操作结果
   */
  executeInTransaction<T>(
    entityManager: EntityManager,
    operation: (em: EntityManager) => Promise<T>,
    isolationLevel?: TransactionIsolationLevel
  ): Promise<T>;

  /**
   * 获取当前事务
   * 
   * @param entityManager 实体管理器
   * @returns 当前事务对象
   */
  getCurrentTransaction(entityManager: EntityManager): ITransaction | null;

  /**
   * 检查是否在事务中
   * 
   * @param entityManager 实体管理器
   * @returns 是否在事务中
   */
  isInTransaction(entityManager: EntityManager): boolean;
}

/**
 * @interface ITransaction
 * @description
 * 事务接口，表示一个数据库事务。
 */
export interface ITransaction {
  /**
   * 事务ID
   */
  readonly id: string;

  /**
   * 事务开始时间
   */
  readonly startTime: Date;

  /**
   * 事务状态
   */
  readonly status: TransactionStatus;

  /**
   * 隔离级别
   */
  readonly isolationLevel: TransactionIsolationLevel;

  /**
   * 提交事务
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   */
  rollback(): Promise<void>;

  /**
   * 检查事务是否活跃
   */
  isActive(): boolean;

  /**
   * 获取事务统计信息
   */
  getStats(): TransactionStats;
}

/**
 * @enum TransactionStatus
 * @description
 * 事务状态枚举
 */
export enum TransactionStatus {
  ACTIVE = 'active',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed'
}

/**
 * @enum TransactionIsolationLevel
 * @description
 * 事务隔离级别枚举
 */
export enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'read_uncommitted',
  READ_COMMITTED = 'read_committed',
  REPEATABLE_READ = 'repeatable_read',
  SERIALIZABLE = 'serializable'
}

/**
 * @interface ConnectionStats
 * @description
 * 连接统计信息
 */
export interface ConnectionStats {
  /**
   * 总连接数
   */
  totalConnections: number;

  /**
   * 活跃连接数
   */
  activeConnections: number;

  /**
   * 空闲连接数
   */
  idleConnections: number;

  /**
   * 等待连接数
   */
  waitingConnections: number;

  /**
   * 最大连接数
   */
  maxConnections: number;

  /**
   * 连接池使用率
   */
  poolUsage: number;
}

/**
 * @interface HealthCheckResult
 * @description
 * 健康检查结果
 */
export interface HealthCheckResult {
  /**
   * 是否健康
   */
  healthy: boolean;

  /**
   * 检查时间
   */
  timestamp: Date;

  /**
   * 响应时间（毫秒）
   */
  responseTime: number;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 详细信息
   */
  details: Record<string, any>;
}

/**
 * @interface TransactionStats
 * @description
 * 事务统计信息
 */
export interface TransactionStats {
  /**
   * 事务持续时间（毫秒）
   */
  duration: number;

  /**
   * 执行的查询数量
   */
  queryCount: number;

  /**
   * 影响的行数
   */
  affectedRows: number;

  /**
   * 事务大小（字节）
   */
  size: number;
}

/**
 * @interface MikroOrmAdapterOptions
 * @description
 * MikroORM适配器选项
 */
export interface MikroOrmAdapterOptions {
  /**
   * 是否启用调试模式
   */
  debug?: boolean;

  /**
   * 是否启用日志
   */
  logging?: boolean;

  /**
   * 连接超时时间（毫秒）
   */
  connectTimeout?: number;

  /**
   * 查询超时时间（毫秒）
   */
  queryTimeout?: number;

  /**
   * 是否启用连接池
   */
  enableConnectionPool?: boolean;

  /**
   * 连接池配置
   */
  pool?: {
    min?: number;
    max?: number;
    acquireTimeout?: number;
    idleTimeout?: number;
    lifetime?: number;
  };

  /**
   * 是否启用SSL
   */
  ssl?: boolean;

  /**
   * SSL配置
   */
  sslOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
}
