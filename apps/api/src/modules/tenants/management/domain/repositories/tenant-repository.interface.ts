import { Tenant } from '../entities/tenant.entity';
import { TenantId } from '../value-objects/tenant-id';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { TenantStatus } from '../value-objects/tenant-status';
import { UserId } from '../../../users/management/domain/value-objects/user-id';

/**
 * @interface ITenantRepository
 * @description 租户仓储接口，定义租户数据访问的抽象契约
 * 
 * 核心职责：
 * 1. 租户的CRUD操作
 * 2. 租户查询和搜索
 * 3. 租户业务规则验证
 * 4. 支持事件溯源
 * 
 * 设计原则：
 * - 仓储接口定义在领域层
 * - 具体实现在基础设施层
 * - 支持事件溯源和快照
 * - 提供业务查询方法
 */
export interface ITenantRepository {
  /**
   * @method save
   * @description 保存租户（创建或更新）
   * @param tenant 租户聚合根
   * @returns Promise<void>
   */
  save(tenant: Tenant): Promise<void>;

  /**
   * @method findById
   * @description 根据ID查找租户
   * @param id 租户ID
   * @returns Promise<Tenant | null>
   */
  findById(id: TenantId): Promise<Tenant | null>;

  /**
   * @method findByCode
   * @description 根据代码查找租户
   * @param code 租户代码
   * @returns Promise<Tenant | null>
   */
  findByCode(code: TenantCode): Promise<Tenant | null>;

  /**
   * @method findByName
   * @description 根据名称查找租户
   * @param name 租户名称
   * @returns Promise<Tenant | null>
   */
  findByName(name: TenantName): Promise<Tenant | null>;

  /**
   * @method findByDomain
   * @description 根据域名查找租户
   * @param domain 租户域名
   * @returns Promise<Tenant | null>
   */
  findByDomain(domain: string): Promise<Tenant | null>;

  /**
   * @method findByAdminId
   * @description 根据管理员ID查找租户
   * @param adminId 管理员ID
   * @returns Promise<Tenant | null>
   */
  findByAdminId(adminId: UserId): Promise<Tenant | null>;

  /**
   * @method findByStatus
   * @description 根据状态查找租户列表
   * @param status 租户状态
   * @returns Promise<Tenant[]>
   */
  findByStatus(status: TenantStatus): Promise<Tenant[]>;

  /**
   * @method findAll
   * @description 查找所有租户
   * @param options 查询选项
   * @returns Promise<Tenant[]>
   */
  findAll(options?: {
    skip?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Tenant[]>;

  /**
   * @method count
   * @description 统计租户数量
   * @param filter 过滤条件
   * @returns Promise<number>
   */
  count(filter?: {
    status?: TenantStatus;
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<number>;

  /**
   * @method exists
   * @description 检查租户是否存在
   * @param id 租户ID
   * @returns Promise<boolean>
   */
  exists(id: TenantId): Promise<boolean>;

  /**
   * @method existsByCode
   * @description 检查租户代码是否存在
   * @param code 租户代码
   * @param excludeId 排除的租户ID（用于更新时检查）
   * @returns Promise<boolean>
   */
  existsByCode(code: TenantCode, excludeId?: TenantId): Promise<boolean>;

  /**
   * @method existsByName
   * @description 检查租户名称是否存在
   * @param name 租户名称
   * @param excludeId 排除的租户ID（用于更新时检查）
   * @returns Promise<boolean>
   */
  existsByName(name: TenantName, excludeId?: TenantId): Promise<boolean>;

  /**
   * @method existsByDomain
   * @description 检查租户域名是否存在
   * @param domain 租户域名
   * @param excludeId 排除的租户ID（用于更新时检查）
   * @returns Promise<boolean>
   */
  existsByDomain(domain: string, excludeId?: TenantId): Promise<boolean>;

  /**
   * @method delete
   * @description 删除租户
   * @param id 租户ID
   * @returns Promise<void>
   */
  delete(id: TenantId): Promise<void>;

  /**
   * @method getSystemTenant
   * @description 获取系统租户
   * @returns Promise<Tenant | null>
   */
  getSystemTenant(): Promise<Tenant | null>;

  /**
   * @method createSystemTenant
   * @description 创建系统租户（如果不存在）
   * @returns Promise<Tenant>
   */
  createSystemTenant(): Promise<Tenant>;

  /**
   * @method search
   * @description 搜索租户
   * @param query 搜索查询
   * @param options 搜索选项
   * @returns Promise<Tenant[]>
   */
  search(
    query: string,
    options?: {
      skip?: number;
      limit?: number;
      status?: TenantStatus;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Tenant[]>;

  /**
   * @method getTenantsByAdminId
   * @description 获取用户作为管理员的所有租户
   * @param adminId 管理员ID
   * @returns Promise<Tenant[]>
   */
  getTenantsByAdminId(adminId: UserId): Promise<Tenant[]>;

  /**
   * @method getActiveTenants
   * @description 获取所有激活的租户
   * @returns Promise<Tenant[]>
   */
  getActiveTenants(): Promise<Tenant[]>;

  /**
   * @method getTenantsCreatedInPeriod
   * @description 获取指定时间段内创建的租户
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns Promise<Tenant[]>
   */
  getTenantsCreatedInPeriod(startDate: Date, endDate: Date): Promise<Tenant[]>;

  /**
   * @method getTenantStats
   * @description 获取租户统计信息
   * @returns Promise<TenantStats>
   */
  getTenantStats(): Promise<TenantStats>;

  /**
   * @method healthCheck
   * @description 健康检查
   * @returns Promise<boolean>
   */
  healthCheck(): Promise<boolean>;
}

/**
 * @interface TenantStats
 * @description 租户统计信息
 */
export interface TenantStats {
  /**
   * 总租户数量
   */
  totalTenants: number;

  /**
   * 激活租户数量
   */
  activeTenants: number;

  /**
   * 停用租户数量
   */
  inactiveTenants: number;

  /**
   * 暂停租户数量
   */
  suspendedTenants: number;

  /**
   * 删除租户数量
   */
  deletedTenants: number;

  /**
   * 本月新增租户数量
   */
  newTenantsThisMonth: number;

  /**
   * 本月活跃租户数量
   */
  activeTenantsThisMonth: number;

  /**
   * 平均每个租户的用户数量
   */
  averageUsersPerTenant: number;

  /**
   * 租户创建趋势（按月份）
   */
  creationTrend: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * @interface TenantSearchResult
 * @description 租户搜索结果
 */
export interface TenantSearchResult {
  /**
   * 租户列表
   */
  tenants: Tenant[];

  /**
   * 总数
   */
  total: number;

  /**
   * 当前页
   */
  page: number;

  /**
   * 每页大小
   */
  pageSize: number;

  /**
   * 总页数
   */
  totalPages: number;

  /**
   * 是否有下一页
   */
  hasNext: boolean;

  /**
   * 是否有上一页
   */
  hasPrevious: boolean;
}
