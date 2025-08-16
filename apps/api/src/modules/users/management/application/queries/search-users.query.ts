import { BaseQuery } from '@/shared/application/base/base-query';

/**
 * @class SearchUsersQuery
 * @description
 * 搜索用户的查询。该查询用于根据搜索条件查找用户，
 * 支持按用户名、邮箱、姓名等字段进行模糊搜索。
 * 
 * 主要原理与机制如下：
 * 1. 继承BaseQuery基类，获得查询的基础功能
 * 2. 封装搜索参数，包括搜索关键词、租户ID、分页信息
 * 3. 通过查询总线发送给SearchUsersHandler处理器
 * 4. 处理器执行搜索逻辑并返回匹配的用户列表
 * 
 * 搜索功能：
 * - 支持多字段模糊搜索（用户名、邮箱、姓名）
 * - 支持租户隔离，确保数据安全
 * - 支持分页查询，提高性能
 * - 支持排序和过滤
 * 
 * @extends {BaseQuery}
 */
export class SearchUsersQuery extends BaseQuery {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'SearchUsersQuery';

  /**
   * @constructor
   * @description
   * 构造函数，初始化搜索用户查询
   * 
   * @param {string} tenantId - 租户ID，用于数据隔离
   * @param {string} searchTerm - 搜索关键词
   * @param {number} page - 页码，从1开始
   * @param {number} limit - 每页数量
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序方向（asc/desc）
   * @param {string} status - 用户状态过滤
   */
  constructor(
    public readonly tenantId: string,
    public readonly searchTerm: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    public readonly status?: string,
  ) {
    super();
  }
}
