import { Logger } from '@nestjs/common';
import type { IQuery } from '../interfaces/query.interface';
import type { IQueryHandler } from '../interfaces/query-handler.interface';

/**
 * @abstract BaseQueryHandler
 * @description
 * CQRS架构中查询处理器的基类，提供了查询处理器的通用实现和默认行为。
 * 
 * 主要原理与机制如下：
 * 1. 模板方法模式：定义了查询处理的流程，子类可以重写特定步骤。
 * 2. 依赖注入：通过NestJS的依赖注入系统获取所需的依赖。
 * 3. 日志记录：提供统一的日志记录机制，支持审计和调试。
 * 4. 异常处理：提供统一的异常处理机制，确保系统的稳定性。
 * 5. 缓存支持：提供查询结果缓存的基础框架。
 * 
 * 功能与职责：
 * - 提供查询处理器的通用结构和行为
 * - 实现统一的日志记录
 * - 提供统一的异常处理
 * - 支持查询处理的监控和追踪
 * - 提供缓存支持的基础框架
 * - 确保查询处理的一致性
 */
export abstract class BaseQueryHandler<TQuery extends IQuery<TResult> = IQuery, TResult = any>
  implements IQueryHandler<TQuery, TResult> {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * @property {string} queryType
   * @description 该处理器能够处理的查询类型，由子类实现
   */
  public abstract readonly queryType: string;

  /**
   * @method execute
   * @description 执行查询的核心方法，实现了模板方法模式
   * 
   * @param query - 要执行的查询对象
   * @returns Promise<TResult> 查询执行的结果
   * 
   * 主要职责：
   * 1. 记录查询执行的开始
   * 2. 验证查询参数
   * 3. 检查查询权限
   * 4. 执行业务逻辑
   * 5. 处理异常
   * 6. 记录查询执行的结束
   * 7. 返回查询结果
   */
  public async execute(query: TQuery): Promise<TResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting query execution: ${this.queryType}`, {
        queryId: query.queryId,
        userId: query.userId,
        tenantId: query.tenantId,
      });

      // 验证查询参数
      await this.validateQuery(query);

      // 检查查询权限
      await this.checkQueryPermission(query);

      // 执行业务逻辑
      const result = await this.handleQuery(query);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Query execution completed: ${this.queryType}`, {
        queryId: query.queryId,
        executionTime,
        resultType: typeof result,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Query execution failed: ${this.queryType}`, {
        queryId: query.queryId,
        executionTime,
        error: error.message,
        stack: error.stack,
      });

      // 重新抛出异常，让上层处理
      throw error;
    }
  }

  /**
   * @protected
   * @method validateQuery
   * @description 验证查询参数，子类可以重写此方法
   * 
   * @param query - 要验证的查询对象
   * @returns Promise<void>
   * 
   * 主要职责：
   * 1. 验证查询参数的完整性
   * 2. 检查查询参数的格式
   * 3. 验证查询参数的有效性
   * 4. 抛出验证异常（如果验证失败）
   */
  protected async validateQuery(query: TQuery): Promise<void> {
    // 默认实现：调用查询的validate方法
    if (!query.validate()) {
      throw new Error(`Query validation failed: ${this.queryType}`);
    }
  }

  /**
   * @protected
   * @method checkQueryPermission
   * @description 检查查询权限，子类可以重写此方法
   * 
   * @param query - 要检查权限的查询对象
   * @returns Promise<void>
   * 
   * 主要职责：
   * 1. 检查用户是否有权限执行此查询
   * 2. 验证租户隔离
   * 3. 检查数据访问权限
   * 4. 抛出权限异常（如果权限不足）
   */
  protected async checkQueryPermission(query: TQuery): Promise<void> {
    // 默认实现：不进行权限检查
    // 子类可以根据需要重写此方法
  }

  /**
   * @protected
   * @abstract
   * @method handleQuery
   * @description 处理查询的核心业务逻辑，子类必须实现此方法
   * 
   * @param query - 要处理的查询对象
   * @returns Promise<TResult> 查询结果
   * 
   * 主要职责：
   * 1. 执行业务逻辑
   * 2. 调用仓储或查询服务
   * 3. 处理查询选项（分页、排序、过滤）
   * 4. 格式化查询结果
   * 5. 返回查询结果
   */
  protected abstract handleQuery(query: TQuery): Promise<TResult>;

  /**
   * @protected
   * @method logQueryExecution
   * @description 记录查询执行的详细信息
   * 
   * @param query - 查询对象
   * @param result - 查询结果
   * @param executionTime - 执行时间
   * 
   * 主要职责：
   * 1. 记录查询执行的详细信息
   * 2. 支持审计和监控
   * 3. 提供调试信息
   */
  protected logQueryExecution(
    query: TQuery,
    result: TResult,
    executionTime: number
  ): void {
    this.logger.log(`Query executed: ${this.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
      tenantId: query.tenantId,
      executionTime,
      resultType: typeof result,
      resultSize: Array.isArray(result) ? result.length : 1,
    });
  }

  /**
   * @protected
   * @method logQueryError
   * @description 记录查询执行的错误信息
   * 
   * @param query - 查询对象
   * @param error - 错误对象
   * @param executionTime - 执行时间
   * 
   * 主要职责：
   * 1. 记录查询执行的错误信息
   * 2. 支持错误追踪和调试
   * 3. 提供错误上下文信息
   */
  protected logQueryError(
    query: TQuery,
    error: Error,
    executionTime: number
  ): void {
    this.logger.error(`Query execution error: ${this.queryType}`, {
      queryId: query.queryId,
      userId: query.userId,
      tenantId: query.tenantId,
      executionTime,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * @protected
   * @method getCacheKey
   * @description 生成查询的缓存键，子类可以重写此方法
   * 
   * @param query - 查询对象
   * @returns string 缓存键
   * 
   * 主要职责：
   * 1. 基于查询参数生成唯一的缓存键
   * 2. 支持查询结果的缓存
   * 3. 确保缓存键的唯一性
   */
  protected getCacheKey(query: TQuery): string {
    return query.getCacheKey();
  }

  /**
   * @protected
   * @method shouldCache
   * @description 判断是否应该缓存查询结果，子类可以重写此方法
   * 
   * @param query - 查询对象
   * @returns boolean 是否应该缓存
   * 
   * 主要职责：
   * 1. 判断查询结果是否适合缓存
   * 2. 基于查询类型和参数决定缓存策略
   * 3. 支持动态缓存控制
   */
  protected shouldCache(query: TQuery): boolean {
    // 默认实现：所有查询都缓存
    // 子类可以根据需要重写此方法
    return true;
  }

  /**
   * @protected
   * @method getCacheTTL
   * @description 获取缓存的生存时间，子类可以重写此方法
   * 
   * @param query - 查询对象
   * @returns number 缓存生存时间（毫秒）
   * 
   * 主要职责：
   * 1. 为不同类型的查询设置不同的缓存时间
   * 2. 支持动态缓存时间控制
   * 3. 平衡缓存效果和实时性
   */
  protected getCacheTTL(query: TQuery): number {
    // 默认实现：缓存5分钟
    return 5 * 60 * 1000;
  }
}
