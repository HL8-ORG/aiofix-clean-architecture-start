import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationSender } from '../entities/notification-sender.entity';

/**
 * @class NotificationSendingStartedEvent
 * @description
 * 通知发送开始事件，当通知开始发送时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知发送的开始时间
 * 2. 包含发送者和通知的关联信息
 * 3. 支持发送过程的追踪和监控
 * 4. 提供发送性能分析的基础数据
 * 
 * 业务规则：
 * - 发送开始事件必须包含完整的发送者信息
 * - 事件数据必须支持发送过程的追踪
 * - 开始事件应该包含发送的上下文信息
 * 
 * @extends BaseDomainEvent
 */
export class NotificationSendingStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly sender: NotificationSender,
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly startedAt: Date,
    public readonly metadata: Record<string, any> = {}
  ) {
    super(
      sender.id.value,
      'NotificationSendingStarted',
      {
        senderId: sender.id.value,
        senderName: sender.name.value,
        senderType: sender.type.value,
        notificationId: notificationId,
        recipientId: recipientId,
        startedAt: startedAt.toISOString(),
        metadata: metadata
      }
    );
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns {string} 聚合根类型
   */
  protected getAggregateType(): string {
    return 'NotificationSender';
  }

  /**
   * @method createCopyWithMetadata
   * @description 创建带有新元数据的副本
   * @param metadata 新的元数据
   * @returns {BaseDomainEvent} 新的事件副本
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new NotificationSendingStartedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.startedAt,
      metadata
    );
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的副本
   * @param options 新的选项
   * @returns {BaseDomainEvent} 新的事件副本
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new NotificationSendingStartedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.startedAt,
      options.metadata || this.metadata
    );
  }
}
