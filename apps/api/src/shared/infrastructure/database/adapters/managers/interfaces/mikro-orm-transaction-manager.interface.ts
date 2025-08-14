import type { EntityManager, IDatabaseDriver, Connection } from '@mikro-orm/core';
import type { DatabaseConfig } from '../../../interfaces/database-config.interface';
import type { IMikroOrmConnectionManager } from './mikro-orm-connection-manager.interface';

/**
 * @enum TransactionIsolationLevel
 * @description
 * 事务隔离级别枚举，定义数据库事务的隔离级别。
 */
export enum TransactionIsolationLevel {
  /** 读未提交 */
  READ_UNCOMMITTED = 'read uncommitted',
  /** 读已提交 */
  READ_COMMITTED = 'read committed',
  /** 可重复读 */
  REPEATABLE_READ = 'repeatable read',
  /** 串行化 */
  SERIALIZABLE = 'serializable',
}

/**
 * @interface TransactionOptions
 * @description
 * 事务选项接口，定义事务的配置参数。
 */
export interface TransactionOptions {
  /** 事务隔离级别 */
  isolationLevel?: TransactionIsolationLevel;
  /** 事务超时时间（毫秒） */
  timeout?: number;
  /** 是否只读事务 */
  readOnly?: boolean;
  /** 事务名称 */
  name?: string;
  /** 自定义事务参数 */
  customParams?: Record<string, any>;
}

/**
 * @interface TransactionInfo
 * @description
 * 事务信息接口，包含事务的基本信息和状态。
 */
export interface TransactionInfo {
  /** 事务ID */
  readonly id: string;
  /** 事务名称 */
  readonly name?: string;
  /** 事务状态 */
  readonly status: TransactionStatus;
  /** 开始时间 */
  readonly startedAt: Date;
  /** 结束时间 */
  readonly endedAt?: Date;
  /** 持续时间（毫秒） */
  readonly duration: number;
  /** 隔离级别 */
  readonly isolationLevel: TransactionIsolationLevel;
  /** 是否只读 */
  readonly isReadOnly: boolean;
  /** 连接信息 */
  readonly connectionInfo: {
    host: string;
    port: number;
    database: string;
  };
  /** 错误信息（如果有） */
  readonly error?: string;
  /** 嵌套级别 */
  readonly nestingLevel: number;
}

/**
 * @enum TransactionStatus
 * @description
 * 事务状态枚举，表示事务的不同状态。
 */
export enum TransactionStatus {
  /** 活跃 */
  ACTIVE = 'active',
  /** 已提交 */
  COMMITTED = 'committed',
  /** 已回滚 */
  ROLLED_BACK = 'rolled_back',
  /** 失败 */
  FAILED = 'failed',
  /** 超时 */
  TIMEOUT = 'timeout',
}

/**
 * @interface TransactionResult
 * @description
 * 事务结果接口，包含事务执行的结果信息。
 */
export interface TransactionResult<T = any> {
  /** 事务信息 */
  readonly transactionInfo: TransactionInfo;
  /** 事务结果 */
  readonly result: T;
  /** 是否成功 */
  readonly success: boolean;
  /** 错误信息 */
  readonly error?: string;
  /** 执行时间（毫秒） */
  readonly executionTime: number;
}

/**
 * @interface TransactionStats
 * @description
 * 事务统计信息接口，包含事务的统计信息。
 */
export interface TransactionStats {
  /** 总事务数 */
  readonly totalTransactions: number;
  /** 成功事务数 */
  readonly successfulTransactions: number;
  /** 失败事务数 */
  readonly failedTransactions: number;
  /** 平均执行时间（毫秒） */
  readonly averageExecutionTime: number;
  /** 成功率 */
  readonly successRate: number;
  /** 活跃事务数 */
  readonly activeTransactions: number;
  /** 最长事务时间（毫秒） */
  readonly longestTransactionTime: number;
  /** 最短事务时间（毫秒） */
  readonly shortestTransactionTime: number;
}

/**
 * @interface ITransaction
 * @description
 * 事务接口，定义事务的基本操作。
 */
export interface ITransaction {
  /** 事务ID */
  readonly id: string;
  /** 事务状态 */
  readonly status: TransactionStatus;
  /** 事务信息 */
  readonly info: TransactionInfo;
  /** EntityManager实例 */
  readonly em: EntityManager;

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
   * 获取嵌套级别
   */
  getNestingLevel(): number;
}

/**
 * @interface IMikroOrmTransactionManager
 * @description
 * MikroORM事务管理器接口，负责管理数据库事务的生命周期。
 * 
 * 主要职责：
 * 1. 创建和管理数据库事务
 * 2. 事务嵌套管理
 * 3. 事务超时处理
 * 4. 事务监控和统计
 * 5. 分布式事务支持
 * 6. 事务资源清理
 * 
 * 设计原则：
 * - 事务安全：确保事务的ACID特性
 * - 嵌套支持：支持事务嵌套和保存点
 * - 自动管理：自动处理事务的创建、提交和回滚
 * - 性能监控：监控事务性能和资源使用
 * - 错误处理：优雅处理事务失败和异常
 * - 资源管理：确保事务资源的正确释放
 */
export interface IMikroOrmTransactionManager {
  /**
   * 开始事务
   * 
   * @param config 数据库配置
   * @param options 事务选项
   * @returns 事务实例
   */
  beginTransaction(
    config: DatabaseConfig,
    options?: TransactionOptions
  ): Promise<ITransaction>;

  /**
   * 在事务中执行操作
   * 
   * @param config 数据库配置
   * @param operation 要执行的操作
   * @param options 事务选项
   * @returns 操作结果
   */
  executeInTransaction<T>(
    config: DatabaseConfig,
    operation: (em: EntityManager) => Promise<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>>;

  /**
   * 获取当前事务
   * 
   * @param config 数据库配置
   * @returns 当前事务实例
   */
  getCurrentTransaction(config: DatabaseConfig): ITransaction | null;

  /**
   * 检查是否有活跃事务
   * 
   * @param config 数据库配置
   * @returns 是否有活跃事务
   */
  hasActiveTransaction(config: DatabaseConfig): boolean;

  /**
   * 提交当前事务
   * 
   * @param config 数据库配置
   * @returns 是否成功提交
   */
  commitCurrentTransaction(config: DatabaseConfig): Promise<boolean>;

  /**
   * 回滚当前事务
   * 
   * @param config 数据库配置
   * @returns 是否成功回滚
   */
  rollbackCurrentTransaction(config: DatabaseConfig): Promise<boolean>;

  /**
   * 创建保存点
   * 
   * @param config 数据库配置
   * @param savepointName 保存点名称
   * @returns 是否成功创建保存点
   */
  createSavepoint(config: DatabaseConfig, savepointName: string): Promise<boolean>;

  /**
   * 回滚到保存点
   * 
   * @param config 数据库配置
   * @param savepointName 保存点名称
   * @returns 是否成功回滚到保存点
   */
  rollbackToSavepoint(config: DatabaseConfig, savepointName: string): Promise<boolean>;

  /**
   * 释放保存点
   * 
   * @param config 数据库配置
   * @param savepointName 保存点名称
   * @returns 是否成功释放保存点
   */
  releaseSavepoint(config: DatabaseConfig, savepointName: string): Promise<boolean>;

  /**
   * 获取事务信息
   * 
   * @param config 数据库配置
   * @returns 事务信息列表
   */
  getTransactionInfo(config: DatabaseConfig): TransactionInfo[];

  /**
   * 获取所有事务信息
   * 
   * @returns 所有事务信息列表
   */
  getAllTransactionInfo(): TransactionInfo[];

  /**
   * 获取事务统计信息
   * 
   * @returns 事务统计信息
   */
  getTransactionStats(): TransactionStats;

  /**
   * 清理已完成的事务
   * 
   * @param maxAge 最大保留时间（毫秒）
   * @returns 清理的事务数量
   */
  cleanupCompletedTransactions(maxAge?: number): Promise<number>;

  /**
   * 强制回滚所有事务
   * 
   * @returns 回滚的事务数量
   */
  forceRollbackAllTransactions(): Promise<number>;

  /**
   * 设置连接管理器
   * 
   * @param connectionManager 连接管理器
   */
  setConnectionManager(connectionManager: IMikroOrmConnectionManager): void;

  /**
   * 获取连接管理器
   * 
   * @returns 连接管理器
   */
  getConnectionManager(): IMikroOrmConnectionManager | null;

  /**
   * 启用事务监控
   * 
   * @param interval 监控间隔（毫秒）
   */
  enableMonitoring(interval?: number): void;

  /**
   * 禁用事务监控
   */
  disableMonitoring(): void;

  /**
   * 获取监控状态
   * 
   * @returns 监控是否启用
   */
  isMonitoringEnabled(): boolean;

  /**
   * 获取活跃事务数量
   * 
   * @returns 活跃事务数量
   */
  getActiveTransactionCount(): number;

  /**
   * 检查事务超时
   * 
   * @param config 数据库配置
   * @returns 是否超时
   */
  checkTransactionTimeout(config: DatabaseConfig): boolean;
}
