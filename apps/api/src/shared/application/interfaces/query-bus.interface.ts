import type { IQuery } from './query.interface';

/**
 * @interface IQueryBus
 * @description
 * CQRS架构中的查询总线接口，定义了查询发送和路由的标准契约。
 * 
 * 主要原理与机制如下：
 * 1. 中介者模式：查询总线作为中介者，解耦查询发送者和查询处理器。
 * 2. 路由机制：根据查询类型自动路由到对应的处理器。
 * 3. 缓存支持：支持查询结果的缓存，提高查询性能。
 * 4. 权限控制：提供查询权限的验证和管理。
 * 
 * 功能与职责：
 * - 接收和分发查询
 * - 路由查询到正确的处理器
 * - 管理查询结果的缓存
 * - 处理查询权限验证
 * - 提供查询执行的监控和日志
 */
export interface IQueryBus {
  /**
   * @method execute
   * @description 执行查询的核心方法
   * 
   * @param query - 要执行的查询对象
   * @returns Promise<TResult> 查询执行的结果
   * 
   * 主要职责：
   * 1. 验证查询的有效性
   * 2. 检查查询权限
   * 3. 路由查询到正确的处理器
   * 4. 管理查询结果缓存
   * 5. 返回查询结果
   */
  execute<TResult = any>(query: IQuery<TResult>): Promise<TResult>;

  /**
   * @method registerHandler
   * @description 注册查询处理器
   * 
   * @param queryType - 查询类型
   * @param handler - 查询处理器
   * 
   * 主要职责：
   * 1. 注册查询类型和处理器的映射关系
   * 2. 验证处理器的有效性
   * 3. 支持处理器的动态注册和移除
   */
  registerHandler(queryType: string, handler: any): void;

  /**
   * @method unregisterHandler
   * @description 注销查询处理器
   * 
   * @param queryType - 查询类型
   * 
   * 主要职责：
   * 1. 移除查询类型和处理器的映射关系
   * 2. 清理相关的缓存资源
   */
  unregisterHandler(queryType: string): void;

  /**
   * @method hasHandler
   * @description 检查是否有对应的查询处理器
   * 
   * @param queryType - 查询类型
   * @returns boolean 是否存在处理器
   * 
   * 主要职责：
   * 1. 检查指定查询类型是否有注册的处理器
   * 2. 支持查询执行前的预检查
   */
  hasHandler(queryType: string): boolean;

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
  clearCache(pattern?: string): void;
}
