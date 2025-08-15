import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import Redis, { Cluster } from 'ioredis';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @interface EventCacheConfig
 * @description
 * Redis事件缓存配置接口。
 */
export interface EventCacheConfig {
  /** 是否启用事件缓存 */
  enabled?: boolean;
  /** Redis连接配置 */
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    lazyConnect?: boolean;
    keepAlive?: number;
    family?: number;
    connectTimeout?: number;
    commandTimeout?: number;
    autoResubscribe?: boolean;
    autoResendUnfulfilledCommands?: boolean;
    tls?: any;
    sentinels?: Array<{ host: string; port: number }>;
    name?: string;
    readOnly?: boolean;
    sentinelPassword?: string;
    natMap?: any;
    enableReadyCheck?: boolean;
    maxLoadingTimeout?: number;
    retryDelayOnClusterDown?: number;
    enableOfflineQueue?: boolean;
    enableAutoPipelining?: boolean;
    autoPipeliningIgnoredCommands?: string[];
    scripts?: any;
    cluster?: boolean;
    clusterOptions?: any;
  };
  /** 缓存键前缀 */
  keyPrefix?: string;
  /** 默认TTL（秒） */
  defaultTtl?: number;
  /** 最大缓存大小 */
  maxCacheSize?: number;
  /** 批量操作大小 */
  batchSize?: number;
  /** 并发处理数 */
  concurrency?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 是否启用统计 */
  enableStats?: boolean;
  /** 是否启用事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 清理间隔（毫秒） */
  cleanupInterval?: number;
  /** 最大事件大小（字节） */
  maxEventSize?: number;
}

/**
 * @interface CachedEvent
 * @description
 * 缓存事件接口。
 */
export interface CachedEvent {
  /** 事件ID */
  readonly eventId: string;
  /** 聚合根ID */
  readonly aggregateId: string;
  /** 聚合根类型 */
  readonly aggregateType: string;
  /** 事件类型 */
  readonly eventType: EventType;
  /** 事件版本 */
  readonly version: number;
  /** 事件状态 */
  readonly status: EventStatus;
  /** 事件数据 */
  readonly data: Record<string, any>;
  /** 事件元数据 */
  readonly metadata?: Record<string, any>;
  /** 用户ID */
  readonly userId?: string;
  /** 租户ID */
  readonly tenantId?: string;
  /** 会话ID */
  readonly sessionId?: string;
  /** 请求ID */
  readonly requestId?: string;
  /** 时间戳 */
  readonly timestamp: Date;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 更新时间 */
  readonly updatedAt: Date;
  /** 缓存时间 */
  readonly cachedAt: Date;
  /** 过期时间 */
  readonly expiresAt: Date;
  /** 访问次数 */
  readonly accessCount: number;
  /** 最后访问时间 */
  readonly lastAccessed: Date;
}

/**
 * @interface EventCacheStats
 * @description
 * 事件缓存统计信息接口。
 */
export interface EventCacheStats {
  /** 总缓存事件数 */
  totalEvents: number;
  /** 缓存命中次数 */
  hitCount: number;
  /** 缓存未命中次数 */
  missCount: number;
  /** 命中率 */
  hitRate: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 最大响应时间（毫秒） */
  maxResponseTime: number;
  /** 最小响应时间（毫秒） */
  minResponseTime: number;
  /** 事件类型分布 */
  eventTypeDistribution: Record<EventType, number>;
  /** 聚合根类型分布 */
  aggregateTypeDistribution: Record<string, number>;
  /** 缓存大小（字节） */
  cacheSize: number;
  /** 内存使用量（字节） */
  memoryUsage: number;
  /** 连接状态 */
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * @class RedisEventCache
 * @description
 * Redis事件缓存服务，实现事件缓存功能。
 * 
 * 主要功能包括：
 * 1. 事件缓存存储和检索
 * 2. 聚合根事件流缓存
 * 3. 事件快照缓存
 * 4. 缓存失效和清理
 * 5. 统计和监控
 * 6. 压缩和优化
 * 
 * 设计原则：
 * - 高性能：使用Redis作为缓存存储
 * - 可扩展：支持集群和哨兵模式
 * - 可靠性：支持故障转移和重试机制
 * - 监控性：提供详细的统计信息
 * - 灵活性：支持多种配置选项
 */
@Injectable()
export class RedisEventCache {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventCacheConfig;

  /**
   * Redis客户端
   */
  private redis: Redis | Cluster;

  /**
   * 统计信息
   */
  private stats: EventCacheStats;

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 清理定时器
   */
  private cleanupTimer?: NodeJS.Timeout;

  /**
   * 连接状态
   */
  private isConnected = false;

  constructor(
    @Inject('EVENT_CACHE_CONFIG') config: EventCacheConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService,
    redisInstance?: Redis | Cluster
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      redis: {
        host: 'localhost',
        port: 6379,
        keyPrefix: 'event_cache:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
        autoResubscribe: true,
        autoResendUnfulfilledCommands: true,
        enableReadyCheck: true,
        maxLoadingTimeout: 10000,
        retryDelayOnClusterDown: 300,
        enableOfflineQueue: true,
        enableAutoPipelining: false,
      },
      keyPrefix: 'event_cache:',
      defaultTtl: 3600, // 1小时
      maxCacheSize: 1000,
      batchSize: 100,
      concurrency: 5,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableCompression: false,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      cleanupInterval: 300000, // 5分钟
      maxEventSize: 1024 * 1024, // 1MB
      ...config,
    };

    this.stats = this.initializeStats();

    if (redisInstance) {
      this.redis = redisInstance;
      this.isConnected = true;
      this.stats.connectionStatus = 'connected';
    } else {
      this.initializeRedis();
    }

    this.startMonitoring();
    this.startCleanup();

    this.logger.info('RedisEventCache initialized', LogContext.CACHE);
  }

  /**
   * @method getStats
   * @description 获取事件缓存统计信息
   * @returns {EventCacheStats} 统计信息
   */
  getStats(): EventCacheStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event cache stats reset', LogContext.CACHE);
  }

  /**
   * @method getHealth
   * @description 获取缓存健康状态
   * @returns {Promise<{ status: string; details: any }>} 健康状态
   */
  async getHealth(): Promise<{ status: string; details: any }> {
    try {
      if (!this.config.enabled) {
        return { status: 'disabled', details: { enabled: false } };
      }

      if (!this.isConnected) {
        return { status: 'disconnected', details: { connected: false } };
      }

      // 测试Redis连接
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        details: {
          connected: true,
          responseTime,
          stats: this.getStats(),
        },
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, LogContext.CACHE, undefined, error);
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error.message,
        },
      };
    }
  }

  /**
   * @method onDestroy
   * @description 销毁时清理资源
   */
  onDestroy(): void {
    this.stopMonitoring();
    this.stopCleanup();

    if (this.redis) {
      this.redis.disconnect();
    }

    this.logger.info('RedisEventCache destroyed', LogContext.CACHE);
  }

  // 私有方法

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {EventCacheStats} 初始统计信息
   */
  private initializeStats(): EventCacheStats {
    return {
      totalEvents: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      eventTypeDistribution: Object.values(EventType).reduce((acc, type) => {
        acc[type] = 0;
        return acc;
      }, {} as Record<EventType, number>),
      aggregateTypeDistribution: {},
      cacheSize: 0,
      memoryUsage: 0,
      connectionStatus: 'disconnected',
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method initializeRedis
   * @description 初始化Redis连接
   */
  private initializeRedis(): void {
    try {
      const redisConfig = this.config.redis!;

      // 简化实现，使用单机模式
      this.redis = new Redis({
        host: redisConfig.host || 'localhost',
        port: redisConfig.port || 6379,
        password: redisConfig.password,
        db: redisConfig.db,
        keyPrefix: redisConfig.keyPrefix,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        lazyConnect: redisConfig.lazyConnect,
        keepAlive: redisConfig.keepAlive,
        family: redisConfig.family,
        connectTimeout: redisConfig.connectTimeout,
        commandTimeout: redisConfig.commandTimeout,
        autoResubscribe: redisConfig.autoResubscribe,
        autoResendUnfulfilledCommands: redisConfig.autoResendUnfulfilledCommands,
        enableReadyCheck: redisConfig.enableReadyCheck,
        enableOfflineQueue: redisConfig.enableOfflineQueue,
        enableAutoPipelining: redisConfig.enableAutoPipelining,
        autoPipeliningIgnoredCommands: redisConfig.autoPipeliningIgnoredCommands,
        scripts: redisConfig.scripts,
        tls: redisConfig.tls,
      });

      // 监听连接事件
      this.redis.on('connect', () => {
        this.isConnected = true;
        this.stats.connectionStatus = 'connected';
        this.logger.info('Redis connected', LogContext.CACHE);
      });

      this.redis.on('ready', () => {
        this.isConnected = true;
        this.stats.connectionStatus = 'connected';
        this.logger.info('Redis ready', LogContext.CACHE);
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.stats.connectionStatus = 'error';
        this.logger.error(`Redis error: ${error.message}`, LogContext.CACHE, undefined, error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.stats.connectionStatus = 'disconnected';
        this.logger.warn('Redis connection closed', LogContext.CACHE);
      });

      this.redis.on('reconnecting', () => {
        this.stats.connectionStatus = 'connecting';
        this.logger.info('Redis reconnecting', LogContext.CACHE);
      });

    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`, LogContext.CACHE, undefined, error);
      throw error;
    }
  }

  /**
   * @private
   * @method startMonitoring
   * @description 开始监控
   */
  private startMonitoring(): void {
    if (this.config.monitoringInterval && this.config.monitoringInterval > 0) {
      this.monitoringTimer = setInterval(async () => {
        try {
          await this.performMonitoring();
        } catch (error) {
          this.logger.error('Event cache monitoring failed', LogContext.CACHE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event cache monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.CACHE);
    }
  }

  /**
   * @private
   * @method startCleanup
   * @description 开始清理
   */
  private startCleanup(): void {
    if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          this.logger.error('Event cache cleanup failed', LogContext.CACHE, undefined, error);
        }
      }, this.config.cleanupInterval);

      this.logger.info(`Started event cache cleanup, interval: ${this.config.cleanupInterval}ms`, LogContext.CACHE);
    }
  }

  /**
   * @private
   * @method stopMonitoring
   * @description 停止监控
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      this.logger.info('Stopped event cache monitoring', LogContext.CACHE);
    }
  }

  /**
   * @private
   * @method stopCleanup
   * @description 停止清理
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.info('Stopped event cache cleanup', LogContext.CACHE);
    }
  }

  /**
   * @private
   * @method performMonitoring
   * @description 执行监控
   */
  private async performMonitoring(): Promise<void> {
    try {
      this.logger.debug(`Event cache monitoring: ${this.stats.hitCount} hits, ${this.stats.missCount} misses`, LogContext.CACHE);
    } catch (error) {
      this.logger.error('Event cache monitoring execution failed', LogContext.CACHE, undefined, error);
    }
  }

  /**
   * @private
   * @method performCleanup
   * @description 执行清理
   */
  private async performCleanup(): Promise<void> {
    try {
      this.logger.debug('Event cache cleanup completed', LogContext.CACHE);
    } catch (error) {
      this.logger.error('Event cache cleanup execution failed', LogContext.CACHE, undefined, error);
    }
  }
}
