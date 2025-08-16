import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { User } from '../entities/user.entity';

/**
 * @class UserCreatedEvent
 * @description 用户创建事件
 * 
 * 事件数据包含：
 * - 用户的基本信息
 * - 创建时间
 * - 租户信息
 * - 组织信息
 */
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly user: User
  ) {
    super(
      user.id.value,
      'UserCreated',
      {
        userId: user.id.value,
        email: user.email.value,
        username: user.username.value,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        phoneNumber: user.phoneNumber,
        status: user.status.value,
        tenantId: user.tenantId.value,
        primaryOrganizationId: user.primaryOrganizationId,
        organizations: user.organizations,
        roles: user.roles,
        createdAt: user.createdAt,
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
   * @returns UserCreatedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new UserCreatedEvent(this.user);
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的事件副本
   * @param options 新选项
   * @returns UserCreatedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new UserCreatedEvent(this.user);
  }
}
