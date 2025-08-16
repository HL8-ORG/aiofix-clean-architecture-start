import { Injectable, Logger } from '@nestjs/common';
import type { IQuery } from '../interfaces/query.interface';
import type { IQueryHandler } from '../interfaces/query-handler.interface';
import type { IQueryBus } from '../interfaces/query-bus.interface';

/**
 * @class QueryBus
 * @description
 * CQRS架构中查询总线的具体实现，负责查询的路由、缓存、执行和异常处理。
 * 
 * 主要原理与机制如下：
 * 1. 注册表模式：维护查询类型到处理器的映射关系，支持动态注册和注销。
 * 2. 路由机制：根据查询类型自动路由到对应的处理器，实现查询和处理的解耦。
 * 3. 缓存机制：支持查询结果的缓存，提高查询性能，减少重复计算。
 * 4. 异常处理：提供统一的异常处理机制，确保系统的稳定性和可观测性。
 * 5. 日志记录：记录查询执行的详细信息，支持审计和调试。
 * 
 * 功能与职责：
 * - 管理查询处理器的注册和注销
 * - 路由查询到正确的处理器
 * - 管理查询结果的缓存
 * - 提供统一的异常处理
 * - 记录查询执行的日志
 * - 支持查询执行的监控和追踪
 */
@Injectable()
export class QueryBus implements IQueryBus {
  private readonly logger = new Logger(QueryBus.name);
  private readonly handlers = new Map<string, IQueryHandler>();
  private readonly cache = new Map<string, { result: any; timestamp: number; ttl: number }>();

  /**
   * @method execute
   * @description 执行查询的核心方法
   * 
   * @param query - 要执行的查询对象
   * @returns Promise<TResult> 查询执行的结果
   * 
   * 主要职责：
   * 1. 验证查询的有效性
   * 2. 检查查询缓存
   * 3. 查找对应的查询处理器
   * 4. 执行查询并处理异常
   * 5. 缓存查询结果
   * 6. 记录执行日志
   * 7. 返回查询结果
   */
  public async execute<TResult = any>(query: IQuery<TResult>): Promise<TResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Executing query: ${query.queryType}`, {
        queryId: query.queryId,
        userId: query.userId,
        tenantId: query.tenantId,
      });

      // 验证查询
      if (!query.validate()) {
        throw new Error(`Query validation failed: ${query.queryType}`);
      }

      // 检查缓存
      const cacheKey = query.getCacheKey();
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult !== null) {
        this.logger.debug(`Query result returned from cache: ${query.queryType}`, {
          queryId: query.queryId,
          cacheKey,
        });
        return cachedResult as TResult;
      }

      // 查找处理器
      const handler = this.handlers.get(query.queryType);
      if (!handler) {
        throw new Error(`No handler registered for query type: ${query.queryType}`);
      }

      // 执行查询
      const result = await handler.execute(query);

      // 缓存结果（默认缓存5分钟）
      this.cacheResult(cacheKey, result, 5 * 60 * 1000);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Query executed successfully: ${query.queryType}`, {
        queryId: query.queryId,
        executionTime,
        cached: false,
      });

      return result as TResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Query execution failed: ${query.queryType}`, {
        queryId: query.queryId,
        executionTime,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * @method registerHandler
   * @description 注册查询处理器
   * 
   * @param queryType - 查询类型
   * @param handler - 查询处理器
   * 
   * 主要职责：
   * 1. 验证处理器和查询类型的匹配性
   * 2. 注册处理器到映射表
   * 3. 记录注册日志
   */
  public registerHandler(queryType: string, handler: IQueryHandler): void {
    if (!handler || typeof handler.execute !== 'function') {
      throw new Error('Invalid query handler provided');
    }

    if (handler.queryType !== queryType) {
      throw new Error(`Handler query type mismatch: expected ${queryType}, got ${handler.queryType}`);
    }

    this.handlers.set(queryType, handler);
    this.logger.debug(`Query handler registered: ${queryType}`);
  }

  /**
   * @method unregisterHandler
   * @description 注销查询处理器
   * 
   * @param queryType - 查询类型
   * 
   * 主要职责：
   * 1. 从映射表中移除处理器
   * 2. 清理相关的缓存
   * 3. 记录注销日志
   */
  public unregisterHandler(queryType: string): void {
    const removed = this.handlers.delete(queryType);
    if (removed) {
      // 清理相关的缓存
      this.clearCacheByPattern(`${queryType}:*`);
      this.logger.debug(`Query handler unregistered: ${queryType}`);
    } else {
      this.logger.warn(`No handler found to unregister: ${queryType}`);
    }
  }

  /**
   * @method hasHandler
   * @description 检查是否有对应的查询处理器
   * 
   * @param queryType - 查询类型
   * @returns boolean 是否存在处理器
   * 
   * 主要职责：
   * 1. 检查指定查询类型是否有注册的处理器
   * 2. 返回检查结果
   */
  public hasHandler(queryType: string): boolean {
    return this.handlers.has(queryType);
  }

  /**
   * @method clearCache
   * @description 清除查询缓存
   * 
   * @param pattern - 缓存键模式，支持通配符
   * 
   * 主要职责：
   * 1. 清除指定模式的查询缓存
   * 2. 支持缓存的手动失效
   * 3. 提供缓存管理功能
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.logger.debug('All query cache cleared');
      return;
    }

    this.clearCacheByPattern(pattern);
    this.logger.debug(`Query cache cleared for pattern: ${pattern}`);
  }

  /**
   * @method getRegisteredQueries
   * @description 获取所有已注册的查询类型
   * 
   * @returns string[] 已注册的查询类型列表
   * 
   * 主要职责：
   * 1. 返回所有已注册的查询类型
   * 2. 支持调试和监控
   */
  public getRegisteredQueries(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * @method getHandlerCount
   * @description 获取已注册的处理器数量
   * 
   * @returns number 处理器数量
   * 
   * 主要职责：
   * 1. 返回已注册的处理器数量
   * 2. 支持系统监控
   */
  public getHandlerCount(): number {
    return this.handlers.size;
  }

  /**
   * @method getCacheSize
   * @description 获取缓存大小
   * 
   * @returns number 缓存条目数量
   * 
   * 主要职责：
   * 1. 返回当前缓存中的条目数量
   * 2. 支持缓存监控
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * @private
   * @method getCachedResult
   * @description 获取缓存的查询结果
   * 
   * @param cacheKey - 缓存键
   * @returns any | null 缓存的查询结果，如果不存在或已过期则返回null
   */
  private getCachedResult(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * @private
   * @method cacheResult
   * @description 缓存查询结果
   * 
   * @param cacheKey - 缓存键
   * @param result - 查询结果
   * @param ttl - 生存时间（毫秒）
   */
  private cacheResult(cacheKey: string, result: any, ttl: number): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * @private
   * @method clearCacheByPattern
   * @description 根据模式清除缓存
   * 
   * @param pattern - 缓存键模式
   */
  private clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
