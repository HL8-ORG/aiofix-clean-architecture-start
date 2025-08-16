import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { NotificationTemplate } from '../entities/notification-template.entity';

/**
 * @class TemplateUpdatedEvent
 * @description
 * 通知模板更新事件，当通知模板被更新时触发。
 * 
 * 主要功能与职责：
 * 1. 记录模板更新的时间点和更新者信息
 * 2. 包含模板的更新前后对比信息
 * 3. 支持模板更新后的业务逻辑处理
 * 4. 提供模板更新审计和追踪能力
 * 
 * 业务规则：
 * - 模板更新事件必须包含完整的更新后模板信息
 * - 事件数据必须支持模板的完整重建
 * - 更新事件应该包含更新者的身份信息
 * - 更新事件应该记录版本变化
 * 
 * @extends BaseDomainEvent
 */
export class TemplateUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly template: NotificationTemplate,
    public readonly updatedBy: string,
    public readonly changes: Record<string, any>
  ) {
    super(
      template.getAggregateId(),
      'TemplateUpdated',
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
        updatedBy: updatedBy,
        changes: changes,
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
    return new TemplateUpdatedEvent(this.template, this.updatedBy, this.changes);
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
    return new TemplateUpdatedEvent(this.template, this.updatedBy, this.changes);
  }
}
