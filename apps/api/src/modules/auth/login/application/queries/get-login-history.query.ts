import { BaseQuery } from '@/shared/application/base/base-query';

/**
 * @class GetLoginHistoryQuery
 * @description
 * 获取登录历史查询。该查询用于获取指定用户的登录历史记录，
 * 包括登录时间、IP地址、设备信息、登录状态等详细信息。
 * 
 * 主要用途：
 * 1. 用户登录行为分析
 * 2. 安全审计和异常检测
 * 3. 登录统计报表
 * 4. 安全事件调查
 * 
 * 业务规则：
 * - 只能查询当前用户或管理员查询指定用户的登录历史
 * - 支持分页查询
 * - 支持按时间范围过滤
 * - 支持按登录状态过滤（成功/失败）
 * - 支持按IP地址过滤
 * 
 * @extends {BaseQuery}
 */
export class GetLoginHistoryQuery extends BaseQuery<LoginHistoryDto[]> {
  public readonly queryType = 'GetLoginHistoryQuery';
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status?: 'success' | 'failed' | 'all',
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly ipAddress?: string,
  ) {
    super();
  }
}
