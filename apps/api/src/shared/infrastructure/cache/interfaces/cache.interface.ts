/**
 * @enum CacheType
 * @description 缓存类型枚举
 */
export enum CacheType {
  MEMORY = 'memory',
  REDIS = 'redis',
  HYBRID = 'hybrid',
}

/**
 * @enum CacheStrategy
 * @description 缓存策略枚举
 */
export enum CacheStrategy {
  LRU = 'lru',           // 最近最少使用
  LFU = 'lfu',           // 最少使用频率
  FIFO = 'fifo',         // 先进先出
  TTL = 'ttl',           // 基于时间过期
}

/**
 * @interface CacheOptions
 * @description 缓存选项接口
 */
export interface CacheOptions {
  /** 缓存类型 */
  type: CacheType;
  /** 缓存策略 */
  strategy: CacheStrategy;
  /** 默认过期时间（毫秒） */
  ttl?: number;
  /** 最大缓存项数量 */
  maxSize?: number;
  /** 是否启用压缩 */
  compress?: boolean;
  /** 是否启用加密 */
  encrypt?: boolean;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 连接超时（毫秒） */
  timeout?: number;
}

/**
 * @interface CacheKey
 * @description 缓存键接口
 */
export interface CacheKey {
  /** 键名 */
  key: string;
  /** 命名空间 */
  namespace?: string;
  /** 版本号 */
  version?: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 标签 */
  tags?: string[];
}

/**
 * @interface CacheValue<T>
 * @description 缓存值接口
 */
export interface CacheValue<T = any> {
  /** 实际值 */
  value: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt?: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: number;
  /** 版本号 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface CacheEntry<T>
 * @description 缓存条目接口
 */
export interface CacheEntry<T = any> {
  /** 缓存键 */
  key: CacheKey;
  /** 缓存值 */
  value: CacheValue<T>;
  /** 大小（字节） */
  size: number;
}

/**
 * @interface CacheStats
 * @description 缓存统计接口
 */
export interface CacheStats {
  /** 总条目数 */
  totalEntries: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 平均大小（字节） */
  averageSize: number;
  /** 过期条目数 */
  expiredEntries: number;
  /** 驱逐条目数 */
  evictedEntries: number;
  /** 最后重置时间 */
  lastReset: number;
}

/**
 * @interface CacheHealth
 * @description 缓存健康状态接口
 */
export interface CacheHealth {
  /** 是否健康 */
  healthy: boolean;
  /** 连接状态 */
  connected: boolean;
  /** 响应时间（毫秒） */
  responseTime: number;
  /** 错误信息 */
  error?: string;
  /** 最后检查时间 */
  lastCheck: number;
}

/**
 * @interface ICacheService
 * @description 缓存服务接口
 */
export interface ICacheService {
  /**
   * @method get
   * @description 获取缓存值
   * @param {CacheKey} key 缓存键
   * @returns {Promise<T | null>} 缓存值或null
   */
  get<T = any>(key: CacheKey): Promise<T | null>;

  /**
   * @method set
   * @description 设置缓存值
   * @param {CacheKey} key 缓存键
   * @param {T} value 缓存值
   * @param {Partial<CacheOptions>} options 缓存选项
   * @returns {Promise<boolean>} 是否成功
   */
  set<T = any>(key: CacheKey, value: T, options?: Partial<CacheOptions>): Promise<boolean>;

  /**
   * @method delete
   * @description 删除缓存值
   * @param {CacheKey} key 缓存键
   * @returns {Promise<boolean>} 是否成功
   */
  delete(key: CacheKey): Promise<boolean>;

  /**
   * @method exists
   * @description 检查缓存键是否存在
   * @param {CacheKey} key 缓存键
   * @returns {Promise<boolean>} 是否存在
   */
  exists(key: CacheKey): Promise<boolean>;

  /**
   * @method clear
   * @description 清空缓存
   * @param {string} namespace 命名空间（可选）
   * @returns {Promise<boolean>} 是否成功
   */
  clear(namespace?: string): Promise<boolean>;

  /**
   * @method getStats
   * @description 获取缓存统计
   * @returns {Promise<CacheStats>} 缓存统计
   */
  getStats(): Promise<CacheStats>;

  /**
   * @method getHealth
   * @description 获取缓存健康状态
   * @returns {Promise<CacheHealth>} 缓存健康状态
   */
  getHealth(): Promise<CacheHealth>;

  /**
   * @method resetStats
   * @description 重置缓存统计
   * @returns {Promise<void>}
   */
  resetStats(): Promise<void>;
}

/**
 * @interface ICacheManager
 * @description 缓存管理器接口
 */
export interface ICacheManager {
  /**
   * @method getCache
   * @description 获取缓存服务实例
   * @param {CacheType} type 缓存类型
   * @returns {ICacheService} 缓存服务实例
   */
  getCache(type: CacheType): ICacheService;

  /**
   * @method setDefaultCache
   * @description 设置默认缓存类型
   * @param {CacheType} type 缓存类型
   * @returns {void}
   */
  setDefaultCache(type: CacheType): void;

  /**
   * @method getDefaultCache
   * @description 获取默认缓存服务
   * @returns {ICacheService} 默认缓存服务
   */
  getDefaultCache(): ICacheService;

  /**
   * @method registerCache
   * @description 注册缓存服务
   * @param {CacheType} type 缓存类型
   * @param {ICacheService} service 缓存服务
   * @returns {void}
   */
  registerCache(type: CacheType, service: ICacheService): void;

  /**
   * @method unregisterCache
   * @description 注销缓存服务
   * @param {CacheType} type 缓存类型
   * @returns {boolean} 是否成功
   */
  unregisterCache(type: CacheType): boolean;

  /**
   * @method getAllCaches
   * @description 获取所有缓存服务
   * @returns {Map<CacheType, ICacheService>} 缓存服务映射
   */
  getAllCaches(): Map<CacheType, ICacheService>;

  /**
   * @method getStats
   * @description 获取所有缓存统计
   * @returns {Promise<Map<CacheType, CacheStats>>} 缓存统计映射
   */
  getStats(): Promise<Map<CacheType, CacheStats>>;

  /**
   * @method getHealth
   * @description 获取所有缓存健康状态
   * @returns {Promise<Map<CacheType, CacheHealth>>} 缓存健康状态映射
   */
  getHealth(): Promise<Map<CacheType, CacheHealth>>;
}

/**
 * @interface ICacheKeyFactory
 * @description 缓存键工厂接口
 */
export interface ICacheKeyFactory {
  /**
   * @method create
   * @description 创建缓存键
   * @param {string} key 基础键名
   * @param {Partial<CacheKey>} options 键选项
   * @returns {CacheKey} 缓存键
   */
  create(key: string, options?: Partial<CacheKey>): CacheKey;

  /**
   * @method createNamespace
   * @description 创建命名空间键
   * @param {string} namespace 命名空间
   * @param {string} key 键名
   * @param {Partial<CacheKey>} options 键选项
   * @returns {CacheKey} 缓存键
   */
  createNamespace(namespace: string, key: string, options?: Partial<CacheKey>): CacheKey;

  /**
   * @method createTenant
   * @description 创建租户键
   * @param {string} tenantId 租户ID
   * @param {string} key 键名
   * @param {Partial<CacheKey>} options 键选项
   * @returns {CacheKey} 缓存键
   */
  createTenant(tenantId: string, key: string, options?: Partial<CacheKey>): CacheKey;

  /**
   * @method createUser
   * @description 创建用户键
   * @param {string} userId 用户ID
   * @param {string} key 键名
   * @param {Partial<CacheKey>} options 键选项
   * @returns {CacheKey} 缓存键
   */
  createUser(userId: string, key: string, options?: Partial<CacheKey>): CacheKey;

  /**
   * @method createTagged
   * @description 创建带标签的键
   * @param {string} key 键名
   * @param {string[]} tags 标签数组
   * @param {Partial<CacheKey>} options 键选项
   * @returns {CacheKey} 缓存键
   */
  createTagged(key: string, tags: string[], options?: Partial<CacheKey>): CacheKey;

  /**
   * @method toString
   * @description 将缓存键转换为字符串
   * @param {CacheKey} cacheKey 缓存键
   * @returns {string} 字符串形式的键
   */
  toString(cacheKey: CacheKey): string;

  /**
   * @method parse
   * @description 解析字符串为缓存键
   * @param {string} keyString 键字符串
   * @returns {CacheKey} 缓存键
   */
  parse(keyString: string): CacheKey;
}

/**
 * @interface ICacheInvalidationService
 * @description 缓存失效服务接口
 */
export interface ICacheInvalidationService {
  /**
   * @method invalidateByKey
   * @description 根据键失效缓存
   * @param {CacheKey} key 缓存键
   * @returns {Promise<boolean>} 是否成功
   */
  invalidateByKey(key: CacheKey): Promise<boolean>;

  /**
   * @method invalidateByNamespace
   * @description 根据命名空间失效缓存
   * @param {string} namespace 命名空间
   * @returns {Promise<number>} 失效的条目数
   */
  invalidateByNamespace(namespace: string): Promise<number>;

  /**
   * @method invalidateByTenant
   * @description 根据租户失效缓存
   * @param {string} tenantId 租户ID
   * @returns {Promise<number>} 失效的条目数
   */
  invalidateByTenant(tenantId: string): Promise<number>;

  /**
   * @method invalidateByUser
   * @description 根据用户失效缓存
   * @param {string} userId 用户ID
   * @returns {Promise<number>} 失效的条目数
   */
  invalidateByUser(userId: string): Promise<number>;

  /**
   * @method invalidateByTags
   * @description 根据标签失效缓存
   * @param {string[]} tags 标签数组
   * @returns {Promise<number>} 失效的条目数
   */
  invalidateByTags(tags: string[]): Promise<number>;

  /**
   * @method invalidateByPattern
   * @description 根据模式失效缓存
   * @param {string} pattern 模式字符串
   * @returns {Promise<number>} 失效的条目数
   */
  invalidateByPattern(pattern: string): Promise<number>;

  /**
   * @method scheduleInvalidation
   * @description 计划失效缓存
   * @param {CacheKey} key 缓存键
   * @param {number} delay 延迟时间（毫秒）
   * @returns {Promise<string>} 计划ID
   */
  scheduleInvalidation(key: CacheKey, delay: number): Promise<string>;

  /**
   * @method cancelScheduledInvalidation
   * @description 取消计划失效
   * @param {string} scheduleId 计划ID
   * @returns {Promise<boolean>} 是否成功
   */
  cancelScheduledInvalidation(scheduleId: string): Promise<boolean>;
}
