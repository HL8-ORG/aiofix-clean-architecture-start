import type { EntityManager, Connection, IDatabaseDriver } from '@mikro-orm/core';
import { DatabaseType } from '../../../interfaces/database-config.interface';
import type { DatabaseConfig } from '../../../interfaces/database-config.interface';
import type { IMikroOrmAdapter } from '../interfaces/mikro-orm-adapter.interface';

/**
 * @interface ConnectionInfo
 * @description
 * 连接信息接口，包含连接的基本信息和状态。
 * 
 * 主要属性：
 * - id: 连接唯一标识
 * - databaseType: 数据库类型
 * - host: 数据库主机
 * - port: 数据库端口
 * - database: 数据库名称
 * - status: 连接状态
 * - createdAt: 创建时间
 * - lastUsedAt: 最后使用时间
 * - connectionTime: 连接耗时
 * - isActive: 是否活跃
 */
export interface ConnectionInfo {
  /** 连接唯一标识 */
  readonly id: string;
  /** 数据库类型 */
  readonly databaseType: DatabaseType;
  /** 数据库主机 */
  readonly host: string;
  /** 数据库端口 */
  readonly port: number;
  /** 数据库名称 */
  readonly database: string;
  /** 连接状态 */
  readonly status: ConnectionStatus;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 最后使用时间 */
  readonly lastUsedAt: Date;
  /** 连接耗时（毫秒） */
  readonly connectionTime: number;
  /** 是否活跃 */
  readonly isActive: boolean;
  /** 连接配置哈希 */
  readonly configHash: string;
  /** 错误信息（如果有） */
  readonly error?: string;
}

/**
 * @enum ConnectionStatus
 * @description
 * 连接状态枚举，表示连接的不同状态。
 */
export enum ConnectionStatus {
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 连接失败 */
  FAILED = 'failed',
  /** 断开连接 */
  DISCONNECTED = 'disconnected',
  /** 重连中 */
  RECONNECTING = 'reconnecting',
  /** 关闭 */
  CLOSED = 'closed',
}

/**
 * @interface ConnectionOptions
 * @description
 * 连接选项接口，定义连接时的配置参数。
 */
export interface ConnectionOptions {
  /** 是否强制重新连接 */
  forceReconnect?: boolean;
  /** 连接超时时间（毫秒） */
  timeout?: number;
  /** 是否启用连接池 */
  enablePool?: boolean;
  /** 连接池大小 */
  poolSize?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试间隔（毫秒） */
  retryDelay?: number;
  /** 是否启用SSL */
  ssl?: boolean;
  /** 自定义连接参数 */
  customParams?: Record<string, any>;
}

/**
 * @interface ConnectionPoolInfo
 * @description
 * 连接池信息接口，包含连接池的统计信息。
 */
export interface ConnectionPoolInfo {
  /** 总连接数 */
  readonly totalConnections: number;
  /** 活跃连接数 */
  readonly activeConnections: number;
  /** 空闲连接数 */
  readonly idleConnections: number;
  /** 等待连接数 */
  readonly waitingConnections: number;
  /** 最大连接数 */
  readonly maxConnections: number;
  /** 最小连接数 */
  readonly minConnections: number;
  /** 连接池状态 */
  readonly status: 'healthy' | 'warning' | 'critical';
  /** 平均连接时间（毫秒） */
  readonly averageConnectionTime: number;
  /** 连接成功率 */
  readonly successRate: number;
}

/**
 * @interface ConnectionHealthCheck
 * @description
 * 连接健康检查结果接口。
 */
export interface ConnectionHealthCheck {
  /** 是否健康 */
  readonly isHealthy: boolean;
  /** 响应时间（毫秒） */
  readonly responseTime: number;
  /** 错误信息 */
  readonly error?: string;
  /** 检查时间 */
  readonly checkedAt: Date;
  /** 连接信息 */
  readonly connectionInfo: ConnectionInfo;
}

/**
 * @interface IMikroOrmConnectionManager
 * @description
 * MikroORM连接管理器接口，负责管理数据库连接的生命周期。
 * 
 * 主要职责：
 * 1. 创建和管理数据库连接
 * 2. 连接池管理
 * 3. 连接健康检查
 * 4. 连接监控和统计
 * 5. 自动重连机制
 * 6. 连接资源清理
 * 
 * 设计原则：
 * - 连接复用：避免频繁创建和销毁连接
 * - 自动管理：自动处理连接的创建、维护和清理
 * - 健康监控：持续监控连接状态
 * - 故障恢复：自动重连和故障转移
 * - 性能优化：连接池和负载均衡
 */
export interface IMikroOrmConnectionManager {
  /**
   * 获取连接
   * 
   * @param config 数据库配置
   * @param options 连接选项
   * @returns EntityManager实例
   */
  getConnection(
    config: DatabaseConfig,
    options?: ConnectionOptions
  ): Promise<EntityManager>;

  /**
   * 创建新连接
   * 
   * @param config 数据库配置
   * @param options 连接选项
   * @returns EntityManager实例
   */
  createConnection(
    config: DatabaseConfig,
    options?: ConnectionOptions
  ): Promise<EntityManager>;

  /**
   * 关闭连接
   * 
   * @param config 数据库配置
   * @returns 是否成功关闭
   */
  closeConnection(config: DatabaseConfig): Promise<boolean>;

  /**
   * 关闭所有连接
   * 
   * @returns 关闭的连接数量
   */
  closeAllConnections(): Promise<number>;

  /**
   * 检查连接健康状态
   * 
   * @param config 数据库配置
   * @returns 健康检查结果
   */
  healthCheck(config: DatabaseConfig): Promise<ConnectionHealthCheck>;

  /**
   * 获取连接信息
   * 
   * @param config 数据库配置
   * @returns 连接信息
   */
  getConnectionInfo(config: DatabaseConfig): ConnectionInfo | null;

  /**
   * 获取所有连接信息
   * 
   * @returns 所有连接信息列表
   */
  getAllConnectionInfo(): ConnectionInfo[];

  /**
   * 获取连接池信息
   * 
   * @param config 数据库配置
   * @returns 连接池信息
   */
  getConnectionPoolInfo(config: DatabaseConfig): ConnectionPoolInfo | null;

  /**
   * 设置适配器
   * 
   * @param adapter 数据库适配器
   */
  setAdapter(adapter: IMikroOrmAdapter): void;

  /**
   * 获取适配器
   * 
   * @param databaseType 数据库类型
   * @returns 数据库适配器
   */
  getAdapter(databaseType: DatabaseType): IMikroOrmAdapter | null;

  /**
   * 检查连接是否存在
   * 
   * @param config 数据库配置
   * @returns 是否存在连接
   */
  hasConnection(config: DatabaseConfig): boolean;

  /**
   * 获取连接数量
   * 
   * @returns 当前连接数量
   */
  getConnectionCount(): number;

  /**
   * 清理空闲连接
   * 
   * @param maxIdleTime 最大空闲时间（毫秒）
   * @returns 清理的连接数量
   */
  cleanupIdleConnections(maxIdleTime?: number): Promise<number>;

  /**
   * 强制重连
   * 
   * @param config 数据库配置
   * @returns 是否成功重连
   */
  forceReconnect(config: DatabaseConfig): Promise<boolean>;

  /**
   * 获取连接统计信息
   * 
   * @returns 连接统计信息
   */
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    failedConnections: number;
    averageConnectionTime: number;
    successRate: number;
  };

  /**
   * 启用连接监控
   * 
   * @param interval 监控间隔（毫秒）
   */
  enableMonitoring(interval?: number): void;

  /**
   * 禁用连接监控
   */
  disableMonitoring(): void;

  /**
   * 获取监控状态
   * 
   * @returns 监控是否启用
   */
  isMonitoringEnabled(): boolean;
}
