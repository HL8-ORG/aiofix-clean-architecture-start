import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IConfigurationLoader,
  LoaderType,
  LoaderOptions,
  LoaderResult,
  LoaderStats,
} from '../interfaces/configuration-loader.interface';
import type { ConfigValue, ConfigKey } from '../interfaces/configuration.interface';
import { ConfigSource } from '../interfaces/configuration.interface';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';

/**
 * @class ConfigurationLoaderService
 * @description
 * 配置加载器服务实现类，提供配置加载的核心功能。
 * 
 * 主要功能包括：
 * 1. 支持多种配置源（环境变量、文件、数据库、远程配置等）
 * 2. 配置加载的优先级管理
 * 3. 配置的缓存和刷新机制
 * 4. 配置的验证和转换
 * 5. 配置的监控和统计
 * 6. 配置的容错和重试机制
 * 
 * @implements {IConfigurationLoader}
 */
@Injectable()
export class ConfigurationLoaderService implements IConfigurationLoader {
  private readonly logger: PinoLoggerService;

  // 加载器存储
  private readonly loaders: Map<LoaderType, IConfigurationLoader> = new Map();
  private readonly loaderOptions: Map<LoaderType, LoaderOptions> = new Map();

  // 缓存存储
  private readonly cache: Map<string, LoaderResult> = new Map();

  // 统计信息
  private readonly stats: Map<LoaderType, {
    totalLoads: number;
    successfulLoads: number;
    failedLoads: number;
    totalLoadTime: number;
    lastLoadTime?: Date;
  }> = new Map();

  // 事件历史
  private readonly eventHistory: any[] = [];
  private readonly maxEventHistory = 1000;

  // 事件监听器
  private readonly eventListeners: Map<'load' | 'error' | 'refresh', Set<(event: any) => void>> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.initializeDefaultLoaders();
  }

  /**
   * @method load
   * @description 加载配置值
   * @param key 配置键
   * @param options 加载选项
   * @returns {Promise<LoaderResult<T>>} 加载结果
   */
  async load<T = any>(key: string | ConfigKey, options?: LoaderOptions): Promise<LoaderResult<T>> {
    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(key);

    try {
      // 检查缓存
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult && !options?.custom?.forceRefresh) {
        this.updateStats(LoaderType.MEMORY, true, Date.now() - startTime);
        this.emitEvent('load', { key: cacheKey, source: 'cache' });
        return cachedResult as LoaderResult<T>;
      }

      // 按优先级尝试加载器
      const sortedLoaders = this.getSortedLoaders();
      let lastError: string | undefined;

      for (const { loader, options: loaderOpts } of sortedLoaders) {
        if (!loaderOpts.enabled) continue;

        try {
          const result = await this.loadWithRetry(loader, key, loaderOpts);
          if (result.success) {
            // 缓存结果
            this.cache.set(cacheKey, result);
            this.updateStats(loaderOpts.type, true, Date.now() - startTime);
            this.emitEvent('load', { key: cacheKey, source: loaderOpts.type, success: true });
            return result as LoaderResult<T>;
          }
          lastError = result.error;
        } catch (error) {
          lastError = error.message;
          this.updateStats(loaderOpts.type, false, Date.now() - startTime);
          this.emitEvent('error', { key: cacheKey, source: loaderOpts.type, error: error.message });
        }
      }

      // 所有加载器都失败了
      const failedResult: LoaderResult<T> = {
        success: false,
        source: ConfigSource.DEFAULT,
        loadTime: Date.now() - startTime,
        error: lastError || 'All loaders failed',
        metadata: {},
      };

      this.emitEvent('error', { key: cacheKey, error: lastError });
      return failedResult;
    } catch (error) {
      this.logger.error(`Failed to load config: ${cacheKey}`, LogContext.CONFIG, undefined, error);
      const errorResult: LoaderResult<T> = {
        success: false,
        source: ConfigSource.DEFAULT,
        loadTime: Date.now() - startTime,
        error: error.message,
        metadata: {},
      };
      this.emitEvent('error', { key: cacheKey, error: error.message });
      return errorResult;
    }
  }

  /**
   * @method loadBatch
   * @description 批量加载配置
   * @param keys 配置键列表
   * @param options 加载选项
   * @returns {Promise<Record<string, LoaderResult<T>>>} 加载结果映射
   */
  async loadBatch<T = any>(
    keys: (string | ConfigKey)[],
    options?: LoaderOptions
  ): Promise<Record<string, LoaderResult<T>>> {
    const results: Record<string, LoaderResult<T>> = {};

    // 并行加载所有配置
    const loadPromises = keys.map(async (key) => {
      const cacheKey = this.buildCacheKey(key);
      const result = await this.load<T>(key, options);
      return { cacheKey, result };
    });

    const loadResults = await Promise.all(loadPromises);

    for (const { cacheKey, result } of loadResults) {
      results[cacheKey] = result;
    }

    return results;
  }

  /**
   * @method preload
   * @description 预加载配置
   * @param keys 配置键列表
   * @param options 加载选项
   * @returns {Promise<number>} 预加载的配置数量
   */
  async preload(keys: (string | ConfigKey)[], options?: LoaderOptions): Promise<number> {
    let preloadedCount = 0;

    for (const key of keys) {
      try {
        const result = await this.load(key, options);
        if (result.success) {
          preloadedCount++;
        }
      } catch (error) {
        this.logger.warn(`Failed to preload config: ${this.buildCacheKey(key)}`, LogContext.CONFIG, undefined, error);
      }
    }

    return preloadedCount;
  }

  /**
   * @method refresh
   * @description 刷新配置
   * @param key 配置键（可选，不指定则刷新所有）
   * @returns {Promise<number>} 刷新的配置数量
   */
  async refresh(key?: string | ConfigKey): Promise<number> {
    if (key) {
      const cacheKey = this.buildCacheKey(key);
      this.cache.delete(cacheKey);
      const result = await this.load(key, {
        type: LoaderType.MEMORY,
        priority: 0,
        enabled: true,
        custom: { forceRefresh: true }
      });
      this.emitEvent('refresh', { key: cacheKey, success: result.success });
      return result.success ? 1 : 0;
    }

    // 刷新所有缓存
    const keys = Array.from(this.cache.keys());
    let refreshedCount = 0;

    for (const cacheKey of keys) {
      this.cache.delete(cacheKey);
      // 这里需要从缓存键反推出原始键，简化处理
      try {
        const result = await this.load(cacheKey, {
          type: LoaderType.MEMORY,
          priority: 0,
          enabled: true,
          custom: { forceRefresh: true }
        });
        if (result.success) {
          refreshedCount++;
        }
      } catch (error) {
        this.logger.warn(`Failed to refresh config: ${cacheKey}`, LogContext.CONFIG, undefined, error);
      }
    }

    this.emitEvent('refresh', { all: true, refreshedCount });
    return refreshedCount;
  }

  /**
   * @method clearCache
   * @description 清除配置缓存
   * @param key 配置键（可选，不指定则清除所有）
   * @returns {Promise<number>} 清除的配置数量
   */
  async clearCache(key?: string | ConfigKey): Promise<number> {
    if (key) {
      const cacheKey = this.buildCacheKey(key);
      const deleted = this.cache.delete(cacheKey);
      return deleted ? 1 : 0;
    }

    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * @method getStats
   * @description 获取加载器统计信息
   * @returns {Promise<LoaderStats[]>} 统计信息
   */
  async getStats(): Promise<LoaderStats[]> {
    const stats: LoaderStats[] = [];

    for (const [type, stat] of this.stats.entries()) {
      const errorRate = stat.totalLoads > 0 ? (stat.failedLoads / stat.totalLoads) * 100 : 0;
      const averageLoadTime = stat.totalLoads > 0 ? stat.totalLoadTime / stat.totalLoads : 0;

      stats.push({
        type,
        totalLoads: stat.totalLoads,
        successfulLoads: stat.successfulLoads,
        failedLoads: stat.failedLoads,
        averageLoadTime,
        lastLoadTime: stat.lastLoadTime,
        errorRate,
      });
    }

    return stats;
  }

  /**
   * @method addLoader
   * @description 添加加载器
   * @param loader 加载器实例
   * @param options 加载器选项
   * @returns {boolean} 是否成功添加
   */
  addLoader(loader: IConfigurationLoader, options: LoaderOptions): boolean {
    if (this.loaders.has(options.type)) {
      this.logger.warn(`Loader type ${options.type} already exists, replacing...`, LogContext.CONFIG);
    }

    this.loaders.set(options.type, loader);
    this.loaderOptions.set(options.type, options);
    this.stats.set(options.type, {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      totalLoadTime: 0,
    });

    this.logger.info(`Added loader: ${options.type} with priority ${options.priority}`, LogContext.CONFIG);
    return true;
  }

  /**
   * @method removeLoader
   * @description 移除加载器
   * @param type 加载器类型
   * @returns {boolean} 是否成功移除
   */
  removeLoader(type: LoaderType): boolean {
    const removed = this.loaders.delete(type);
    this.loaderOptions.delete(type);
    this.stats.delete(type);

    if (removed) {
      this.logger.info(`Removed loader: ${type}`, LogContext.CONFIG);
    }

    return removed;
  }

  /**
   * @method getLoader
   * @description 获取加载器
   * @param type 加载器类型
   * @returns {IConfigurationLoader | null} 加载器实例
   */
  getLoader(type: LoaderType): IConfigurationLoader | null {
    return this.loaders.get(type) || null;
  }

  /**
   * @method getLoaders
   * @description 获取所有加载器
   * @returns {Array<{ loader: IConfigurationLoader; options: LoaderOptions }>} 加载器列表
   */
  getLoaders(): Array<{ loader: IConfigurationLoader; options: LoaderOptions }> {
    const result: Array<{ loader: IConfigurationLoader; options: LoaderOptions }> = [];

    for (const [type, loader] of this.loaders.entries()) {
      const options = this.loaderOptions.get(type);
      if (options) {
        result.push({ loader, options });
      }
    }

    return result;
  }

  /**
   * @method setLoaderOptions
   * @description 设置加载器选项
   * @param type 加载器类型
   * @param options 加载器选项
   * @returns {boolean} 是否成功设置
   */
  setLoaderOptions(type: LoaderType, options: Partial<LoaderOptions>): boolean {
    const existingOptions = this.loaderOptions.get(type);
    if (!existingOptions) {
      return false;
    }

    this.loaderOptions.set(type, { ...existingOptions, ...options });
    this.logger.info(`Updated loader options: ${type}`, LogContext.CONFIG);
    return true;
  }

  /**
   * @method getLoaderOptions
   * @description 获取加载器选项
   * @param type 加载器类型
   * @returns {LoaderOptions | null} 加载器选项
   */
  getLoaderOptions(type: LoaderType): LoaderOptions | null {
    return this.loaderOptions.get(type) || null;
  }

  /**
   * @method enableLoader
   * @description 启用加载器
   * @param type 加载器类型
   * @param enabled 是否启用
   * @returns {boolean} 是否成功设置
   */
  enableLoader(type: LoaderType, enabled: boolean): boolean {
    const options = this.loaderOptions.get(type);
    if (!options) {
      return false;
    }

    options.enabled = enabled;
    this.logger.info(`${enabled ? 'Enabled' : 'Disabled'} loader: ${type}`, LogContext.CONFIG);
    return true;
  }

  /**
   * @method isLoaderEnabled
   * @description 检查加载器是否启用
   * @param type 加载器类型
   * @returns {boolean} 是否启用
   */
  isLoaderEnabled(type: LoaderType): boolean {
    const options = this.loaderOptions.get(type);
    return options?.enabled || false;
  }

  /**
   * @method getLoaderHealth
   * @description 获取加载器健康状态
   * @param type 加载器类型
   * @returns {Promise<{ healthy: boolean; details: Record<string, any> }>} 健康状态
   */
  async getLoaderHealth(type: LoaderType): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    const loader = this.loaders.get(type);
    const options = this.loaderOptions.get(type);

    if (!loader || !options) {
      return {
        healthy: false,
        details: { error: 'Loader not found' },
      };
    }

    try {
      // 尝试加载一个测试配置来检查健康状态
      const testResult = await loader.load('health_check', options);
      return {
        healthy: testResult.success,
        details: {
          enabled: options.enabled,
          priority: options.priority,
          lastLoadTime: this.stats.get(type)?.lastLoadTime,
          totalLoads: this.stats.get(type)?.totalLoads || 0,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          enabled: options.enabled,
          priority: options.priority,
        },
      };
    }
  }

  /**
   * @method getAllLoadersHealth
   * @description 获取所有加载器健康状态
   * @returns {Promise<Record<LoaderType, { healthy: boolean; details: Record<string, any> }>>} 健康状态映射
   */
  async getAllLoadersHealth(): Promise<Record<LoaderType, {
    healthy: boolean;
    details: Record<string, any>;
  }>> {
    const healthMap: Record<LoaderType, {
      healthy: boolean;
      details: Record<string, any>;
    }> = {} as any;

    for (const type of Object.values(LoaderType)) {
      healthMap[type] = await this.getLoaderHealth(type);
    }

    return healthMap;
  }

  /**
   * @method on
   * @description 监听加载事件
   * @param eventType 事件类型
   * @param callback 回调函数
   * @returns {() => void} 取消监听的函数
   */
  on(eventType: 'load' | 'error' | 'refresh', callback: (event: any) => void): () => void {
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
   * @description 获取加载事件历史
   * @param limit 限制数量
   * @returns {any[]} 事件历史
   */
  getEventHistory(limit?: number): any[] {
    const maxLimit = limit || this.maxEventHistory;
    return this.eventHistory.slice(-maxLimit);
  }

  /**
   * @method exportConfig
   * @description 导出加载器配置
   * @param format 导出格式
   * @returns {Promise<string>} 导出的配置
   */
  async exportConfig(format?: 'json' | 'yaml'): Promise<string> {
    const config = {
      loaders: Array.from(this.loaderOptions.entries()).map(([type, options]) => ({
        type,
        options,
      })),
      stats: Array.from(this.stats.entries()).map(([type, stat]) => ({
        type,
        stat,
      })),
    };

    if (format === 'yaml') {
      // 简化处理，实际项目中可以使用js-yaml
      return JSON.stringify(config, null, 2);
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * @method importConfig
   * @description 导入加载器配置
   * @param config 配置数据
   * @param format 导入格式
   * @returns {Promise<boolean>} 是否成功导入
   */
  async importConfig(config: string, format?: 'json' | 'yaml'): Promise<boolean> {
    try {
      const parsedConfig = JSON.parse(config);

      if (parsedConfig.loaders) {
        for (const { type, options } of parsedConfig.loaders) {
          this.loaderOptions.set(type, options);
        }
      }

      if (parsedConfig.stats) {
        for (const { type, stat } of parsedConfig.stats) {
          this.stats.set(type, stat);
        }
      }

      this.logger.info('Configuration imported successfully', LogContext.CONFIG);
      return true;
    } catch (error) {
      this.logger.error('Failed to import configuration', LogContext.CONFIG, undefined, error);
      return false;
    }
  }

  /**
   * @method resetStats
   * @description 重置加载器统计
   * @param type 加载器类型（可选，不指定则重置所有）
   * @returns {boolean} 是否成功重置
   */
  resetStats(type?: LoaderType): boolean {
    if (type) {
      const stat = this.stats.get(type);
      if (stat) {
        stat.totalLoads = 0;
        stat.successfulLoads = 0;
        stat.failedLoads = 0;
        stat.totalLoadTime = 0;
        stat.lastLoadTime = undefined;
        return true;
      }
      return false;
    }

    // 重置所有统计
    for (const stat of this.stats.values()) {
      stat.totalLoads = 0;
      stat.successfulLoads = 0;
      stat.failedLoads = 0;
      stat.totalLoadTime = 0;
      stat.lastLoadTime = undefined;
    }

    return true;
  }

  /**
   * @method optimize
   * @description 优化加载器
   * @param type 加载器类型（可选，不指定则优化所有）
   * @returns {Promise<{ optimized: boolean; details: Record<string, any> }>} 优化结果
   */
  async optimize(type?: LoaderType): Promise<{
    optimized: boolean;
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {};

    if (type) {
      const loader = this.loaders.get(type);
      const options = this.loaderOptions.get(type);

      if (loader && options) {
        // 简化优化逻辑
        details[type] = {
          priority: options.priority,
          enabled: options.enabled,
          cacheSize: this.cache.size,
        };
      }
    } else {
      // 优化所有加载器
      for (const [loaderType, loader] of this.loaders.entries()) {
        const options = this.loaderOptions.get(loaderType);
        if (options) {
          details[loaderType] = {
            priority: options.priority,
            enabled: options.enabled,
            cacheSize: this.cache.size,
          };
        }
      }
    }

    return {
      optimized: true,
      details,
    };
  }

  // 私有辅助方法

  /**
   * @private
   * @method initializeDefaultLoaders
   * @description 初始化默认加载器
   */
  private initializeDefaultLoaders(): void {
    // 这里可以添加默认的加载器实现
    // 暂时为空，后续可以添加环境变量、文件等默认加载器
    this.logger.info('Initializing default loaders...', LogContext.CONFIG);
  }

  /**
   * @private
   * @method buildCacheKey
   * @description 构建缓存键
   * @param key 配置键
   * @returns {string} 缓存键
   */
  private buildCacheKey(key: string | ConfigKey): string {
    if (typeof key === 'string') {
      return key;
    }

    const parts = [key.key];
    if (key.scope) parts.push(key.scope);
    if (key.tenantId) parts.push(key.tenantId);
    if (key.module) parts.push(key.module);
    if (key.userId) parts.push(key.userId);

    return parts.join(':');
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param type 加载器类型
   * @param success 是否成功
   * @param loadTime 加载时间
   */
  private updateStats(type: LoaderType, success: boolean, loadTime: number): void {
    let stat = this.stats.get(type);
    if (!stat) {
      stat = {
        totalLoads: 0,
        successfulLoads: 0,
        failedLoads: 0,
        totalLoadTime: 0,
      };
      this.stats.set(type, stat);
    }

    stat.totalLoads++;
    stat.totalLoadTime += loadTime;
    stat.lastLoadTime = new Date();

    if (success) {
      stat.successfulLoads++;
    } else {
      stat.failedLoads++;
    }
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  private emitEvent(eventType: 'load' | 'error' | 'refresh', data: any): void {
    const event = {
      type: eventType,
      timestamp: new Date(),
      data,
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }

    // 通知监听器
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          this.logger.error(`Error in event listener for ${eventType}`, LogContext.CONFIG, undefined, error);
        }
      }
    }

    // 发送到EventEmitter
    this.eventEmitter.emit(`config.loader.${eventType}`, event);
  }

  /**
   * @private
   * @method getSortedLoaders
   * @description 获取排序后的加载器列表
   * @returns {Array<{ loader: IConfigurationLoader; options: LoaderOptions }>} 排序后的加载器列表
   */
  private getSortedLoaders(): Array<{ loader: IConfigurationLoader; options: LoaderOptions }> {
    const loaders: Array<{ loader: IConfigurationLoader; options: LoaderOptions }> = [];

    for (const [type, loader] of this.loaders.entries()) {
      const options = this.loaderOptions.get(type);
      if (options) {
        loaders.push({ loader, options });
      }
    }

    // 按优先级排序（数字越小优先级越高）
    return loaders.sort((a, b) => a.options.priority - b.options.priority);
  }

  /**
   * @private
   * @method loadWithRetry
   * @description 带重试的加载
   * @param loader 加载器
   * @param key 配置键
   * @param options 加载器选项
   * @returns {Promise<LoaderResult>} 加载结果
   */
  private async loadWithRetry(
    loader: IConfigurationLoader,
    key: string | ConfigKey,
    options: LoaderOptions
  ): Promise<LoaderResult> {
    const maxRetries = options.retryCount || 0;
    const retryInterval = options.retryInterval || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await loader.load(key, options);
        if (result.success) {
          return result;
        }

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
      } catch (error) {
        if (attempt < maxRetries) {
          this.logger.warn(`Loader attempt ${attempt + 1} failed, retrying...`, LogContext.CONFIG, undefined, error);
          await new Promise(resolve => setTimeout(resolve, retryInterval));
        } else {
          throw error;
        }
      }
    }

    return {
      success: false,
      source: ConfigSource.DEFAULT,
      loadTime: 0,
      error: 'Max retries exceeded',
      metadata: {},
    };
  }
}
