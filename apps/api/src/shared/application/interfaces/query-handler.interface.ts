import type { IQuery } from './query.interface';

/**
 * @interface IQueryHandler
 * @description
 * CQRS架构中的查询处理器接口，定义了所有查询处理器必须遵循的基础契约。
 * 
 * 主要原理与机制如下：
 * 1. 单一职责：每个查询处理器只负责处理特定类型的查询，遵循单一职责原则。
 * 2. 依赖注入：处理器通过依赖注入获取所需的仓储和查询服务，实现松耦合。
 * 3. 性能优化：处理器负责优化查询性能，包括缓存、分页、索引等。
 * 4. 权限控制：处理器负责验证用户权限，确保数据访问安全。
 * 
 * 功能与职责：
 * - 验证查询参数的有效性
 * - 执行业务逻辑和数据查询
 * - 处理分页、排序、过滤等查询选项
 * - 实现查询结果缓存
 * - 返回格式化的查询结果
 */
export interface IQueryHandler<TQuery extends IQuery<TResult> = IQuery, TResult = any> {
  /**
   * @method execute
   * @description 执行查询的核心方法
   * 
   * @param query - 要执行的查询对象
   * @returns Promise<TResult> 查询执行的结果
   * 
   * 主要职责：
   * 1. 验证查询参数和权限
   * 2. 执行业务逻辑和数据查询
   * 3. 处理查询选项（分页、排序、过滤）
   * 4. 格式化查询结果
   * 5. 返回查询结果
   */
  execute(query: TQuery): Promise<TResult>;

  /**
   * @property {string} queryType
   * @description 该处理器能够处理的查询类型
   */
  readonly queryType: string;
}
