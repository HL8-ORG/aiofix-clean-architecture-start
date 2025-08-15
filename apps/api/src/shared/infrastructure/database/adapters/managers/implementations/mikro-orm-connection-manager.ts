import { Injectable } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { DatabaseType } from '../../../interfaces/database-config.interface';
import type { DatabaseConfig } from '../../../interfaces/database-config.interface';
import type { IMikroOrmAdapter } from '../../interfaces/mikro-orm-adapter.interface';
import type {
  IMikroOrmConnectionManager,
  ConnectionInfo,
  ConnectionOptions,
  ConnectionPoolInfo,
  ConnectionHealthCheck,
} from '../interfaces/mikro-orm-connection-manager.interface';
import { ConnectionStatus } from '../interfaces/mikro-orm-connection-manager.interface';
import { PinoLoggerService } from '../../../../logging/services/pino-logger.service';
import { LogContext } from '../../../../logging/interfaces/logging.interface';

/**
 * @interface ConnectionEntry
 * @description
 * 连接条目接口，包含连接实例和相关信息。
 */
interface ConnectionEntry {
  /** 连接实例 */
  orm: MikroORM;
  /** 连接信息 */
  info: ConnectionInfo;
  /** 最后使用时间 */
  lastUsedAt: Date;
  /** 是否正在使用 */
  isInUse: boolean;
  /** 重试次数 */
  retryCount: number;
  /** 健康检查结果 */
  healthCheck?: ConnectionHealthCheck;
}

/**
 * @interface ConnectionPool
 * @description
 * 连接池接口，管理特定配置的连接池。
 */
interface ConnectionPool {
  /** 连接列表 */
  connections: ConnectionEntry[];
  /** 最大连接数 */
  maxConnections: number;
  /** 最小连接数 */
  minConnections: number;
  /** 等待队列 */
  waitingQueue: Array<{
    resolve: (em: EntityManager) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
  /** 统计信息 */
  stats: {
    totalCreated: number;
    totalClosed: number;
    totalErrors: number;
    averageConnectionTime: number;
  };
}

/**
 * @class MikroOrmConnectionManager
 * @description
 * MikroORM连接管理器实现，提供完整的连接管理功能。
 */
@Injectable()
export class MikroOrmConnectionManager implements IMikroOrmConnectionManager {
  private readonly logger: PinoLoggerService;

  /**
   * 连接池映射，按配置哈希分组
   */
  private readonly connectionPools = new Map<string, ConnectionPool>();

  /**
   * 适配器映射
   */
  private readonly adapters = new Map<DatabaseType, IMikroOrmAdapter>();

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 监控间隔（毫秒）
   */
  private monitoringInterval = 30000; // 30秒

  /**
   * 默认连接选项
   */
  private readonly defaultOptions: ConnectionOptions = {
    forceReconnect: false,
    timeout: 30000,
    enablePool: true,
    poolSize: 10,
    retryCount: 3,
    retryDelay: 1000,
    ssl: false,
    customParams: {},
  };

  /**
   * 统计信息
   */
  private readonly stats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    successRate: 1.0,
  };

  constructor(logger: PinoLoggerService) {
    this.logger = logger;
    this.logger.info('MikroORM连接管理器已初始化', LogContext.DATABASE);
  }

  // 基本连接管理方法
  async getConnection(
    config: DatabaseConfig,
    options: ConnectionOptions = {}
  ): Promise<EntityManager> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const configHash = this.generateConfigHash(config);

    try {
      // 获取或创建连接池
      let pool = this.connectionPools.get(configHash);
      if (!pool) {
        pool = this.createConnectionPool(config, mergedOptions);
        this.connectionPools.set(configHash, pool);
      }

      // 尝试获取空闲连接
      const idleConnection = pool.connections.find(conn => !conn.isInUse);
      if (idleConnection) {
        idleConnection.isInUse = true;
        idleConnection.lastUsedAt = new Date();
        this.stats.activeConnections++;
        this.stats.idleConnections--;

        this.logger.debug(`复用现有连接: ${idleConnection.info.id}`, LogContext.DATABASE);
        return idleConnection.orm.em;
      }

      // 如果没有空闲连接，检查是否可以创建新连接
      if (pool.connections.length < pool.maxConnections) {
        const newConnection = await this.createNewConnection(config, mergedOptions);
        pool.connections.push(newConnection);
        pool.stats.totalCreated++;

        newConnection.isInUse = true;
        this.stats.activeConnections++;
        this.stats.totalConnections++;

        this.logger.debug(`创建新连接: ${newConnection.info.id}`, LogContext.DATABASE);
        return newConnection.orm.em;
      }

      // 如果连接池已满，等待可用连接
      return this.waitForConnection(pool, config, mergedOptions);
    } catch (error) {
      this.stats.failedConnections++;
      this.updateSuccessRate();
      this.logger.error(`获取连接失败: ${error.message}`, LogContext.DATABASE, undefined, error);
      throw error;
    }
  }

  async createConnection(
    config: DatabaseConfig,
    options: ConnectionOptions = {}
  ): Promise<EntityManager> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const connection = await this.createNewConnection(config, mergedOptions);

    this.logger.debug(`创建独立连接: ${connection.info.id}`, LogContext.DATABASE);
    return connection.orm.em;
  }

  async closeConnection(config: DatabaseConfig): Promise<boolean> {
    const configHash = this.generateConfigHash(config);
    const pool = this.connectionPools.get(configHash);

    if (!pool) {
      return false;
    }

    try {
      const closePromises = pool.connections.map(async (connection) => {
        try {
          await connection.orm.close();
          this.logger.debug(`关闭连接: ${connection.info.id}`, LogContext.DATABASE);
        } catch (error) {
          this.logger.error(`关闭连接失败: ${connection.info.id}`, LogContext.DATABASE, undefined, error);
        }
      });

      await Promise.all(closePromises);

      // 更新统计信息
      this.stats.totalConnections -= pool.connections.length;
      this.stats.activeConnections -= pool.connections.filter(c => c.isInUse).length;
      this.stats.idleConnections -= pool.connections.filter(c => !c.isInUse).length;

      // 移除连接池
      this.connectionPools.delete(configHash);
      pool.stats.totalClosed += pool.connections.length;

      return true;
    } catch (error) {
      this.logger.error(`关闭连接池失败: ${configHash}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  async closeAllConnections(): Promise<number> {
    let totalClosed = 0;

    for (const [configHash, pool] of this.connectionPools) {
      try {
        const closePromises = pool.connections.map(async (connection) => {
          try {
            await connection.orm.close();
            totalClosed++;
            this.logger.debug(`关闭连接: ${connection.info.id}`, LogContext.DATABASE);
          } catch (error) {
            this.logger.error(`关闭连接失败: ${connection.info.id}`, LogContext.DATABASE, undefined, error);
          }
        });

        await Promise.all(closePromises);
        pool.stats.totalClosed += pool.connections.length;
      } catch (error) {
        this.logger.error(`关闭连接池失败: ${configHash}`, LogContext.DATABASE, undefined, error);
      }
    }

    // 重置统计信息
    this.stats.totalConnections = 0;
    this.stats.activeConnections = 0;
    this.stats.idleConnections = 0;

    // 清空连接池
    this.connectionPools.clear();

    this.logger.info(`已关闭所有连接，总计: ${totalClosed}`, LogContext.DATABASE);
    return totalClosed;
  }

  // 健康检查和监控方法
  async healthCheck(config: DatabaseConfig): Promise<ConnectionHealthCheck> {
    const configHash = this.generateConfigHash(config);
    const pool = this.connectionPools.get(configHash);

    if (!pool || pool.connections.length === 0) {
      return {
        isHealthy: false,
        responseTime: 0,
        error: '没有可用的连接',
        checkedAt: new Date(),
        connectionInfo: {
          id: 'unknown',
          databaseType: config.type,
          host: config.host,
          port: config.port,
          database: config.database,
          status: ConnectionStatus.DISCONNECTED,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          connectionTime: 0,
          isActive: false,
          configHash,
        },
      };
    }

    // 使用第一个连接进行健康检查
    const connection = pool.connections[0];
    const startTime = Date.now();

    try {
      // 执行简单查询测试连接
      await connection.orm.em.getConnection().execute('SELECT 1');

      const responseTime = Date.now() - startTime;
      const healthCheck: ConnectionHealthCheck = {
        isHealthy: true,
        responseTime,
        checkedAt: new Date(),
        connectionInfo: connection.info,
      };

      connection.healthCheck = healthCheck;
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: ConnectionHealthCheck = {
        isHealthy: false,
        responseTime,
        error: error.message,
        checkedAt: new Date(),
        connectionInfo: connection.info,
      };

      connection.healthCheck = healthCheck;
      return healthCheck;
    }
  }

  getConnectionInfo(config: DatabaseConfig): ConnectionInfo | null {
    const configHash = this.generateConfigHash(config);
    const pool = this.connectionPools.get(configHash);

    if (!pool || pool.connections.length === 0) {
      return null;
    }

    // 返回第一个连接的信息
    return pool.connections[0].info;
  }

  getAllConnectionInfo(): ConnectionInfo[] {
    const allInfo: ConnectionInfo[] = [];

    for (const pool of this.connectionPools.values()) {
      allInfo.push(...pool.connections.map(conn => conn.info));
    }

    return allInfo;
  }

  getConnectionPoolInfo(config: DatabaseConfig): ConnectionPoolInfo | null {
    const configHash = this.generateConfigHash(config);
    const pool = this.connectionPools.get(configHash);

    if (!pool) {
      return null;
    }

    const activeConnections = pool.connections.filter(c => c.isInUse).length;
    const idleConnections = pool.connections.filter(c => !c.isInUse).length;
    const waitingConnections = pool.waitingQueue.length;

    // 计算连接池状态
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const utilizationRate = activeConnections / pool.maxConnections;

    if (utilizationRate > 0.8) {
      status = 'critical';
    } else if (utilizationRate > 0.6) {
      status = 'warning';
    }

    return {
      totalConnections: pool.connections.length,
      activeConnections,
      idleConnections,
      waitingConnections,
      maxConnections: pool.maxConnections,
      minConnections: pool.minConnections,
      status,
      averageConnectionTime: pool.stats.averageConnectionTime,
      successRate: pool.stats.totalErrors === 0 ? 1.0 :
        (pool.stats.totalCreated - pool.stats.totalErrors) / pool.stats.totalCreated,
    };
  }

  // 适配器管理方法
  setAdapter(adapter: IMikroOrmAdapter): void {
    this.adapters.set(adapter.supportedDatabaseType, adapter);
    this.logger.debug(`设置适配器: ${adapter.adapterName}`, LogContext.DATABASE);
  }

  getAdapter(databaseType: DatabaseType): IMikroOrmAdapter | null {
    return this.adapters.get(databaseType) || null;
  }

  // 连接状态管理方法
  hasConnection(config: DatabaseConfig): boolean {
    const configHash = this.generateConfigHash(config);
    const pool = this.connectionPools.get(configHash);
    return pool !== undefined && pool.connections.length > 0;
  }

  getConnectionCount(): number {
    let total = 0;
    for (const pool of this.connectionPools.values()) {
      total += pool.connections.length;
    }
    return total;
  }

  // 连接维护方法
  async cleanupIdleConnections(maxIdleTime: number = 300000): Promise<number> { // 5分钟
    let totalCleaned = 0;
    const now = Date.now();

    for (const [configHash, pool] of this.connectionPools) {
      const connectionsToRemove: ConnectionEntry[] = [];

      for (const connection of pool.connections) {
        if (!connection.isInUse &&
          (now - connection.lastUsedAt.getTime()) > maxIdleTime &&
          pool.connections.length > pool.minConnections) {
          connectionsToRemove.push(connection);
        }
      }

      for (const connection of connectionsToRemove) {
        try {
          await connection.orm.close();
          pool.connections = pool.connections.filter(c => c !== connection);
          pool.stats.totalClosed++;
          totalCleaned++;

          this.stats.totalConnections--;
          this.stats.idleConnections--;

          this.logger.debug(`清理空闲连接: ${connection.info.id}`, LogContext.DATABASE);
        } catch (error) {
          this.logger.error(`清理连接失败: ${connection.info.id}`, LogContext.DATABASE, undefined, error);
        }
      }
    }

    if (totalCleaned > 0) {
      this.logger.info(`清理了 ${totalCleaned} 个空闲连接`, LogContext.DATABASE);
    }

    return totalCleaned;
  }

  async forceReconnect(config: DatabaseConfig): Promise<boolean> {
    try {
      // 先关闭现有连接
      await this.closeConnection(config);

      // 创建新连接
      await this.getConnection(config, { forceReconnect: true });

      this.logger.info(`强制重连成功: ${config.host}:${config.port}`, LogContext.DATABASE);
      return true;
    } catch (error) {
      this.logger.error(`强制重连失败: ${config.host}:${config.port}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  // 统计信息方法
  getConnectionStats() {
    return { ...this.stats };
  }

  // 监控管理方法
  enableMonitoring(interval: number = 30000): void {
    if (this.monitoringTimer) {
      this.disableMonitoring();
    }

    this.monitoringInterval = interval;
    this.monitoringTimer = setInterval(() => {
      this.performMonitoring();
    }, interval);

    this.logger.info(`启用连接监控，间隔: ${interval}ms`, LogContext.DATABASE);
  }

  disableMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      this.logger.info('禁用连接监控', LogContext.DATABASE);
    }
  }

  isMonitoringEnabled(): boolean {
    return this.monitoringTimer !== undefined;
  }

  // 私有辅助方法
  private generateConfigHash(config: DatabaseConfig): string {
    const configString = JSON.stringify({
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
    });

    return createHash('md5').update(configString).digest('hex');
  }

  private createConnectionPool(config: DatabaseConfig, options: ConnectionOptions): ConnectionPool {
    return {
      connections: [],
      maxConnections: options.poolSize || 10,
      minConnections: Math.floor((options.poolSize || 10) * 0.2),
      waitingQueue: [],
      stats: {
        totalCreated: 0,
        totalClosed: 0,
        totalErrors: 0,
        averageConnectionTime: 0,
      },
    };
  }

  private async performMonitoring(): Promise<void> {
    try {
      // 执行健康检查
      for (const [configHash, pool] of this.connectionPools) {
        if (pool.connections.length > 0) {
          await this.healthCheck(pool.connections[0].info as any);
        }
      }

      // 清理空闲连接
      await this.cleanupIdleConnections();

      // 更新统计信息
      this.updateStats();
    } catch (error) {
      this.logger.error('监控执行失败', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * 创建新连接
   * 
   * @param config 数据库配置
   * @param options 连接选项
   * @returns 连接条目
   */
  private async createNewConnection(
    config: DatabaseConfig,
    options: ConnectionOptions
  ): Promise<ConnectionEntry> {
    const startTime = Date.now();
    const connectionId = uuidv4();

    try {
      const adapter = this.getAdapter(config.type);
      if (!adapter) {
        throw new Error(`未找到数据库类型 ${config.type} 的适配器`);
      }

      // 创建MikroORM配置
      const mikroOrmConfig = adapter.createMikroOrmConfig(config);

      // 创建MikroORM实例
      const orm = await MikroORM.init(mikroOrmConfig);

      const connectionTime = Date.now() - startTime;

      const connectionInfo: ConnectionInfo = {
        id: connectionId,
        databaseType: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        status: ConnectionStatus.CONNECTED,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        connectionTime,
        isActive: true,
        configHash: this.generateConfigHash(config),
      };

      const connection: ConnectionEntry = {
        orm,
        info: connectionInfo,
        lastUsedAt: new Date(),
        isInUse: false,
        retryCount: 0,
      };

      this.logger.debug(`创建连接成功: ${connectionId}, 耗时: ${connectionTime}ms`, LogContext.DATABASE);
      return connection;
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      this.logger.error(`创建连接失败: ${connectionId}, 耗时: ${connectionTime}ms`, LogContext.DATABASE, undefined, error);
      throw error;
    }
  }

  /**
   * 等待可用连接
   * 
   * @param pool 连接池
   * @param config 数据库配置
   * @param options 连接选项
   * @returns EntityManager实例
   */
  private waitForConnection(
    pool: ConnectionPool,
    config: DatabaseConfig,
    options: ConnectionOptions
  ): Promise<EntityManager> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('等待连接超时'));
      }, options.timeout || 30000);

      pool.waitingQueue.push({
        resolve: (em: EntityManager) => {
          clearTimeout(timeout);
          resolve(em);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      });
    });
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    let totalConnections = 0;
    let activeConnections = 0;
    let idleConnections = 0;
    let totalConnectionTime = 0;
    let connectionCount = 0;

    for (const pool of this.connectionPools.values()) {
      totalConnections += pool.connections.length;
      activeConnections += pool.connections.filter(c => c.isInUse).length;
      idleConnections += pool.connections.filter(c => !c.isInUse).length;

      for (const connection of pool.connections) {
        totalConnectionTime += connection.info.connectionTime;
        connectionCount++;
      }
    }

    this.stats.totalConnections = totalConnections;
    this.stats.activeConnections = activeConnections;
    this.stats.idleConnections = idleConnections;
    this.stats.averageConnectionTime = connectionCount > 0 ? totalConnectionTime / connectionCount : 0;
  }

  /**
   * 更新成功率
   */
  private updateSuccessRate(): void {
    const totalAttempts = this.stats.totalConnections + this.stats.failedConnections;
    this.stats.successRate = totalAttempts > 0 ?
      this.stats.totalConnections / totalAttempts : 1.0;
  }
}
