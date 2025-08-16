import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationSender } from '../entities/notification-sender.entity';

/**
 * @class NotificationSendingFailedEvent
 * @description
 * 通知发送失败事件，当通知发送失败时触发。
 * 
 * 主要功能与职责：
 * 1. 记录通知发送失败的时间和原因
 * 2. 包含错误信息和失败详情
 * 3. 支持失败重试和错误处理
 * 4. 提供失败分析和监控数据
 * 
 * 业务规则：
 * - 发送失败事件必须包含详细的错误信息
 * - 事件数据必须支持失败原因分析
 * - 失败事件应该包含重试相关信息
 * 
 * @extends BaseDomainEvent
 */
export class NotificationSendingFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly sender: NotificationSender,
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly failedAt: Date,
    public readonly error: {
      code: string;
      message: string;
      details?: any;
      retryable: boolean;
    },
    public readonly attemptCount: number,
    public readonly maxRetries: number,
    public readonly metadata?: Record<string, any>
  ) {
    super(
      sender.getAggregateId(),
      'NotificationSendingFailed',
      {
        senderId: sender.id.value,
        senderName: sender.name.value,
        senderType: sender.type.value,
        notificationId: notificationId,
        recipientId: recipientId,
        failedAt: failedAt.toISOString(),
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        retryable: error.retryable,
        attemptCount: attemptCount,
        maxRetries: maxRetries,
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
    return new NotificationSendingFailedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.failedAt,
      this.error,
      this.attemptCount,
      this.maxRetries,
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
    return new NotificationSendingFailedEvent(
      this.sender,
      this.notificationId,
      this.recipientId,
      this.failedAt,
      this.error,
      this.attemptCount,
      this.maxRetries,
      options.metadata
    );
  }

  /**
   * @method canRetry
   * @description 检查是否可以重试
   * @returns {boolean} 是否可以重试
   */
  canRetry(): boolean {
    return this.error.retryable && this.attemptCount < this.maxRetries;
  }

  /**
   * @method getNextRetryDelay
   * @description 获取下次重试延迟时间（毫秒）
   * @returns {number} 延迟时间
   */
  getNextRetryDelay(): number {
    // 指数退避策略
    const baseDelay = 1000; // 1秒
    const maxDelay = 300000; // 5分钟
    const delay = baseDelay * Math.pow(2, this.attemptCount - 1);
    return Math.min(delay, maxDelay);
  }
}
