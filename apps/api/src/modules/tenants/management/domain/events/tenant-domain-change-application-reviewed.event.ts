import { BaseDomainEvent } from '../../../../shared/domain/events/base.event';
import { TenantDomainChangeApplication } from '../entities/tenant-domain-change-application.entity';

/**
 * @class TenantDomainChangeApplicationReviewedEvent
 * @description 租户域名变更申请审核事件
 * 
 * 事件数据：
 * - applicationId: 申请ID
 * - tenantId: 租户ID
 * - reviewerId: 审核人ID
 * - approved: 是否通过
 * - reviewComment: 审核意见
 * - reviewedAt: 审核时间
 * - newDomain: 新域名（如果通过）
 */
export class TenantDomainChangeApplicationReviewedEvent extends BaseDomainEvent {
  constructor(
    application: TenantDomainChangeApplication,
    approved: boolean,
    comment?: string
  ) {
    super(
      application.id.value,
      'TenantDomainChangeApplicationReviewed',
      {
        applicationId: application.id.value,
        tenantId: application.tenantId.value,
        reviewerId: application.reviewerId?.value,
        approved: approved,
        reviewComment: comment,
        reviewedAt: application.reviewedAt?.toISOString(),
        newDomain: approved ? application.newDomain : undefined,
        currentDomain: application.currentDomain
      }
    );
  }

  protected getAggregateType(): string {
    return 'TenantDomainChangeApplication';
  }
}
