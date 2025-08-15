import { BaseDomainEvent } from '../../../../shared/domain/events/base.event';
import { TenantApplication } from '../entities/tenant-application.entity';

/**
 * @class TenantApplicationReviewedEvent
 * @description 租户申请审核事件
 * 
 * 事件数据包含：
 * - 申请的基本信息
 * - 审核结果
 * - 审核人信息
 * - 审核意见
 * - 审核时间
 */
export class TenantApplicationReviewedEvent extends BaseDomainEvent {
  constructor(
    public readonly application: TenantApplication,
    public readonly approved: boolean,
    public readonly comment?: string
  ) {
    super();
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns 事件数据对象
   */
  getEventData(): any {
    return {
      applicationId: this.application.id.value,
      applicantId: this.application.applicantId.value,
      tenantName: this.application.tenantName.value,
      tenantCode: this.application.tenantCode.value,
      approved: this.approved,
      reviewerId: this.application.reviewerId?.value,
      reviewComment: this.comment,
      reviewedAt: this.application.reviewedAt,
      status: this.application.status.value,
      updatedAt: this.application.updatedAt
    };
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns 事件类型字符串
   */
  getEventType(): string {
    return 'TenantApplicationReviewed';
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns 聚合根ID
   */
  getAggregateId(): string {
    return this.application.id.value;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns 聚合根类型
   */
  getAggregateType(): string {
    return 'TenantApplication';
  }
}
