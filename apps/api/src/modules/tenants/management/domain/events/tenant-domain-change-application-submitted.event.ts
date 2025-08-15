import { BaseDomainEvent } from '../../../../shared/domain/events/base.event';
import { TenantDomainChangeApplication } from '../entities/tenant-domain-change-application.entity';

/**
 * @class TenantDomainChangeApplicationSubmittedEvent
 * @description 租户域名变更申请提交事件
 * 
 * 事件数据：
 * - applicationId: 申请ID
 * - tenantId: 租户ID
 * - applicantId: 申请人ID
 * - currentDomain: 当前域名
 * - newDomain: 新域名
 * - reason: 变更原因
 * - submittedAt: 提交时间
 */
export class TenantDomainChangeApplicationSubmittedEvent extends BaseDomainEvent {
  constructor(application: TenantDomainChangeApplication) {
    super(
      application.id.value,
      'TenantDomainChangeApplicationSubmitted',
      {
        applicationId: application.id.value,
        tenantId: application.tenantId.value,
        applicantId: application.applicantId.value,
        currentDomain: application.currentDomain,
        newDomain: application.newDomain,
        reason: application.reason,
        submittedAt: application.createdAt.toISOString()
      }
    );
  }

  protected getAggregateType(): string {
    return 'TenantDomainChangeApplication';
  }
}
