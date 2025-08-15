import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregate } from '../../../../shared/domain/event-sourcing/event-sourced-aggregate';
import { ApplicationId } from '../value-objects/application-id';
import { ApplicationStatus } from '../value-objects/application-status';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '../../../users/management/domain/value-objects/user-id';
import { TenantDomainChangeApplicationSubmittedEvent } from '../events/tenant-domain-change-application-submitted.event';
import { TenantDomainChangeApplicationReviewedEvent } from '../events/tenant-domain-change-application-reviewed.event';

/**
 * @class TenantDomainChangeApplication
 * @description 租户域名变更申请聚合根，管理租户域名变更申请流程
 * 
 * 核心职责：
 * 1. 管理租户域名变更申请的完整生命周期
 * 2. 确保申请信息的完整性和有效性
 * 3. 支持申请审核流程
 * 4. 发布申请相关的领域事件
 * 
 * 业务规则：
 * - 申请人必须是租户管理员
 * - 新域名必须符合格式规范
 * - 新域名必须全局唯一
 * - 申请状态只能按特定流程转换
 * - 审核操作必须记录审核人和审核时间
 */
export class TenantDomainChangeApplication extends EventSourcedAggregate {
  private _id: ApplicationId;
  private _tenantId: TenantId;
  private _applicantId: UserId;
  private _currentDomain?: string;
  private _newDomain: string;
  private _reason: string;
  private _status: ApplicationStatus;
  private _reviewerId?: UserId;
  private _reviewComment?: string;
  private _reviewedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   */
  private constructor() {
    super();
  }

  /**
   * @method submit
   * @description 提交租户域名变更申请的工厂方法
   * @param tenantId 租户ID
   * @param applicantId 申请人ID（必须是租户管理员）
   * @param newDomain 新域名
   * @param reason 变更原因
   * @param currentDomain 当前域名（可选）
   * @returns TenantDomainChangeApplication 新创建的申请实例
   */
  static submit(
    tenantId: TenantId,
    applicantId: UserId,
    newDomain: string,
    reason: string,
    currentDomain?: string
  ): TenantDomainChangeApplication {
    const application = new TenantDomainChangeApplication();
    const applicationId = new ApplicationId(uuidv4());
    const now = new Date();

    // 验证新域名格式
    application.validateDomain(newDomain);

    // 设置基本属性
    application._id = applicationId;
    application._tenantId = tenantId;
    application._applicantId = applicantId;
    application._currentDomain = currentDomain;
    application._newDomain = newDomain;
    application._reason = reason;
    application._status = ApplicationStatus.PENDING;
    application._createdAt = now;
    application._updatedAt = now;

    // 发布申请提交事件
    application.apply(new TenantDomainChangeApplicationSubmittedEvent(application));

    return application;
  }

  /**
   * @method review
   * @description 审核租户域名变更申请
   * @param reviewerId 审核人ID
   * @param approved 是否通过
   * @param comment 审核意见
   */
  review(reviewerId: UserId, approved: boolean, comment?: string): void {
    if (this._status !== ApplicationStatus.PENDING) {
      throw new Error('Application is not in pending status');
    }

    this._reviewerId = reviewerId;
    this._reviewComment = comment;
    this._reviewedAt = new Date();
    this._updatedAt = new Date();

    // 更新状态
    this._status = approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;

    // 发布申请审核事件
    this.apply(new TenantDomainChangeApplicationReviewedEvent(this, approved, comment));
  }

  /**
   * @method validateDomain
   * @description 验证域名格式
   * @param domain 域名
   * @throws Error 当域名格式无效时
   */
  private validateDomain(domain: string): void {
    // 域名长度：3-63个字符
    if (domain.length < 3 || domain.length > 63) {
      throw new Error('Domain length must be between 3 and 63 characters');
    }

    // 只能包含字母、数字、连字符
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!domainRegex.test(domain)) {
      throw new Error('Domain can only contain letters, numbers, and hyphens');
    }

    // 不能以连字符开头或结尾
    if (domain.startsWith('-') || domain.endsWith('-')) {
      throw new Error('Domain cannot start or end with a hyphen');
    }

    // 不能包含连续连字符
    if (domain.includes('--')) {
      throw new Error('Domain cannot contain consecutive hyphens');
    }
  }

  /**
   * @method canBeReviewed
   * @description 检查申请是否可以被审核
   * @returns boolean
   */
  canBeReviewed(): boolean {
    return this._status === ApplicationStatus.PENDING;
  }

  /**
   * @method isApproved
   * @description 检查申请是否已通过
   * @returns boolean
   */
  isApproved(): boolean {
    return this._status === ApplicationStatus.APPROVED;
  }

  /**
   * @method isRejected
   * @description 检查申请是否被拒绝
   * @returns boolean
   */
  isRejected(): boolean {
    return this._status === ApplicationStatus.REJECTED;
  }

  /**
   * @method isPending
   * @description 检查申请是否待审核
   * @returns boolean
   */
  isPending(): boolean {
    return this._status === ApplicationStatus.PENDING;
  }

  // Getters
  get id(): ApplicationId {
    return this._id;
  }

  get tenantId(): TenantId {
    return this._tenantId;
  }

  get applicantId(): UserId {
    return this._applicantId;
  }

  get currentDomain(): string | undefined {
    return this._currentDomain;
  }

  get newDomain(): string {
    return this._newDomain;
  }

  get reason(): string {
    return this._reason;
  }

  get status(): ApplicationStatus {
    return this._status;
  }

  get reviewerId(): UserId | undefined {
    return this._reviewerId;
  }

  get reviewComment(): string | undefined {
    return this._reviewComment;
  }

  get reviewedAt(): Date | undefined {
    return this._reviewedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID，用于事件溯源
   * @returns string
   */
  getAggregateId(): string {
    return this._id.value;
  }

  /**
   * @method getAggregateType
   * @description 获取聚合根类型，用于事件溯源
   * @returns string
   */
  getAggregateType(): string {
    return 'TenantDomainChangeApplication';
  }

  /**
   * @method getSnapshotData
   * @description 获取聚合根快照数据，用于事件溯源优化
   * @returns Record<string, any>
   */
  getSnapshotData(): Record<string, any> {
    return {
      id: this._id.value,
      tenantId: this._tenantId.value,
      applicantId: this._applicantId.value,
      currentDomain: this._currentDomain,
      newDomain: this._newDomain,
      reason: this._reason,
      status: this._status.value,
      reviewerId: this._reviewerId?.value,
      reviewComment: this._reviewComment,
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method loadFromSnapshot
   * @description 从快照数据加载聚合根状态
   * @param snapshotData 快照数据
   */
  loadFromSnapshot(snapshotData: Record<string, any>): void {
    this._id = new ApplicationId(snapshotData.id);
    this._tenantId = new TenantId(snapshotData.tenantId);
    this._applicantId = new UserId(snapshotData.applicantId);
    this._currentDomain = snapshotData.currentDomain;
    this._newDomain = snapshotData.newDomain;
    this._reason = snapshotData.reason;
    this._status = new ApplicationStatus(snapshotData.status);
    this._reviewerId = snapshotData.reviewerId ? new UserId(snapshotData.reviewerId) : undefined;
    this._reviewComment = snapshotData.reviewComment;
    this._reviewedAt = snapshotData.reviewedAt ? new Date(snapshotData.reviewedAt) : undefined;
    this._createdAt = new Date(snapshotData.createdAt);
    this._updatedAt = new Date(snapshotData.updatedAt);
  }
}
