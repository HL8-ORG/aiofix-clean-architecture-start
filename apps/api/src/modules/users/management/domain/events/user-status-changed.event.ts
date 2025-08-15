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
    super();
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns 事件数据对象
   */
  getEventData(): any {
    return {
      userId: this.user.id.value,
      email: this.user.email.value,
      username: this.user.username.value,
      oldStatus: this.user.status.value,
      newStatus: this.newStatus.value,
      statusDisplayName: this.newStatus.getDisplayName(),
      statusDescription: this.newStatus.getDescription(),
      tenantId: this.user.tenantId.value,
      updatedAt: this.user.updatedAt
    };
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns 事件类型字符串
   */
  getEventType(): string {
    return 'UserStatusChanged';
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns 聚合根ID
   */
  getAggregateId(): string {
    return this.user.id.value;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns 聚合根类型
   */
  getAggregateType(): string {
    return 'User';
  }
}
