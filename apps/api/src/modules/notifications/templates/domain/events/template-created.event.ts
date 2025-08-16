import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationTemplate } from '../entities/notification-template.entity';

/**
 * @class TemplateCreatedEvent
 * @description
 * 通知模板创建事件，当新的通知模板被创建时触发。
 * 
 * 主要功能与职责：
 * 1. 记录模板创建的时间点和创建者信息
 * 2. 包含模板的完整配置信息，用于事件溯源
 * 3. 支持模板创建后的业务逻辑处理
 * 4. 提供模板创建审计和追踪能力
 * 
 * 业务规则：
 * - 模板创建事件必须包含完整的模板信息
 * - 事件数据必须支持模板的完整重建
 * - 创建事件应该包含创建者的身份信息
 * 
 * @extends BaseDomainEvent
 */
export class TemplateCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly template: NotificationTemplate
  ) {
    super(
      template.getAggregateId(),
      'TemplateCreated',
      {
        id: template.id.value,
        name: template.name.value,
        content: template.content.value,
        subject: template.subject?.value,
        type: template.type.value,
        language: template.language.value,
        status: template.status.value,
        variables: template.variables.map(v => v.toPlainObject()),
        createdBy: template.createdBy.value,
        tenantId: template.tenantId?.value,
        templateVersion: template.templateVersion,
        isDefault: template.isDefault,
        metadata: template.metadata,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    );
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型
   * @returns {string} 聚合根类型
   */
  protected getAggregateType(): string {
    return 'NotificationTemplate';
  }

  /**
   * @method createCopyWithMetadata
   * @description 创建带有新元数据的副本
   * @param metadata 新的元数据
   * @returns {BaseDomainEvent} 新的事件副本
   */
  protected createCopyWithMetadata(metadata: Record<string, any>): BaseDomainEvent {
    return new TemplateCreatedEvent(this.template);
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
    return new TemplateCreatedEvent(this.template);
  }
}
