import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregate, DomainEvent } from '@/shared/domain/event-sourcing/event-sourced-aggregate';
import {
  NotificationId,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationStatusEnum,
  NotificationTypeEnum,
  NotificationPriorityEnum
} from '../value-objects';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @class NotificationHistory
 * @description 通知历史聚合根，管理通知的完整生命周期和历史记录
 * 
 * 核心职责：
 * 1. 管理通知的创建、发送、状态跟踪
 * 2. 支持多种通知类型（邮件、短信、推送）
 * 3. 支持通知优先级和重试机制
 * 4. 发布通知相关的领域事件
 * 
 * 业务规则：
 * - 通知必须有接收者
 * - 通知内容不能为空
 * - 通知状态只能按特定流程转换
 * - 支持通知重试和失败处理
 */
export class NotificationHistory extends EventSourcedAggregate {
  private _id: NotificationId;
  private _type: NotificationType;
  private _title: string;
  private _content: string;
  private _recipientId: UserId;
  private _tenantId?: TenantId;
  private _status: NotificationStatus;
  private _priority: NotificationPriority;
  private _metadata: Record<string, any>;
  private _scheduledAt?: Date;
  private _sentAt?: Date;
  private _readAt?: Date;
  private _retryCount: number;
  private _maxRetries: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   */
  private constructor() {
    super();
  }

  /**
   * @method create
   * @description 创建通知的工厂方法
   * @param type 通知类型
   * @param title 通知标题
   * @param content 通知内容
   * @param recipientId 接收者ID
   * @param options 可选参数
   * @returns NotificationHistory 新创建的通知历史实例
   */
  static create(
    type: NotificationType,
    title: string,
    content: string,
    recipientId: UserId,
    options?: {
      tenantId?: TenantId;
      priority?: NotificationPriority;
      metadata?: Record<string, any>;
      scheduledAt?: Date;
      maxRetries?: number;
    }
  ): NotificationHistory {
    const notification = new NotificationHistory();
    const notificationId = new NotificationId(uuidv4());
    const now = new Date();

    // 验证输入参数
    notification.validateInput(title, content);

    // 设置基本属性
    notification._id = notificationId;
    notification._type = type;
    notification._title = title;
    notification._content = content;
    notification._recipientId = recipientId;
    notification._tenantId = options?.tenantId;
    notification._status = new NotificationStatus(NotificationStatusEnum.PENDING);
    notification._priority = options?.priority || new NotificationPriority(NotificationPriorityEnum.NORMAL);
    notification._metadata = options?.metadata || {};
    notification._scheduledAt = options?.scheduledAt;
    notification._retryCount = 0;
    notification._maxRetries = options?.maxRetries || 3;
    notification._createdAt = now;
    notification._updatedAt = now;

    return notification;
  }

  /**
   * @method send
   * @description 发送通知
   */
  send(): void {
    if (!this._status.isPending()) {
      throw new Error('Notification is not in pending status');
    }

    this._status = new NotificationStatus(NotificationStatusEnum.SENDING);
    this._updatedAt = new Date();
  }

  /**
   * @method markAsSent
   * @description 标记通知为已发送
   */
  markAsSent(): void {
    if (!this._status.isSending()) {
      throw new Error('Notification is not in sending status');
    }

    this._status = new NotificationStatus(NotificationStatusEnum.SENT);
    this._sentAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * @method markAsFailed
   * @description 标记通知为发送失败
   * @param error 错误信息
   */
  markAsFailed(error?: string): void {
    if (!this._status.isSending()) {
      throw new Error('Notification is not in sending status');
    }

    this._retryCount++;

    if (this._retryCount >= this._maxRetries) {
      this._status = new NotificationStatus(NotificationStatusEnum.FAILED);
    } else {
      this._status = new NotificationStatus(NotificationStatusEnum.PENDING);
    }

    if (error) {
      this._metadata.lastError = error;
    }

    this._updatedAt = new Date();
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   */
  markAsRead(): void {
    if (!this._status.isSent()) {
      throw new Error('Notification is not in sent status');
    }

    this._status = new NotificationStatus(NotificationStatusEnum.READ);
    this._readAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * @method retry
   * @description 重试发送通知
   */
  retry(): void {
    if (!this._status.isFailed()) {
      throw new Error('Notification is not in failed status');
    }

    if (this._retryCount >= this._maxRetries) {
      throw new Error('Maximum retry count exceeded');
    }

    this._status = new NotificationStatus(NotificationStatusEnum.PENDING);
    this._updatedAt = new Date();
  }

  /**
   * @method validateInput
   * @description 验证输入参数
   * @param title 标题
   * @param content 内容
   * @throws Error 当输入无效时
   */
  private validateInput(title: string, content: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Notification title cannot be empty');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Notification content cannot be empty');
    }

    if (title.length > 200) {
      throw new Error('Notification title cannot exceed 200 characters');
    }

    if (content.length > 5000) {
      throw new Error('Notification content cannot exceed 5000 characters');
    }
  }

  /**
   * @method canBeRetried
   * @description 检查通知是否可以重试
   * @returns boolean
   */
  canBeRetried(): boolean {
    return this._status.isFailed() && this._retryCount < this._maxRetries;
  }

  /**
   * @method isPending
   * @description 检查通知是否待发送
   * @returns boolean
   */
  isPending(): boolean {
    return this._status.isPending();
  }

  /**
   * @method isSent
   * @description 检查通知是否已发送
   * @returns boolean
   */
  isSent(): boolean {
    return this._status.isSent();
  }

  /**
   * @method isFailed
   * @description 检查通知是否发送失败
   * @returns boolean
   */
  isFailed(): boolean {
    return this._status.isFailed();
  }

  /**
   * @method isRead
   * @description 检查通知是否已读
   * @returns boolean
   */
  isRead(): boolean {
    return this._status.isRead();
  }

  // Getters
  get id(): NotificationId {
    return this._id;
  }

  get type(): NotificationType {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get recipientId(): UserId {
    return this._recipientId;
  }

  get tenantId(): TenantId | undefined {
    return this._tenantId;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get priority(): NotificationPriority {
    return this._priority;
  }

  get metadata(): Record<string, any> {
    return this._metadata;
  }

  get scheduledAt(): Date | undefined {
    return this._scheduledAt;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get maxRetries(): number {
    return this._maxRetries;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID，用于事件溯源
   * @returns string
   */
  getAggregateId(): string {
    return this._id.value;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型，用于事件溯源
   * @returns string
   */
  getAggregateType(): string {
    return 'NotificationHistory';
  }

  /**
   * @method getSnapshotData
   * @description 获取聚合根快照数据，用于事件溯源优化
   * @returns Record<string, any>
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      type: this._type.value,
      title: this._title,
      content: this._content,
      recipientId: this._recipientId.value,
      tenantId: this._tenantId?.value,
      status: this._status.value,
      priority: this._priority.value,
      metadata: this._metadata,
      scheduledAt: this._scheduledAt,
      sentAt: this._sentAt,
      readAt: this._readAt,
      retryCount: this._retryCount,
      maxRetries: this._maxRetries,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载聚合根状态
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new NotificationId(snapshotData.id);
    this._type = new NotificationType(snapshotData.type);
    this._title = snapshotData.title;
    this._content = snapshotData.content;
    this._recipientId = new UserId(snapshotData.recipientId);
    this._tenantId = snapshotData.tenantId ? new TenantId(snapshotData.tenantId) : undefined;
    this._status = new NotificationStatus(snapshotData.status);
    this._priority = new NotificationPriority(snapshotData.priority);
    this._metadata = snapshotData.metadata;
    this._scheduledAt = snapshotData.scheduledAt ? new Date(snapshotData.scheduledAt) : undefined;
    this._sentAt = snapshotData.sentAt ? new Date(snapshotData.sentAt) : undefined;
    this._readAt = snapshotData.readAt ? new Date(snapshotData.readAt) : undefined;
    this._retryCount = snapshotData.retryCount;
    this._maxRetries = snapshotData.maxRetries;
    this._createdAt = new Date(snapshotData.createdAt);
    this._updatedAt = new Date(snapshotData.updatedAt);
  }

  /**
   * @method handleEvent
   * @description 处理领域事件，用于事件溯源
   * @param event 领域事件
   */
  protected handleEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'NotificationCreated':
        this.handleNotificationCreated(event);
        break;
      case 'NotificationSent':
        this.handleNotificationSent(event);
        break;
      case 'NotificationRead':
        this.handleNotificationRead(event);
        break;
      case 'NotificationFailed':
        this.handleNotificationFailed(event);
        break;
      case 'NotificationRetried':
        this.handleNotificationRetried(event);
        break;
      default:
        // 忽略未知事件类型
        break;
    }
  }

  /**
   * @private handleNotificationCreated
   * @description 处理通知创建事件
   * @param event 通知创建事件
   */
  private handleNotificationCreated(event: DomainEvent): void {
    // 通知创建事件处理逻辑
    // 聚合根状态已经在创建时设置，这里主要用于事件溯源
  }

  /**
   * @private handleNotificationSent
   * @description 处理通知发送事件
   * @param event 通知发送事件
   */
  private handleNotificationSent(event: DomainEvent): void {
    this._status = new NotificationStatus(NotificationStatusEnum.SENT);
    this._sentAt = new Date(event.eventData.sentAt);
    this._updatedAt = new Date();
  }

  /**
   * @private handleNotificationRead
   * @description 处理通知已读事件
   * @param event 通知已读事件
   */
  private handleNotificationRead(event: DomainEvent): void {
    this._status = new NotificationStatus(NotificationStatusEnum.READ);
    this._readAt = new Date(event.eventData.readAt);
    this._updatedAt = new Date();
  }

  /**
   * @private handleNotificationFailed
   * @description 处理通知失败事件
   * @param event 通知失败事件
   */
  private handleNotificationFailed(event: DomainEvent): void {
    this._status = new NotificationStatus(NotificationStatusEnum.FAILED);
    this._retryCount = event.eventData.retryCount || this._retryCount;
    if (event.eventData.error) {
      this._metadata.lastError = event.eventData.error;
    }
    this._updatedAt = new Date();
  }

  /**
   * @private handleNotificationRetried
   * @description 处理通知重试事件
   * @param event 通知重试事件
   */
  private handleNotificationRetried(event: DomainEvent): void {
    this._status = new NotificationStatus(NotificationStatusEnum.PENDING);
    this._retryCount = event.eventData.retryCount || this._retryCount;
    this._updatedAt = new Date();
  }
}
