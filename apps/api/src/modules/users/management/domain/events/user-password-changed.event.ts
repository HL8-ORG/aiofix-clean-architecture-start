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
      passwordChanged: true,
      passwordStrength: this.user.password.getStrength(),
      passwordStrengthLevel: this.user.password.getStrengthLevel(),
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
    return 'UserPasswordChanged';
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
