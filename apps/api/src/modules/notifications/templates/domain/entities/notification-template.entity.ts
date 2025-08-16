import { EventSourcedAggregate, DomainEvent } from '@/shared/domain/event-sourcing/event-sourced-aggregate';
import { BaseDomainEvent } from '@/shared/domain/events/base.event';
import { TemplateId } from '../value-objects/template-id';
import { TemplateType, TemplateTypeEnum } from '../value-objects/template-type';
import { TemplateLanguage, TemplateLanguageEnum } from '../value-objects/template-language';
import { TemplateVariable, VariableName, VariableDescription, VariableType, VariableDefaultValue } from './template-variable.entity';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { StringValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @class TemplateName
 * @description 模板名称值对象
 */
export class TemplateName extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 200) {
      return false;
    }

    return true;
  }
}

/**
 * @class TemplateContent
 * @description 模板内容值对象
 */
export class TemplateContent extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 10000) {
      return false;
    }

    return true;
  }
}

/**
 * @class TemplateSubject
 * @description 模板主题值对象
 */
export class TemplateSubject extends StringValueObject {
  constructor(value: string) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    if (value.length > 500) {
      return false;
    }

    return true;
  }
}

/**
 * @enum TemplateStatusEnum
 * @description 模板状态枚举
 */
export enum TemplateStatusEnum {
  DRAFT = 'DRAFT',             // 草稿
  ACTIVE = 'ACTIVE',           // 激活
  INACTIVE = 'INACTIVE',       // 非激活
  ARCHIVED = 'ARCHIVED'        // 已归档
}

/**
 * @class TemplateStatus
 * @description 模板状态值对象
 */
export class TemplateStatus extends StringValueObject {
  constructor(value: TemplateStatusEnum) {
    super(value);
  }

  protected isValidValue(value: string): boolean {
    return Object.values(TemplateStatusEnum).includes(value as TemplateStatusEnum);
  }

  /**
   * @method isDraft
   * @description 检查是否为草稿状态
   * @returns {boolean} 是否为草稿状态
   */
  isDraft(): boolean {
    return this.value === TemplateStatusEnum.DRAFT;
  }

  /**
   * @method isActive
   * @description 检查是否为激活状态
   * @returns {boolean} 是否为激活状态
   */
  isActive(): boolean {
    return this.value === TemplateStatusEnum.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 检查是否为非激活状态
   * @returns {boolean} 是否为非激活状态
   */
  isInactive(): boolean {
    return this.value === TemplateStatusEnum.INACTIVE;
  }

  /**
   * @method isArchived
   * @description 检查是否为已归档状态
   * @returns {boolean} 是否为已归档状态
   */
  isArchived(): boolean {
    return this.value === TemplateStatusEnum.ARCHIVED;
  }

  /**
   * @method canActivate
   * @description 检查是否可以激活
   * @returns {boolean} 是否可以激活
   */
  canActivate(): boolean {
    return this.isDraft() || this.isInactive();
  }

  /**
   * @method canDeactivate
   * @description 检查是否可以停用
   * @returns {boolean} 是否可以停用
   */
  canDeactivate(): boolean {
    return this.isActive();
  }

  /**
   * @method canArchive
   * @description 检查是否可以归档
   * @returns {boolean} 是否可以归档
   */
  canArchive(): boolean {
    return this.isInactive();
  }
}

/**
 * @class NotificationTemplate
 * @description
 * 通知模板聚合根，用于管理通知模板的完整生命周期。
 * 
 * 主要功能与职责：
 * 1. 管理模板的基本信息（名称、内容、类型、语言等）
 * 2. 处理模板变量的定义和管理
 * 3. 控制模板的状态转换（草稿、激活、非激活、归档）
 * 4. 支持模板的版本管理和历史追踪
 * 5. 提供模板验证和渲染功能
 * 
 * 业务规则：
 * - 模板名称在租户内必须唯一
 * - 激活状态的模板不能直接删除
 * - 模板变量必须符合类型定义
 * - 模板内容必须包含有效的变量占位符
 * - 只有激活状态的模板才能被使用
 * 
 * @extends EventSourcedAggregate
 */
export class NotificationTemplate extends EventSourcedAggregate {
  private _id: TemplateId;
  private _name: TemplateName;
  private _content: TemplateContent;
  private _subject?: TemplateSubject;
  private _type: TemplateType;
  private _language: TemplateLanguage;
  private _status: TemplateStatus;
  private _variables: TemplateVariable[];
  private _createdBy: UserId;
  private _tenantId?: TenantId;
  private _templateVersion: number;
  private _isDefault: boolean;
  private _metadata?: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _publishedAt?: Date;

  constructor(
    id: TemplateId,
    name: TemplateName,
    content: TemplateContent,
    type: TemplateType,
    language: TemplateLanguage,
    createdBy: UserId,
    subject?: TemplateSubject,
    tenantId?: TenantId,
    metadata?: Record<string, any>
  ) {
    super();
    this._id = id;
    this._name = name;
    this._content = content;
    this._subject = subject;
    this._type = type;
    this._language = language;
    this._status = new TemplateStatus(TemplateStatusEnum.DRAFT);
    this._variables = [];
    this._createdBy = createdBy;
    this._tenantId = tenantId;
    this._templateVersion = 1;
    this._isDefault = false;
    this._metadata = metadata;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Getters
  get id(): TemplateId {
    return this._id;
  }

  get name(): TemplateName {
    return this._name;
  }

  get content(): TemplateContent {
    return this._content;
  }

  get subject(): TemplateSubject | undefined {
    return this._subject;
  }

  get type(): TemplateType {
    return this._type;
  }

  get language(): TemplateLanguage {
    return this._language;
  }

  get status(): TemplateStatus {
    return this._status;
  }

  get variables(): TemplateVariable[] {
    return [...this._variables];
  }

  get createdBy(): UserId {
    return this._createdBy;
  }

  get tenantId(): TenantId | undefined {
    return this._tenantId;
  }

  get templateVersion(): number {
    return this._templateVersion;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get publishedAt(): Date | undefined {
    return this._publishedAt ? new Date(this._publishedAt) : undefined;
  }

  /**
   * @protected handleEvent
   * @description 处理领域事件，实现EventSourcedAggregate抽象方法
   * @param event 领域事件
   */
  protected handleEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'TemplateCreated':
        this.handleTemplateCreated(event);
        break;
      case 'TemplateUpdated':
        this.handleTemplateUpdated(event);
        break;
      case 'TemplateActivated':
        this.handleTemplateActivated(event);
        break;
      case 'TemplateDeactivated':
        this.handleTemplateDeactivated(event);
        break;
      case 'TemplateArchived':
        this.handleTemplateArchived(event);
        break;
      case 'TemplateVariableAdded':
        this.handleTemplateVariableAdded(event);
        break;
      case 'TemplateVariableRemoved':
        this.handleTemplateVariableRemoved(event);
        break;
      default:
        // 忽略未知事件类型
        break;
    }
  }

  /**
   * @method getSnapshotData
   * @description 获取快照数据，实现EventSourcedAggregate抽象方法
   * @returns {Record<string, any>} 快照数据
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      name: this._name.value,
      content: this._content.value,
      subject: this._subject?.value,
      type: this._type.value,
      language: this._language.value,
      status: this._status.value,
      variables: this._variables.map(v => v.toPlainObject()),
      createdBy: this._createdBy.value,
      tenantId: this._tenantId?.value,
      templateVersion: this._templateVersion,
      isDefault: this._isDefault,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      publishedAt: this._publishedAt?.toISOString()
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载状态，实现EventSourcedAggregate抽象方法
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new TemplateId(snapshotData.id);
    this._name = new TemplateName(snapshotData.name);
    this._content = new TemplateContent(snapshotData.content);
    this._subject = snapshotData.subject ? new TemplateSubject(snapshotData.subject) : undefined;
    this._type = new TemplateType(snapshotData.type as TemplateTypeEnum);
    this._language = new TemplateLanguage(snapshotData.language as TemplateLanguageEnum);
    this._status = new TemplateStatus(snapshotData.status as TemplateStatusEnum);
    this._variables = snapshotData.variables?.map((v: any) =>
      new TemplateVariable(
        new VariableName(v.name),
        new VariableDescription(v.description),
        new VariableType(v.type),
        v.isRequired,
        v.defaultValue ? new VariableDefaultValue(v.defaultValue) : undefined,
        v.validationPattern,
        v.metadata
      )
    ) || [];
    this._createdBy = new UserId(snapshotData.createdBy);
    this._tenantId = snapshotData.tenantId ? new TenantId(snapshotData.tenantId) : undefined;
    this._templateVersion = snapshotData.templateVersion;
    this._isDefault = snapshotData.isDefault;
    this._metadata = snapshotData.metadata;
    this._createdAt = new Date(snapshotData.createdAt);
    this._updatedAt = new Date(snapshotData.updatedAt);
    this._publishedAt = snapshotData.publishedAt ? new Date(snapshotData.publishedAt) : undefined;
  }

  // 私有事件处理方法
  private handleTemplateCreated(event: DomainEvent): void {
    // 模板创建事件处理逻辑
  }

  private handleTemplateUpdated(event: DomainEvent): void {
    // 模板更新事件处理逻辑
  }

  private handleTemplateActivated(event: DomainEvent): void {
    // 模板激活事件处理逻辑
  }

  private handleTemplateDeactivated(event: DomainEvent): void {
    // 模板停用事件处理逻辑
  }

  private handleTemplateArchived(event: DomainEvent): void {
    // 模板归档事件处理逻辑
  }

  private handleTemplateVariableAdded(event: DomainEvent): void {
    // 模板变量添加事件处理逻辑
  }

  private handleTemplateVariableRemoved(event: DomainEvent): void {
    // 模板变量移除事件处理逻辑
  }
}
