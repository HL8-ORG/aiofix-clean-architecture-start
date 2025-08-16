import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationHistory } from '../entities/notification-history.entity';

/**
 * @class NotificationCreatedEvent
 * @description
 * 通知创建事件，当通知被创建时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知创建的业务事件
 * 2. 包含通知创建时的完整上下文信息
 * 3. 支持事件溯源和审计追踪
 * 4. 触发后续的业务流程（如通知发送）
 * 
 * 业务规则：
 * - 事件必须在通知创建成功后发布
 * - 事件数据必须包含通知的完整信息
 * - 事件不可变，一旦创建就不能修改
 * 
 * @extends BaseDomainEvent
 */
export class NotificationCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly notification: NotificationHistory
  ) {
    super(
      notification.getAggregateId(),
      'NotificationCreated',
      {
        id: notification.id.value,
        type: notification.type.value,
        title: notification.title,
        content: notification.content,
        recipientId: notification.recipientId.value,
        tenantId: notification.tenantId?.value,
        status: notification.status.value,
        priority: notification.priority.value,
        metadata: notification.metadata,
        scheduledAt: notification.scheduledAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
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
    return new NotificationCreatedEvent(this.notification);
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
    return new NotificationCreatedEvent(this.notification);
  }
}
