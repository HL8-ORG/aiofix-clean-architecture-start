import { TenantDomainChangeApplication } from '../entities/tenant-domain-change-application.entity';
import { ApplicationId } from '../value-objects/application-id';
import { ApplicationStatus } from '../value-objects/application-status';
import { TenantId } from '../value-objects/tenant-id';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';

/**
 * @interface ITenantDomainChangeApplicationRepository
 * @description 租户域名变更申请仓储接口，定义申请数据访问的抽象契约
 * 
 * 核心职责：
 * 1. 租户域名变更申请的CRUD操作
 * 2. 申请查询和搜索
 * 3. 申请业务规则验证
 * 4. 支持事件溯源
 * 
 * 设计原则：
 * - 仓储接口定义在领域层
 * - 具体实现在基础设施层
 * - 支持事件溯源和快照
 * - 提供业务查询方法
 */
export interface ITenantDomainChangeApplicationRepository {
  /**
   * @method save
   * @description 保存租户域名变更申请（创建或更新）
   * @param application 申请聚合根
   * @returns Promise<void>
   */
  save(application: TenantDomainChangeApplication): Promise<void>;

  /**
   * @method findById
   * @description 根据ID查找申请
   * @param id 申请ID
   * @returns Promise<TenantDomainChangeApplication | null>
   */
  findById(id: ApplicationId): Promise<TenantDomainChangeApplication | null>;

  /**
   * @method findByTenantId
   * @description 根据租户ID查找申请列表
   * @param tenantId 租户ID
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findByTenantId(tenantId: TenantId): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method findByApplicantId
   * @description 根据申请人ID查找申请列表
   * @param applicantId 申请人ID
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findByApplicantId(applicantId: UserId): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method findByStatus
   * @description 根据状态查找申请列表
   * @param status 申请状态
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findByStatus(status: ApplicationStatus): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method findByNewDomain
   * @description 根据新域名查找申请
   * @param newDomain 新域名
   * @returns Promise<TenantDomainChangeApplication | null>
   */
  findByNewDomain(newDomain: string): Promise<TenantDomainChangeApplication | null>;

  /**
   * @method findPendingApplications
   * @description 查找待审核的申请列表
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findPendingApplications(): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method findPendingApplicationsByTenantId
   * @description 根据租户ID查找待审核的申请列表
   * @param tenantId 租户ID
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findPendingApplicationsByTenantId(tenantId: TenantId): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method findAll
   * @description 查找所有申请
   * @param options 查询选项
   * @returns Promise<TenantDomainChangeApplication[]>
   */
  findAll(options?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<TenantDomainChangeApplication[]>;

  /**
   * @method count
   * @description 统计申请数量
   * @param filter 过滤条件
   * @returns Promise<number>
   */
  count(filter?: {
    tenantId?: TenantId;
    applicantId?: UserId;
    status?: ApplicationStatus;
    newDomain?: string;
  }): Promise<number>;

  /**
   * @method delete
   * @description 删除申请
   * @param id 申请ID
   * @returns Promise<void>
   */
  delete(id: ApplicationId): Promise<void>;

  /**
   * @method exists
   * @description 检查申请是否存在
   * @param id 申请ID
   * @returns Promise<boolean>
   */
  exists(id: ApplicationId): Promise<boolean>;

  /**
   * @method existsByNewDomain
   * @description 检查新域名是否已被申请
   * @param newDomain 新域名
   * @param excludeId 排除的申请ID（用于更新时检查）
   * @returns Promise<boolean>
   */
  existsByNewDomain(newDomain: string, excludeId?: ApplicationId): Promise<boolean>;
}
