import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationHistory } from '../entities/notification-history.entity';

/**
 * @class NotificationReadEvent
 * @description
 * 通知已读事件，当通知被用户标记为已读时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知已读的业务事件
 * 2. 包含通知已读时的上下文信息
 * 3. 支持事件溯源和审计追踪
 * 4. 触发后续的业务流程（如统计更新）
 * 
 * 业务规则：
 * - 事件必须在通知被标记为已读后发布
 * - 事件数据必须包含已读时间和用户信息
 * - 事件不可变，一旦创建就不能修改
 * 
 * @extends BaseDomainEvent
 */
export class NotificationReadEvent extends BaseDomainEvent {
  constructor(
    public readonly notification: NotificationHistory,
    public readonly readAt: Date,
    public readonly readByUserId: string
  ) {
    super(
      notification.getAggregateId(),
      'NotificationRead',
      {
        id: notification.id.value,
        type: notification.type.value,
        title: notification.title,
        recipientId: notification.recipientId.value,
        tenantId: notification.tenantId?.value,
        status: notification.status.value,
        priority: notification.priority.value,
        readAt: readAt,
        readByUserId: readByUserId,
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
    return new NotificationReadEvent(this.notification, this.readAt, this.readByUserId);
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
    return new NotificationReadEvent(this.notification, this.readAt, this.readByUserId);
  }
}
