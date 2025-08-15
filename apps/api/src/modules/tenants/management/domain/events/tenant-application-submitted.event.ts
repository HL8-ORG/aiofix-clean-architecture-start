import { BaseDomainEvent } from '../../../../shared/domain/events/base.event';
import { TenantApplication } from '../entities/tenant-application.entity';

/**
 * @class TenantApplicationSubmittedEvent
 * @description 租户申请提交事件
 * 
 * 事件数据包含：
 * - 申请的基本信息
 * - 申请人信息
 * - 租户信息
 * - 提交时间
 */
export class TenantApplicationSubmittedEvent extends BaseDomainEvent {
  constructor(
    public readonly application: TenantApplication
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
      description: this.application.description,
      status: this.application.status.value,
      createdAt: this.application.createdAt,
      updatedAt: this.application.updatedAt
    };
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns 事件类型字符串
   */
  getEventType(): string {
    return 'TenantApplicationSubmitted';
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
