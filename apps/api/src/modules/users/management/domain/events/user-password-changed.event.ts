import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { User } from '../entities/user.entity';

/**
 * @class UserPasswordChangedEvent
 * @description 用户密码变更事件
 * 
 * 事件数据包含：
 * - 用户的基本信息
 * - 密码变更信息
 * - 变更时间
 * 
 * 注意：出于安全考虑，事件数据中不包含密码信息
 */
export class UserPasswordChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly user: User
  ) {
    super(
      user.id.value,
      'UserPasswordChanged',
      {
        userId: user.id.value,
        email: user.email.value,
        username: user.username.value,
        passwordChanged: true,
        passwordStrength: user.password.getStrength(),
        passwordStrengthLevel: user.password.getStrengthLevel(),
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
   * @returns UserPasswordChangedEvent
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new UserPasswordChangedEvent(this.user);
  }

  /**
   * @method createCopyWithOptions
   * @description 创建带有新选项的事件副本
   * @param options 新选项
   * @returns UserPasswordChangedEvent
   */
  protected createCopyWithOptions(options: {
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
  }): BaseDomainEvent {
    return new UserPasswordChangedEvent(this.user);
  }
}
