import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationSender } from '../entities/notification-sender.entity';

/**
 * @class NotificationSendingCompletedEvent
 * @description
 * 通知发送完成事件，当通知发送成功完成时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知发送的完成时间和结果
 * 2. 包含发送性能指标和统计信息
 * 3. 支持发送成功后的业务逻辑处理
 * 4. 提供发送质量分析的基础数据
 * 
 * 业务规则：
 * - 发送完成事件必须包含发送结果和性能指标
 * - 事件数据必须支持发送质量分析
 * - 完成事件应该包含发送的详细信息
 * 
 * @extends BaseDomainEvent
 */
export class NotificationSendingCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly sender: NotificationSender,
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly completedAt: Date,
    public readonly responseTime: number,
    public readonly result: {
      success: boolean;
      messageId?: string;
      externalId?: string;
      response?: any;
    },
    public readonly metadata?: Record<string, any>
  ) {
    super(
      sender.getAggregateId(),
      'NotificationSendingCompleted',
      {
        senderId: sender.id.value,
        senderName: sender.name.value,
        senderType: sender.type.value,
        notificationId: notificationId,
        recipientId: recipientId,
        completedAt: completedAt.toISOString(),
        responseTime: responseTime,
        success: result.success,
        messageId: result.messageId,
        externalId: result.externalId,
        response: result.response,
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
    return new NotificationSendingCompletedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.completedAt,
      this.responseTime,
      this.result,
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
    return new NotificationSendingCompletedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.completedAt,
      this.responseTime,
      this.result,
      options.metadata
    );
  }
}
