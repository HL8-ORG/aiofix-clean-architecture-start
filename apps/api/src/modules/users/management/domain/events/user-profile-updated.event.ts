import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { User } from '../entities/user.entity';

/**
 * @class UserProfileUpdatedEvent
 * @description 用户档案更新事件
 * 
 * 事件数据包含：
 * - 用户的基本信息
 * - 更新的字段信息
 * - 更新时间
 */
export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly user: User
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
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      nickname: this.user.nickname,
      phoneNumber: this.user.phoneNumber,
      avatar: this.user.avatar,
      bio: this.user.bio,
      status: this.user.status.value,
      tenantId: this.user.tenantId.value,
      primaryOrganizationId: this.user.primaryOrganizationId,
      organizations: this.user.organizations,
      roles: this.user.roles,
      updatedAt: this.user.updatedAt
    };
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns 事件类型字符串
   */
  getEventType(): string {
    return 'UserProfileUpdated';
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
