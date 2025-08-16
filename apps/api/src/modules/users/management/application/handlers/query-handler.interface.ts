import type { IQuery } from '@/shared/application/interfaces/query.interface';

/**
 * 查询处理器接口
 * 所有查询处理器都应该实现这个接口
 */
export interface IQueryHandler<TQuery extends IQuery = IQuery, TResult = any> {
  /**
   * 处理查询
   * @param query 要处理的查询
   * @returns 查询结果
   */
  execute(query: TQuery): Promise<TResult>;
}
