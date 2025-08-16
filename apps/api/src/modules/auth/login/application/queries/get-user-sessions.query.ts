import { BaseQuery } from '@/shared/application/base/base-query';

/**
 * @class GetUserSessionsQuery
 * @description
 * 获取用户会话查询。该查询用于获取指定用户的所有活跃会话信息，
 * 包括会话ID、创建时间、最后活动时间、IP地址等详细信息。
 * 
 * 主要用途：
 * 1. 用户会话管理界面显示
 * 2. 会话安全审计
 * 3. 强制登出特定会话
 * 4. 会话统计和分析
 * 
 * 业务规则：
 * - 只能查询当前用户或管理员查询指定用户的会话
 * - 支持分页查询
 * - 支持按时间范围过滤
 * - 支持按状态过滤（活跃/过期）
 * 
 * @extends {BaseQuery}
 */
export class GetUserSessionsQuery extends BaseQuery<UserSessionDto[]> {
  public readonly queryType = 'GetUserSessionsQuery';
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status?: 'active' | 'expired' | 'all',
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {
    super();
  }
}
