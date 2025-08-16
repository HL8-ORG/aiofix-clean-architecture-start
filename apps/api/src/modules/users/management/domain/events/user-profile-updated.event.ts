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
    super(
      user.id.value,
      'UserProfileUpdated',
      {
        userId: user.id.value,
        email: user.email.value,
        username: user.username.value,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status.value,
        tenantId: user.tenantId.value,
        primaryOrganizationId: user.primaryOrganizationId,
        organizations: user.organizations,
        roles: user.roles,
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
   * @returns UserProfileUpdatedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new UserProfileUpdatedEvent(this.user);
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的事件副本
   * @param options 新选项
   * @returns UserProfileUpdatedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new UserProfileUpdatedEvent(this.user);
  }
}
