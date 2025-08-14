import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IConfigurationCacheService,
  CacheStrategy,
  CacheEvictionPolicy,
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheEvent,
  CacheLayer,
} from '../interfaces/configuration-cache.interface';
import type { ConfigValue, ConfigKey } from '../interfaces/configuration.interface';

/**
 * @class ConfigurationCacheService
 * @description
 * 配置缓存服务实现类，提供配置值的缓存存储和检索功能。
 * 
 * 主要功能包括：
 * 1. 支持多种缓存策略（内存、Redis、文件、分层缓存等）
 * 2. 灵活的缓存选项配置（TTL、淘汰策略、压缩等）
 * 3. 高性能的缓存操作（批量操作、异步处理）
 * 4. 完整的缓存监控和统计
 * 5. 缓存事件监听和审计
 * 6. 缓存健康检查和优化
 * 
 * @implements {IConfigurationCacheService}
 */
@Injectable()
export class ConfigurationCacheService implements IConfigurationCacheService {
  private readonly logger = new Logger(ConfigurationCacheService.name);

  // 缓存存储
  private readonly cache: Map<string, CacheEntry> = new Map();

  // 缓存配置
  private enabled = true;
  private strategy: CacheStrategy = CacheStrategy.MEMORY;
  private options: CacheOptions = {
    ttl: 5 * 60 * 1000, // 默认5分钟
    maxSize: 1000,
    evictionPolicy: CacheEvictionPolicy.LRU,
    compress: false,
    serialize: true,
  };

  // 缓存层
  private readonly layers: CacheLayer[] = [];

  // 统计信息
  private hits = 0;
  private misses = 0;
  private totalAccessTime = 0;
  private accessCount = 0;
  private evictions = 0;
  private expirations = 0;
  private strategyUsage: Record<CacheStrategy, number> = {
    [CacheStrategy.NONE]: 0,
    [CacheStrategy.MEMORY]: 0,
    [CacheStrategy.REDIS]: 0,
    [CacheStrategy.FILE]: 0,
    [CacheStrategy.LAYERED]: 0,
  };

  // 事件历史
  private readonly eventHistory: CacheEvent[] = [];
  private readonly maxEventHistory = 1000;

  // 事件监听器
  private readonly eventListeners: Map<CacheEvent['type'], Set<(event: CacheEvent) => void>> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeDefaultLayer();
    this.startCleanupInterval();
  }

  /**
   * @method get
   * @description 获取缓存值
   * @param key 缓存键
   * @param options 缓存选项
   * @returns {Promise<T | null>} 缓存值
   */
  async get<T = any>(key: string | ConfigKey, options?: CacheOptions): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(key);

    try {
      const entry = this.cache.get(cacheKey);
      if (!entry) {
        this.updateStats(false, Date.now() - startTime);
        this.emitEvent('get', cacheKey, { found: false });
        return null;
      }

      // 检查是否过期
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.cache.delete(cacheKey);
        this.expirations++;
        this.updateStats(false, Date.now() - startTime);
        this.emitEvent('expire', cacheKey, { expiredAt: entry.expiresAt });
        return null;
      }

      // 更新访问统计
      entry.lastAccessed = new Date();
      entry.accessCount++;

      this.updateStats(true, Date.now() - startTime);
      this.emitEvent('get', cacheKey, { found: true, accessCount: entry.accessCount });

      return entry.value as T;
    } catch (error) {
      this.logger.error(`Failed to get cache: ${cacheKey}`, error);
      this.updateStats(false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * @method set
   * @description 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param options 缓存选项
   * @returns {Promise<boolean>} 是否成功设置
   */
  async set<T = any>(key: string | ConfigKey, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(key);
    const mergedOptions = { ...this.options, ...options };

    try {
      // 检查缓存大小限制
      if (this.cache.size >= (mergedOptions.maxSize || this.options.maxSize!)) {
        this.evict(mergedOptions.evictionPolicy || this.options.evictionPolicy!);
      }

      // 序列化值
      const serializedValue = mergedOptions.serialize ? JSON.stringify(value) : value;
      const valueSize = typeof serializedValue === 'string' ? serializedValue.length : 0;

      // 创建缓存条目
      const entry: CacheEntry<T> = {
        key: cacheKey,
        value: value as T,
        createdAt: new Date(),
        lastAccessed: new Date(),
        expiresAt: mergedOptions.ttl ? new Date(Date.now() + mergedOptions.ttl) : undefined,
        accessCount: 0,
        size: valueSize,
        isCompressed: mergedOptions.compress || false,
        isSerialized: mergedOptions.serialize || false,
        metadata: mergedOptions.custom || {},
      };

      this.cache.set(cacheKey, entry);
      // set 操作不计算命中率，只记录访问时间
      this.accessCount++;
      this.totalAccessTime += Date.now() - startTime;
      this.emitEvent('set', cacheKey, { size: valueSize, ttl: mergedOptions.ttl });

      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache: ${cacheKey}`, error);
      this.updateStats(false, Date.now() - startTime);
      return false;
    }
  }

  /**
   * @method delete
   * @description 删除缓存值
   * @param key 缓存键
   * @returns {Promise<boolean>} 是否成功删除
   */
  async delete(key: string | ConfigKey): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const cacheKey = this.buildCacheKey(key);

    try {
      const deleted = this.cache.delete(cacheKey);
      if (deleted) {
        this.emitEvent('delete', cacheKey, {});
      }
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete cache: ${cacheKey}`, error);
      return false;
    }
  }

  /**
   * @method has
   * @description 检查缓存是否存在
   * @param key 缓存键
   * @returns {Promise<boolean>} 是否存在
   */
  async has(key: string | ConfigKey): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const cacheKey = this.buildCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(cacheKey);
      this.expirations++;
      return false;
    }

    return true;
  }

  /**
   * @method getEntry
   * @description 获取缓存条目
   * @param key 缓存键
   * @returns {Promise<CacheEntry<T> | null>} 缓存条目
   */
  async getEntry<T = any>(key: string | ConfigKey): Promise<CacheEntry<T> | null> {
    if (!this.enabled) {
      return null;
    }

    const cacheKey = this.buildCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(cacheKey);
      this.expirations++;
      return null;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * @method getBatch
   * @description 批量获取缓存值
   * @param keys 缓存键列表
   * @param options 缓存选项
   * @returns {Promise<Record<string, T | null>>} 缓存值映射
   */
  async getBatch<T = any>(
    keys: (string | ConfigKey)[],
    options?: CacheOptions
  ): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    for (const key of keys) {
      const cacheKey = this.buildCacheKey(key);
      results[cacheKey] = await this.get<T>(key, options);
    }

    return results;
  }

  /**
   * @method setBatch
   * @description 批量设置缓存值
   * @param entries 缓存条目映射
   * @param options 缓存选项
   * @returns {Promise<number>} 成功设置的条目数量
   */
  async setBatch<T = any>(
    entries: Record<string, T>,
    options?: CacheOptions
  ): Promise<number> {
    let successCount = 0;

    for (const [key, value] of Object.entries(entries)) {
      const success = await this.set(key, value, options);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * @method deleteBatch
   * @description 批量删除缓存值
   * @param keys 缓存键列表
   * @returns {Promise<number>} 成功删除的条目数量
   */
  async deleteBatch(keys: (string | ConfigKey)[]): Promise<number> {
    let successCount = 0;

    for (const key of keys) {
      const success = await this.delete(key);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * @method getKeys
   * @description 获取缓存键列表
   * @param pattern 匹配模式
   * @returns {Promise<string[]>} 缓存键列表
   */
  async getKeys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());

    if (!pattern) {
      return keys;
    }

    // 简单的模式匹配，支持通配符 *
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  /**
   * @method clear
   * @description 清除所有缓存
   * @returns {Promise<number>} 清除的条目数量
   */
  async clear(): Promise<number> {
    const size = this.cache.size;
    this.cache.clear();

    // 重置统计信息
    this.hits = 0;
    this.misses = 0;
    this.totalAccessTime = 0;
    this.accessCount = 0;
    this.evictions = 0;
    this.expirations = 0;

    this.emitEvent('clear', '', { clearedCount: size });
    return size;
  }

  /**
   * @method clearExpired
   * @description 清除过期缓存
   * @returns {Promise<number>} 清除的条目数量
   */
  async clearExpired(): Promise<number> {
    let clearedCount = 0;
    const now = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        clearedCount++;
        this.expirations++;
        this.emitEvent('expire', key, { expiredAt: entry.expiresAt });
      }
    }

    return clearedCount;
  }

  /**
   * @method refresh
   * @description 刷新缓存
   * @param key 缓存键（可选，不指定则刷新所有）
   * @returns {Promise<number>} 刷新的条目数量
   */
  async refresh(key?: string | ConfigKey): Promise<number> {
    if (key) {
      const cacheKey = this.buildCacheKey(key);
      const entry = this.cache.get(cacheKey);
      if (entry) {
        entry.lastAccessed = new Date();
        return 1;
      }
      return 0;
    }

    // 刷新所有缓存
    let refreshedCount = 0;
    for (const entry of this.cache.values()) {
      entry.lastAccessed = new Date();
      refreshedCount++;
    }

    return refreshedCount;
  }

  /**
   * @method warmup
   * @description 预热缓存
   * @param entries 预热条目映射
   * @param options 缓存选项
   * @returns {Promise<number>} 预热的条目数量
   */
  async warmup<T = any>(
    entries: Record<string, T>,
    options?: CacheOptions
  ): Promise<number> {
    return this.setBatch(entries, options);
  }

  /**
   * @method getStats
   * @description 获取缓存统计信息
   * @returns {Promise<CacheStats>} 统计信息
   */
  async getStats(): Promise<CacheStats> {
    const totalEntries = this.cache.size;
    const hitRate = this.accessCount > 0 ? this.hits / this.accessCount : 0;
    const averageAccessTime = this.accessCount > 0 ? this.totalAccessTime / this.accessCount : 0;

    // 计算内存使用量
    let totalMemoryUsage = 0;
    for (const entry of this.cache.values()) {
      totalMemoryUsage += entry.size;
    }

    const maxMemoryUsage = this.options.maxSize || 1000;
    const memoryUsageRate = maxMemoryUsage > 0 ? totalMemoryUsage / maxMemoryUsage : 0;

    return {
      totalEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      averageAccessTime,
      totalMemoryUsage,
      maxMemoryUsage,
      memoryUsageRate,
      evictions: this.evictions,
      expirations: this.expirations,
      strategyUsage: { ...this.strategyUsage },
    };
  }

  /**
   * @method getLayers
   * @description 获取缓存层信息
   * @returns {CacheLayer[]} 缓存层列表
   */
  getLayers(): CacheLayer[] {
    return [...this.layers];
  }

  /**
   * @method addLayer
   * @description 添加缓存层
   * @param layer 缓存层
   * @returns {boolean} 是否成功添加
   */
  addLayer(layer: CacheLayer): boolean {
    try {
      this.layers.push(layer);
      this.layers.sort((a, b) => a.priority - b.priority);
      return true;
    } catch (error) {
      this.logger.error('Failed to add cache layer', error);
      return false;
    }
  }

  /**
   * @method removeLayer
   * @description 移除缓存层
   * @param layerName 层名称
   * @returns {boolean} 是否成功移除
   */
  removeLayer(layerName: string): boolean {
    const index = this.layers.findIndex(layer => layer.name === layerName);
    if (index !== -1) {
      this.layers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * @method setStrategy
   * @description 设置缓存策略
   * @param strategy 缓存策略
   * @param options 策略选项
   * @returns {boolean} 是否成功设置
   */
  setStrategy(strategy: CacheStrategy, options?: CacheOptions): boolean {
    try {
      this.strategy = strategy;
      if (options) {
        this.options = { ...this.options, ...options };
      }
      this.strategyUsage[strategy]++;
      return true;
    } catch (error) {
      this.logger.error('Failed to set cache strategy', error);
      return false;
    }
  }

  /**
   * @method getStrategy
   * @description 获取当前缓存策略
   * @returns {CacheStrategy} 当前策略
   */
  getStrategy(): CacheStrategy {
    return this.strategy;
  }

  /**
   * @method setOptions
   * @description 设置缓存选项
   * @param options 缓存选项
   * @returns {boolean} 是否成功设置
   */
  setOptions(options: CacheOptions): boolean {
    try {
      this.options = { ...this.options, ...options };
      return true;
    } catch (error) {
      this.logger.error('Failed to set cache options', error);
      return false;
    }
  }

  /**
   * @method getOptions
   * @description 获取当前缓存选项
   * @returns {CacheOptions} 当前选项
   */
  getOptions(): CacheOptions {
    return { ...this.options };
  }

  /**
   * @method enable
   * @description 启用缓存
   * @param enabled 是否启用
   */
  enable(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * @method isEnabled
   * @description 检查缓存是否启用
   * @returns {boolean} 是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * @method on
   * @description 监听缓存事件
   * @param eventType 事件类型
   * @param callback 回调函数
   * @returns {() => void} 取消监听的函数
   */
  on(eventType: CacheEvent['type'], callback: (event: CacheEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback);

    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * @method getEventHistory
   * @description 获取缓存事件历史
   * @param limit 限制数量
   * @returns {CacheEvent[]} 事件历史
   */
  getEventHistory(limit?: number): CacheEvent[] {
    const events = [...this.eventHistory];
    return limit ? events.slice(-limit) : events;
  }

  /**
   * @method export
   * @description 导出缓存数据
   * @param format 导出格式
   * @returns {Promise<string>} 导出的数据
   */
  async export(format?: 'json' | 'yaml'): Promise<string> {
    const data = {
      entries: Array.from(this.cache.entries()),
      stats: await this.getStats(),
      options: this.options,
      strategy: this.strategy,
    };

    return format === 'yaml' ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * @method import
   * @description 导入缓存数据
   * @param data 导入数据
   * @param format 导入格式
   * @returns {Promise<number>} 导入的条目数量
   */
  async import(data: string, format?: 'json' | 'yaml'): Promise<number> {
    try {
      const parsedData = JSON.parse(data);
      let importedCount = 0;

      if (parsedData.entries) {
        for (const [key, entry] of parsedData.entries) {
          this.cache.set(key, entry);
          importedCount++;
        }
      }

      return importedCount;
    } catch (error) {
      this.logger.error('Failed to import cache data', error);
      return 0;
    }
  }

  /**
   * @method backup
   * @description 备份缓存
   * @returns {Promise<string>} 备份数据
   */
  async backup(): Promise<string> {
    return this.export('json');
  }

  /**
   * @method restore
   * @description 恢复缓存
   * @param backupData 备份数据
   * @returns {Promise<number>} 恢复的条目数量
   */
  async restore(backupData: string): Promise<number> {
    return this.import(backupData, 'json');
  }

  /**
   * @method size
   * @description 获取缓存大小
   * @returns {Promise<number>} 缓存大小
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * @method memoryUsage
   * @description 获取缓存内存使用量
   * @returns {Promise<number>} 内存使用量
   */
  async memoryUsage(): Promise<number> {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * @method healthCheck
   * @description 检查缓存健康状态
   * @returns {Promise<{healthy: boolean, details: Record<string, any>}>} 健康状态
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const stats = await this.getStats();
      const memoryUsage = await this.memoryUsage();

      const healthy = this.enabled &&
        stats.memoryUsageRate < 0.9 &&
        stats.hitRate > 0.1;

      return {
        healthy,
        details: {
          enabled: this.enabled,
          totalEntries: stats.totalEntries,
          hitRate: stats.hitRate,
          memoryUsage,
          memoryUsageRate: stats.memoryUsageRate,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  }

  /**
   * @method optimize
   * @description 优化缓存
   * @returns {Promise<{optimized: boolean, details: Record<string, any>}>} 优化结果
   */
  async optimize(): Promise<{
    optimized: boolean;
    details: Record<string, any>;
  }> {
    try {
      const beforeStats = await this.getStats();
      const clearedExpired = await this.clearExpired();

      // 如果内存使用率过高，进行淘汰
      if (beforeStats.memoryUsageRate > 0.8) {
        this.evict(this.options.evictionPolicy || CacheEvictionPolicy.LRU);
      }

      const afterStats = await this.getStats();

      return {
        optimized: true,
        details: {
          clearedExpired,
          beforeEntries: beforeStats.totalEntries,
          afterEntries: afterStats.totalEntries,
          beforeMemoryUsage: beforeStats.totalMemoryUsage,
          afterMemoryUsage: afterStats.totalMemoryUsage,
        },
      };
    } catch (error) {
      return {
        optimized: false,
        details: { error: error.message },
      };
    }
  }

  // 私有方法

  /**
   * @private
   * @method buildCacheKey
   * @description 构建缓存键
   * @param key 原始键
   * @returns {string} 缓存键
   */
  private buildCacheKey(key: string | ConfigKey): string {
    if (typeof key === 'string') {
      return key;
    }

    // 如果是ConfigKey对象，构建复合键
    const parts = [];
    if (key.tenantId) parts.push(`tenant:${key.tenantId}`);
    if (key.module) parts.push(`module:${key.module}`);
    if (key.category) parts.push(`category:${key.category}`);
    if (key.name) parts.push(`name:${key.name}`);

    return parts.join(':') || 'default';
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param hit 是否命中
   * @param accessTime 访问时间
   */
  private updateStats(hit: boolean, accessTime: number): void {
    this.accessCount++;
    this.totalAccessTime += accessTime;

    if (hit) {
      this.hits++;
    } else {
      this.misses++;
    }
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送缓存事件
   * @param type 事件类型
   * @param key 缓存键
   * @param details 事件详情
   */
  private emitEvent(type: CacheEvent['type'], key: string, details?: Record<string, any>): void {
    const event: CacheEvent = {
      type,
      key,
      timestamp: new Date(),
      details,
    };

    // 添加到事件历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }

    // 通知监听器
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event);
        } catch (error) {
          this.logger.error(`Error in cache event listener: ${type}`, error);
        }
      }
    }

    // 发送到事件发射器
    this.eventEmitter.emit(`cache.${type}`, event);
  }

  /**
   * @private
   * @method evict
   * @description 执行缓存淘汰
   * @param policy 淘汰策略
   */
  private evict(policy: CacheEvictionPolicy): void {
    if (this.cache.size === 0) return;

    let keysToEvict: string[] = [];

    switch (policy) {
      case CacheEvictionPolicy.LRU:
        // 最近最少使用：按最后访问时间排序
        keysToEvict = Array.from(this.cache.entries())
          .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())
          .slice(0, Math.floor(this.cache.size * 0.1)) // 淘汰10%
          .map(([key]) => key);
        break;

      case CacheEvictionPolicy.LFU:
        // 最不经常使用：按访问次数排序
        keysToEvict = Array.from(this.cache.entries())
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, Math.floor(this.cache.size * 0.1)) // 淘汰10%
          .map(([key]) => key);
        break;

      case CacheEvictionPolicy.FIFO:
        // 先进先出：按创建时间排序
        keysToEvict = Array.from(this.cache.entries())
          .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime())
          .slice(0, Math.floor(this.cache.size * 0.1)) // 淘汰10%
          .map(([key]) => key);
        break;

      case CacheEvictionPolicy.RANDOM:
        // 随机淘汰
        const allKeys = Array.from(this.cache.keys());
        const evictCount = Math.floor(this.cache.size * 0.1); // 淘汰10%
        for (let i = 0; i < evictCount && allKeys.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * allKeys.length);
          keysToEvict.push(allKeys.splice(randomIndex, 1)[0]);
        }
        break;

      default:
        return;
    }

    // 执行淘汰
    for (const key of keysToEvict) {
      this.cache.delete(key);
      this.evictions++;
      this.emitEvent('evict', key, { policy });
    }
  }

  /**
   * @private
   * @method initializeDefaultLayer
   * @description 初始化默认缓存层
   */
  private initializeDefaultLayer(): void {
    const defaultLayer: CacheLayer = {
      name: 'memory',
      strategy: CacheStrategy.MEMORY,
      priority: 1,
      options: this.options,
      stats: {
        totalEntries: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageAccessTime: 0,
        totalMemoryUsage: 0,
        maxMemoryUsage: this.options.maxSize || 1000,
        memoryUsageRate: 0,
        evictions: 0,
        expirations: 0,
        strategyUsage: { ...this.strategyUsage },
      },
    };

    this.layers.push(defaultLayer);
  }

  /**
   * @private
   * @method startCleanupInterval
   * @description 启动清理定时器
   */
  private startCleanupInterval(): void {
    // 每分钟清理一次过期缓存
    const interval = setInterval(async () => {
      try {
        await this.clearExpired();
      } catch (error) {
        this.logger.error('Failed to clear expired cache', error);
      }
    }, 60 * 1000);

    // 在测试环境中，不启动定时器
    if (process.env.NODE_ENV === 'test') {
      clearInterval(interval);
    }
  }
}
