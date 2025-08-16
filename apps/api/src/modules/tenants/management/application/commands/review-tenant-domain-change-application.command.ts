import { BaseCommand } from '@/shared/application/base/base-command';
import { ApplicationId } from '../../domain/value-objects/application-id';

/**
 * @class ReviewTenantDomainChangeApplicationCommand
 * @description 审核租户域名变更申请命令
 * 
 * 该命令用于处理租户域名变更申请的审核操作，包含：
 * - 申请ID
 * - 审核人ID
 * - 审核结果（通过/拒绝）
 * - 审核意见（可选）
 * 
 * 业务规则：
 * - 审核人必须有审核权限
 * - 只能审核待审核状态的申请
 * - 审核意见不能为空（如果拒绝）
 * - 审核后申请状态会相应更新
 */
export class ReviewTenantDomainChangeApplicationCommand extends BaseCommand {
  public readonly commandType = 'ReviewTenantDomainChangeApplication';

  constructor(
    public readonly applicationId: string,
    public readonly reviewerId: string,
    public readonly approved: boolean,
    public readonly reviewComment?: string,
    options?: {
      userId?: string;
      tenantId?: string;
      correlationId?: string;
    }
  ) {
    super(options);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令数据的有效性
   * @returns boolean 验证结果
   */
  public validate(): boolean {
    if (!this.applicationId || this.applicationId.trim().length === 0) {
      throw new Error('Application ID cannot be empty');
    }

    if (!this.reviewerId || this.reviewerId.trim().length === 0) {
      throw new Error('Reviewer ID cannot be empty');
    }

    // 如果拒绝，审核意见不能为空
    if (!this.approved && (!this.reviewComment || this.reviewComment.trim().length === 0)) {
      throw new Error('Review comment is required when rejecting an application');
    }

    return true;
  }
}
