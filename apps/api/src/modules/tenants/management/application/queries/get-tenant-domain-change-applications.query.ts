import { IQuery } from '@/shared/application/interfaces/query.interface';
import { ApplicationStatus } from '../../domain/value-objects/application-status';

/**
 * @class GetTenantDomainChangeApplicationsQuery
 * @description 获取租户域名变更申请列表查询
 * 
 * 该查询用于获取租户域名变更申请的列表，支持：
 * - 按租户ID过滤
 * - 按申请人ID过滤
 * - 按申请状态过滤
 * - 分页查询
 * - 排序
 * 
 * 业务规则：
 * - 查询结果按创建时间倒序排列
 * - 支持分页以避免大量数据加载
 * - 支持多种过滤条件组合
 */
export class GetTenantDomainChangeApplicationsQuery implements IQuery<{
  applications: Array<{
    id: string;
    tenantId: string;
    applicantId: string;
    currentDomain?: string;
    newDomain: string;
    reason: string;
    status: string;
    reviewerId?: string;
    reviewComment?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}> {
  constructor(
    public readonly tenantId?: string,
    public readonly applicantId?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'ASC' | 'DESC' = 'DESC'
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证查询参数的有效性
   * @throws Error 当参数无效时
   */
  private validate(): void {
    if (this.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (this.status && !Object.values(ApplicationStatus).includes(this.status as ApplicationStatus)) {
      throw new Error('Invalid application status');
    }

    if (!['ASC', 'DESC'].includes(this.orderDirection)) {
      throw new Error('Order direction must be ASC or DESC');
    }
  }

  /**
   * @method getQueryType
   * @description 获取查询类型
   * @returns string
   */
  getQueryType(): string {
    return 'GetTenantDomainChangeApplications';
  }

  /**
   * @method getCacheKey
   * @description 获取缓存键
   * @returns string
   */
  getCacheKey(): string {
    return `tenant-domain-change-applications:${this.tenantId || 'all'}:${this.applicantId || 'all'}:${this.status || 'all'}:${this.page}:${this.limit}:${this.orderBy}:${this.orderDirection}`;
  }
}
