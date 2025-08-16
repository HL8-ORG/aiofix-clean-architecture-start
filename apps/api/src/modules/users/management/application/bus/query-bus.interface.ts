import type { IQuery } from '@/shared/application/interfaces/query.interface';

/**
 * 查询总线接口
 * 用于发送查询到对应的处理器
 */
export interface IQueryBus {
  /**
   * 发送查询
   * @param query 要发送的查询
   * @returns 查询结果
   */
  execute<T extends IQuery = IQuery, R = any>(query: T): Promise<R>;
}
