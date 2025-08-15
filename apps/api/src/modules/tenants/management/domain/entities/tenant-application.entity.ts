import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregate } from '../../../../shared/domain/event-sourcing/event-sourced-aggregate';
import { ApplicationId } from '../value-objects/application-id';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { ApplicationStatus } from '../value-objects/application-status';
import { UserId } from '../../../users/management/domain/value-objects/user-id';
import { TenantApplicationSubmittedEvent } from '../events/tenant-application-submitted.event';
import { TenantApplicationReviewedEvent } from '../events/tenant-application-reviewed.event';

/**
 * @class TenantApplication
 * @description 租户申请聚合根，管理租户创建申请流程
 * 
 * 核心职责：
 * 1. 管理租户申请的完整生命周期
 * 2. 确保申请信息的完整性和有效性
 * 3. 支持申请审核流程
 * 4. 发布申请相关的领域事件
 * 
 * 业务规则：
 * - 申请人必须归属默认系统租户
 * - 租户名称和代码必须全局唯一
 * - 申请状态只能按特定流程转换
 * - 审核操作必须记录审核人和审核时间
 */
export class TenantApplication extends EventSourcedAggregate {
  private _id: ApplicationId;
  private _applicantId: UserId;
  private _tenantName: TenantName;
  private _tenantCode: TenantCode;
  private _description?: string;
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
   * @description 提交租户申请的工厂方法
   * @param applicantId 申请人ID
   * @param tenantName 租户名称
   * @param tenantCode 租户代码
   * @param description 申请描述
   * @returns TenantApplication 新创建的申请实例
   */
  static submit(
    applicantId: UserId,
    tenantName: TenantName,
    tenantCode: TenantCode,
    description?: string
  ): TenantApplication {
    const application = new TenantApplication();
    const applicationId = new ApplicationId(uuidv4());
    const now = new Date();

    // 设置基本属性
    application._id = applicationId;
    application._applicantId = applicantId;
    application._tenantName = tenantName;
    application._tenantCode = tenantCode;
    application._description = description;
    application._status = ApplicationStatus.PENDING;
    application._createdAt = now;
    application._updatedAt = now;

    // 发布申请提交事件
    application.apply(new TenantApplicationSubmittedEvent(application));

    return application;
  }

  /**
   * @method review
   * @description 审核租户申请
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
    this.apply(new TenantApplicationReviewedEvent(this, approved, comment));
  }

  /**
   * @method cancel
   * @description 取消申请（仅申请人可以取消待审核的申请）
   */
  cancel(): void {
    if (this._status !== ApplicationStatus.PENDING) {
      throw new Error('Only pending applications can be cancelled');
    }

    this._status = ApplicationStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  /**
   * @method isPending
   * @description 判断申请是否处于待审核状态
   * @returns boolean
   */
  isPending(): boolean {
    return this._status.equals(ApplicationStatus.PENDING);
  }

  /**
   * @method isApproved
   * @description 判断申请是否已通过
   * @returns boolean
   */
  isApproved(): boolean {
    return this._status.equals(ApplicationStatus.APPROVED);
  }

  /**
   * @method isRejected
   * @description 判断申请是否被拒绝
   * @returns boolean
   */
  isRejected(): boolean {
    return this._status.equals(ApplicationStatus.REJECTED);
  }

  /**
   * @method isCancelled
   * @description 判断申请是否已取消
   * @returns boolean
   */
  isCancelled(): boolean {
    return this._status.equals(ApplicationStatus.CANCELLED);
  }

  /**
   * @method canBeReviewed
   * @description 判断申请是否可以审核
   * @returns boolean
   */
  canBeReviewed(): boolean {
    return this._status.equals(ApplicationStatus.PENDING);
  }

  /**
   * @method canBeCancelled
   * @description 判断申请是否可以取消
   * @returns boolean
   */
  canBeCancelled(): boolean {
    return this._status.equals(ApplicationStatus.PENDING);
  }

  // Getters
  get id(): ApplicationId {
    return this._id;
  }

  get applicantId(): UserId {
    return this._applicantId;
  }

  get tenantName(): TenantName {
    return this._tenantName;
  }

  get tenantCode(): TenantCode {
    return this._tenantCode;
  }

  get description(): string | undefined {
    return this._description;
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
    return 'TenantApplication';
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照，用于事件溯源优化
   * @returns TenantApplicationSnapshot
   */
  toSnapshot(): TenantApplicationSnapshot {
    return {
      id: this._id.value,
      applicantId: this._applicantId.value,
      tenantName: this._tenantName.value,
      tenantCode: this._tenantCode.value,
      description: this._description,
      status: this._status.value,
      reviewerId: this._reviewerId?.value,
      reviewComment: this._reviewComment,
      reviewedAt: this._reviewedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根状态
   * @param snapshot 申请快照
   * @returns TenantApplication
   */
  static fromSnapshot(snapshot: TenantApplicationSnapshot): TenantApplication {
    const application = new TenantApplication();

    application._id = new ApplicationId(snapshot.id);
    application._applicantId = new UserId(snapshot.applicantId);
    application._tenantName = new TenantName(snapshot.tenantName);
    application._tenantCode = new TenantCode(snapshot.tenantCode);
    application._description = snapshot.description;
    application._status = new ApplicationStatus(snapshot.status);
    application._reviewerId = snapshot.reviewerId ? new UserId(snapshot.reviewerId) : undefined;
    application._reviewComment = snapshot.reviewComment;
    application._reviewedAt = snapshot.reviewedAt;
    application._createdAt = snapshot.createdAt;
    application._updatedAt = snapshot.updatedAt;

    return application;
  }
}

/**
 * @interface TenantApplicationSnapshot
 * @description 租户申请快照接口，用于事件溯源优化
 */
export interface TenantApplicationSnapshot {
  id: string;
  applicantId: string;
  tenantName: string;
  tenantCode: string;
  description?: string;
  status: string;
  reviewerId?: string;
  reviewComment?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
