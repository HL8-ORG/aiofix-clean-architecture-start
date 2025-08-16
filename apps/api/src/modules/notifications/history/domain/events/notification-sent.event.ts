import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationHistory } from '../entities/notification-history.entity';

/**
 * @class NotificationSentEvent
 * @description
 * 通知发送事件，当通知被成功发送时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知发送成功的业务事件
 * 2. 包含通知发送时的上下文信息
 * 3. 支持事件溯源和审计追踪
 * 4. 触发后续的业务流程（如送达确认）
 * 
 * 业务规则：
 * - 事件必须在通知发送成功后发布
 * - 事件数据必须包含发送时间和状态信息
 * - 事件不可变，一旦创建就不能修改
 * 
 * @extends BaseDomainEvent
 */
export class NotificationSentEvent extends BaseDomainEvent {
  constructor(
    public readonly notification: NotificationHistory,
    public readonly sentAt: Date
  ) {
    super(
      notification.getAggregateId(),
      'NotificationSent',
      {
        id: notification.id.value,
        type: notification.type.value,
        title: notification.title,
        recipientId: notification.recipientId.value,
        tenantId: notification.tenantId?.value,
        status: notification.status.value,
        priority: notification.priority.value,
        sentAt: sentAt,
        retryCount: notification.retryCount,
        metadata: notification.metadata
      }
    );
  }

  /**
   * @protected getAggregateType
   * @description 获取聚合根类型
   * @returns {string} 聚合根类型
   */
  protected getAggregateType(): string {
    return 'Notification';
  }

  /**
   * @protected createCopyWithMetadata
   * @description 创建带有新元数据的副本
   * @param metadata 新的元数据
   * @returns {BaseDomainEvent} 新的事件实例
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new NotificationSentEvent(this.notification, this.sentAt);
  }

  /**
   * @protected createCopyWithOptions
   * @description 创建带有新选项的副本
   * @param options 新的选项
   * @returns {BaseDomainEvent} 新的事件实例
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new NotificationSentEvent(this.notification, this.sentAt);
  }
}
