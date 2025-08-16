import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { User } from '../entities/user.entity';
import { UserStatus } from '../value-objects/user-status';

/**
 * @class UserStatusChangedEvent
 * @description 用户状态变更事件
 * 
 * 事件数据包含：
 * - 用户的基本信息
 * - 状态变更信息
 * - 变更时间
 */
export class UserStatusChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly user: User,
    public readonly newStatus: UserStatus
  ) {
    super(
      user.id.value,
      'UserStatusChanged',
      {
        userId: user.id.value,
        email: user.email.value,
        username: user.username.value,
        oldStatus: user.status.value,
        newStatus: newStatus.value,
        statusDisplayName: newStatus.getDisplayName(),
        statusDescription: newStatus.getDescription(),
        tenantId: user.tenantId.value,
        updatedAt: user.updatedAt
      }
    );
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns 聚合根类型
   */
  protected getAggregateType(): string {
    return 'User';
  }

  /**
   * @method createCopyWithMetadata
   * @description 创建带有新元数据的事件副本
   * @param metadata 新元数据
   * @returns UserStatusChangedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new UserStatusChangedEvent(this.user, this.newStatus);
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的事件副本
   * @param options 新选项
   * @returns UserStatusChangedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new UserStatusChangedEvent(this.user, this.newStatus);
  }
}
