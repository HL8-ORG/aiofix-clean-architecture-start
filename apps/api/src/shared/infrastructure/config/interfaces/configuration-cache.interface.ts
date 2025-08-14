import type { ConfigValue, ConfigKey } from './configuration.interface';

/**
 * @enum CacheStrategy
 * @description
 * 缓存策略枚举，定义不同的缓存策略。
 */
export enum CacheStrategy {
  /** 无缓存 */
  NONE = 'none',
  /** 内存缓存 */
  MEMORY = 'memory',
  /** Redis缓存 */
  REDIS = 'redis',
  /** 文件缓存 */
  FILE = 'file',
  /** 分层缓存 */
  LAYERED = 'layered',
}

/**
 * @enum CacheEvictionPolicy
 * @description
 * 缓存淘汰策略枚举，定义缓存淘汰的策略。
 */
export enum CacheEvictionPolicy {
  /** 最近最少使用 */
  LRU = 'lru',
  /** 最不经常使用 */
  LFU = 'lfu',
  /** 先进先出 */
  FIFO = 'fifo',
  /** 随机淘汰 */
  RANDOM = 'random',
  /** 基于时间的淘汰 */
  TTL = 'ttl',
}

/**
 * @interface CacheOptions
 * @description
 * 缓存选项接口，定义缓存的选项参数。
 */
export interface CacheOptions {
  /** 缓存策略 */
  strategy?: CacheStrategy;
  /** 缓存时间（毫秒） */
  ttl?: number;
  /** 最大缓存大小 */
  maxSize?: number;
  /** 淘汰策略 */
  evictionPolicy?: CacheEvictionPolicy;
  /** 是否压缩 */
  compress?: boolean;
  /** 压缩级别 */
  compressionLevel?: number;
  /** 是否序列化 */
  serialize?: boolean;
  /** 自定义选项 */
  custom?: Record<string, any>;
}

/**
 * @interface CacheEntry<T = any>
 * @description
 * 缓存条目接口，定义缓存条目的结构。
 */
export interface CacheEntry<T = any> {
  /** 缓存键 */
  readonly key: string;
  /** 缓存值 */
  readonly value: T;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 最后访问时间 */
  readonly lastAccessed: Date;
  /** 过期时间 */
  readonly expiresAt?: Date;
  /** 访问次数 */
  readonly accessCount: number;
  /** 数据大小 */
  readonly size: number;
  /** 是否压缩 */
  readonly isCompressed: boolean;
  /** 是否序列化 */
  readonly isSerialized: boolean;
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface CacheStats
 * @description
 * 缓存统计信息接口，定义缓存的统计信息。
 */
export interface CacheStats {
  /** 总条目数 */
  readonly totalEntries: number;
  /** 命中次数 */
  readonly hits: number;
  /** 未命中次数 */
  readonly misses: number;
  /** 命中率 */
  readonly hitRate: number;
  /** 平均访问时间（毫秒） */
  readonly averageAccessTime: number;
  /** 总内存使用量 */
  readonly totalMemoryUsage: number;
  /** 最大内存使用量 */
  readonly maxMemoryUsage: number;
  /** 内存使用率 */
  readonly memoryUsageRate: number;
  /** 淘汰次数 */
  readonly evictions: number;
  /** 过期次数 */
  readonly expirations: number;
  /** 各策略使用情况 */
  readonly strategyUsage: Record<CacheStrategy, number>;
}

/**
 * @interface CacheEvent
 * @description
 * 缓存事件接口，定义缓存事件的类型。
 */
export interface CacheEvent {
  /** 事件类型 */
  readonly type: 'set' | 'get' | 'delete' | 'clear' | 'expire' | 'evict';
  /** 缓存键 */
  readonly key: string;
  /** 事件时间 */
  readonly timestamp: Date;
  /** 事件详情 */
  readonly details?: Record<string, any>;
}

/**
 * @interface CacheLayer
 * @description
 * 缓存层接口，定义缓存层的结构。
 */
export interface CacheLayer {
  /** 层名称 */
  readonly name: string;
  /** 层策略 */
  readonly strategy: CacheStrategy;
  /** 层优先级 */
  readonly priority: number;
  /** 层选项 */
  readonly options: CacheOptions;
  /** 层统计 */
  readonly stats: CacheStats;
}

/**
 * @interface IConfigurationCacheService
 * @description
 * 配置缓存服务接口，定义配置缓存的核心功能。
 * 
 * 主要职责：
 * 1. 配置值的缓存存储和检索
 * 2. 缓存策略的管理
 * 3. 缓存性能优化
 * 4. 缓存一致性保证
 * 5. 缓存监控和统计
 * 6. 缓存清理和维护
 * 
 * 设计原则：
 * - 高性能：快速的缓存读写操作
 * - 一致性：确保缓存数据的一致性
 * - 可扩展：支持多种缓存策略和存储方式
 * - 可监控：提供完整的缓存监控和统计
 * - 可配置：灵活的缓存配置选项
 * - 容错性：缓存故障时的降级处理
 */
export interface IConfigurationCacheService {
  /**
   * 获取缓存值
   * 
   * @param key 缓存键
   * @param options 缓存选项
   * @returns 缓存值
   */
  get<T = any>(key: string | ConfigKey, options?: CacheOptions): Promise<T | null>;

  /**
   * 设置缓存值
   * 
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns 是否成功设置
   */
  set<T = any>(key: string | ConfigKey, value: T, options?: CacheOptions): Promise<boolean>;

  /**
   * 删除缓存值
   * 
   * @param key 缓存键
   * @returns 是否成功删除
   */
  delete(key: string | ConfigKey): Promise<boolean>;

  /**
   * 检查缓存是否存在
   * 
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string | ConfigKey): Promise<boolean>;

  /**
   * 获取缓存条目
   * 
   * @param key 缓存键
   * @returns 缓存条目
   */
  getEntry<T = any>(key: string | ConfigKey): Promise<CacheEntry<T> | null>;

  /**
   * 批量获取缓存值
   * 
   * @param keys 缓存键列表
   * @param options 缓存选项
   * @returns 缓存值映射
   */
  getBatch<T = any>(
    keys: (string | ConfigKey)[],
    options?: CacheOptions
  ): Promise<Record<string, T | null>>;

  /**
   * 批量设置缓存值
   * 
   * @param entries 缓存条目映射
   * @param options 缓存选项
   * @returns 成功设置的条目数量
   */
  setBatch<T = any>(
    entries: Record<string, T>,
    options?: CacheOptions
  ): Promise<number>;

  /**
   * 批量删除缓存值
   * 
   * @param keys 缓存键列表
   * @returns 成功删除的条目数量
   */
  deleteBatch(keys: (string | ConfigKey)[]): Promise<number>;

  /**
   * 获取缓存键列表
   * 
   * @param pattern 匹配模式
   * @returns 缓存键列表
   */
  getKeys(pattern?: string): Promise<string[]>;

  /**
   * 清除所有缓存
   * 
   * @returns 清除的条目数量
   */
  clear(): Promise<number>;

  /**
   * 清除过期缓存
   * 
   * @returns 清除的条目数量
   */
  clearExpired(): Promise<number>;

  /**
   * 刷新缓存
   * 
   * @param key 缓存键（可选，不指定则刷新所有）
   * @returns 刷新的条目数量
   */
  refresh(key?: string | ConfigKey): Promise<number>;

  /**
   * 预热缓存
   * 
   * @param entries 预热条目映射
   * @param options 缓存选项
   * @returns 预热的条目数量
   */
  warmup<T = any>(
    entries: Record<string, T>,
    options?: CacheOptions
  ): Promise<number>;

  /**
   * 获取缓存统计信息
   * 
   * @returns 统计信息
   */
  getStats(): Promise<CacheStats>;

  /**
   * 获取缓存层信息
   * 
   * @returns 缓存层列表
   */
  getLayers(): CacheLayer[];

  /**
   * 添加缓存层
   * 
   * @param layer 缓存层
   * @returns 是否成功添加
   */
  addLayer(layer: CacheLayer): boolean;

  /**
   * 移除缓存层
   * 
   * @param layerName 层名称
   * @returns 是否成功移除
   */
  removeLayer(layerName: string): boolean;

  /**
   * 设置缓存策略
   * 
   * @param strategy 缓存策略
   * @param options 策略选项
   * @returns 是否成功设置
   */
  setStrategy(strategy: CacheStrategy, options?: CacheOptions): boolean;

  /**
   * 获取当前缓存策略
   * 
   * @returns 当前策略
   */
  getStrategy(): CacheStrategy;

  /**
   * 设置缓存选项
   * 
   * @param options 缓存选项
   * @returns 是否成功设置
   */
  setOptions(options: CacheOptions): boolean;

  /**
   * 获取当前缓存选项
   * 
   * @returns 当前选项
   */
  getOptions(): CacheOptions;

  /**
   * 启用缓存
   * 
   * @param enabled 是否启用
   */
  enable(enabled: boolean): void;

  /**
   * 检查缓存是否启用
   * 
   * @returns 是否启用
   */
  isEnabled(): boolean;

  /**
   * 监听缓存事件
   * 
   * @param eventType 事件类型
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  on(eventType: CacheEvent['type'], callback: (event: CacheEvent) => void): () => void;

  /**
   * 获取缓存事件历史
   * 
   * @param limit 限制数量
   * @returns 事件历史
   */
  getEventHistory(limit?: number): CacheEvent[];

  /**
   * 导出缓存数据
   * 
   * @param format 导出格式
   * @returns 导出的数据
   */
  export(format?: 'json' | 'yaml'): Promise<string>;

  /**
   * 导入缓存数据
   * 
   * @param data 导入数据
   * @param format 导入格式
   * @returns 导入的条目数量
   */
  import(data: string, format?: 'json' | 'yaml'): Promise<number>;

  /**
   * 备份缓存
   * 
   * @returns 备份数据
   */
  backup(): Promise<string>;

  /**
   * 恢复缓存
   * 
   * @param backupData 备份数据
   * @returns 恢复的条目数量
   */
  restore(backupData: string): Promise<number>;

  /**
   * 获取缓存大小
   * 
   * @returns 缓存大小
   */
  size(): Promise<number>;

  /**
   * 获取缓存内存使用量
   * 
   * @returns 内存使用量
   */
  memoryUsage(): Promise<number>;

  /**
   * 检查缓存健康状态
   * 
   * @returns 健康状态
   */
  healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }>;

  /**
   * 优化缓存
   * 
   * @returns 优化结果
   */
  optimize(): Promise<{
    optimized: boolean;
    details: Record<string, any>;
  }>;
}
