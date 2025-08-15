import { Injectable } from '@nestjs/common';
import { Tenant } from '../entities/tenant.entity';
import { ITenantRepository } from '../repositories/tenant-repository.interface';
import { TenantId } from '../value-objects/tenant-id';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { TenantStatus } from '../value-objects/tenant-status';
import { UserId } from '../../../users/management/domain/value-objects/user-id';

/**
 * @class TenantDomainService
 * @description 租户领域服务，处理跨聚合的业务逻辑
 * 
 * 核心职责：
 * 1. 租户业务规则验证
 * 2. 租户生命周期管理
 * 3. 租户状态转换逻辑
 * 4. 租户间关系管理
 * 
 * 设计原则：
 * - 处理跨聚合的业务逻辑
 * - 不包含数据持久化逻辑
 * - 专注于业务规则和验证
 * - 支持事务和一致性
 */
@Injectable()
export class TenantDomainService {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) { }

  /**
   * @method validateTenantCreation
   * @description 验证租户创建的业务规则
   * @param code 租户代码
   * @param name 租户名称
   * @param adminId 管理员ID
   * @param domain 租户域名（可选）
   * @returns Promise<void>
   */
  async validateTenantCreation(
    code: TenantCode,
    name: TenantName,
    adminId: UserId,
    domain?: string
  ): Promise<void> {
    // 验证租户代码唯一性
    if (await this.tenantRepository.existsByCode(code)) {
      throw new Error(`Tenant code '${code.value}' already exists`);
    }

    // 验证租户名称唯一性
    if (await this.tenantRepository.existsByName(name)) {
      throw new Error(`Tenant name '${name.value}' already exists`);
    }

    // 验证域名唯一性（如果提供）
    if (domain && await this.tenantRepository.existsByDomain(domain)) {
      throw new Error(`Domain '${domain}' is already in use`);
    }

    // 验证管理员是否已经是其他租户的管理员
    const existingTenant = await this.tenantRepository.findByAdminId(adminId);
    if (existingTenant) {
      throw new Error(`User '${adminId.value}' is already an admin of another tenant`);
    }
  }

  /**
   * @method validateTenantUpdate
   * @description 验证租户更新的业务规则
   * @param tenantId 租户ID
   * @param code 新租户代码（可选）
   * @param name 新租户名称（可选）
   * @param domain 新租户域名（可选）
   * @returns Promise<void>
   */
  async validateTenantUpdate(
    tenantId: TenantId,
    code?: TenantCode,
    name?: TenantName,
    domain?: string
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with id '${tenantId.value}' not found`);
    }

    // 验证租户代码唯一性（排除当前租户）
    if (code && await this.tenantRepository.existsByCode(code, tenantId)) {
      throw new Error(`Tenant code '${code.value}' already exists`);
    }

    // 验证租户名称唯一性（排除当前租户）
    if (name && await this.tenantRepository.existsByName(name, tenantId)) {
      throw new Error(`Tenant name '${name.value}' already exists`);
    }

    // 验证域名唯一性（排除当前租户）
    if (domain && await this.tenantRepository.existsByDomain(domain, tenantId)) {
      throw new Error(`Domain '${domain}' is already in use`);
    }
  }

  /**
   * @method validateTenantStatusChange
   * @description 验证租户状态变更的业务规则
   * @param tenantId 租户ID
   * @param newStatus 新状态
   * @param changedBy 变更操作人ID
   * @returns Promise<void>
   */
  async validateTenantStatusChange(
    tenantId: TenantId,
    newStatus: TenantStatus,
    changedBy: string
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with id '${tenantId.value}' not found`);
    }

    // 系统租户不能被停用或删除
    if (tenant.isSystemTenant()) {
      if (newStatus.equals(TenantStatus.INACTIVE)) {
        throw new Error('System tenant cannot be deactivated');
      }
      if (newStatus.equals(TenantStatus.DELETED)) {
        throw new Error('System tenant cannot be deleted');
      }
    }

    // 验证状态转换的有效性
    this.validateStatusTransition(tenant.status, newStatus);
  }

  /**
   * @method validateTenantAdminChange
   * @description 验证租户管理员变更的业务规则
   * @param tenantId 租户ID
   * @param newAdminId 新管理员ID
   * @param changedBy 变更操作人ID
   * @returns Promise<void>
   */
  async validateTenantAdminChange(
    tenantId: TenantId,
    newAdminId: UserId,
    changedBy: string
  ): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with id '${tenantId.value}' not found`);
    }

    // 验证新管理员是否已经是其他租户的管理员
    const existingTenant = await this.tenantRepository.findByAdminId(newAdminId);
    if (existingTenant && !existingTenant.id.equals(tenantId)) {
      throw new Error(`User '${newAdminId.value}' is already an admin of another tenant`);
    }

    // 验证新管理员不能是当前管理员
    if (tenant.adminId.equals(newAdminId)) {
      throw new Error('New admin cannot be the same as current admin');
    }
  }

  /**
   * @method canDeleteTenant
   * @description 检查租户是否可以被删除
   * @param tenantId 租户ID
   * @returns Promise<boolean>
   */
  async canDeleteTenant(tenantId: TenantId): Promise<boolean> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      return false;
    }

    return tenant.canBeDeleted();
  }

  /**
   * @method getTenantHierarchy
   * @description 获取租户层级关系（用于多租户架构）
   * @param tenantId 租户ID
   * @returns Promise<TenantHierarchy>
   */
  async getTenantHierarchy(tenantId: TenantId): Promise<TenantHierarchy> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with id '${tenantId.value}' not found`);
    }

    // 这里可以实现租户层级逻辑
    // 目前返回简单的层级结构
    return {
      tenant,
      parent: null,
      children: [],
      level: 0
    };
  }

  /**
   * @method getTenantStats
   * @description 获取租户统计信息
   * @returns Promise<TenantStats>
   */
  async getTenantStats(): Promise<TenantStats> {
    return await this.tenantRepository.getTenantStats();
  }

  /**
   * @method getTenantsByAdmin
   * @description 获取用户作为管理员的所有租户
   * @param adminId 管理员ID
   * @returns Promise<Tenant[]>
   */
  async getTenantsByAdmin(adminId: UserId): Promise<Tenant[]> {
    return await this.tenantRepository.getTenantsByAdminId(adminId);
  }

  /**
   * @method searchTenants
   * @description 搜索租户
   * @param query 搜索查询
   * @param options 搜索选项
   * @returns Promise<Tenant[]>
   */
  async searchTenants(
    query: string,
    options?: {
      skip?: number;
      limit?: number;
      status?: TenantStatus;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Tenant[]> {
    return await this.tenantRepository.search(query, options);
  }

  /**
   * @method getActiveTenants
   * @description 获取所有激活的租户
   * @returns Promise<Tenant[]>
   */
  async getActiveTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.getActiveTenants();
  }

  /**
   * @method getTenantsCreatedInPeriod
   * @description 获取指定时间段内创建的租户
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns Promise<Tenant[]>
   */
  async getTenantsCreatedInPeriod(startDate: Date, endDate: Date): Promise<Tenant[]> {
    return await this.tenantRepository.getTenantsCreatedInPeriod(startDate, endDate);
  }

  /**
   * @method validateStatusTransition
   * @description 验证状态转换的有效性
   * @param currentStatus 当前状态
   * @param newStatus 新状态
   * @private
   */
  private validateStatusTransition(currentStatus: TenantStatus, newStatus: TenantStatus): void {
    const validTransitions: Record<string, string[]> = {
      'ACTIVE': ['INACTIVE', 'SUSPENDED', 'DELETED'],
      'INACTIVE': ['ACTIVE', 'DELETED'],
      'SUSPENDED': ['ACTIVE', 'INACTIVE', 'DELETED'],
      'DELETED': [] // 删除状态是终态，不能转换
    };

    const allowedTransitions = validTransitions[currentStatus.value];
    if (!allowedTransitions.includes(newStatus.value)) {
      throw new Error(
        `Invalid status transition from '${currentStatus.value}' to '${newStatus.value}'`
      );
    }
  }

  /**
   * @method validateDomainFormat
   * @description 验证域名格式
   * @param domain 域名
   * @returns boolean
   */
  validateDomainFormat(domain: string): boolean {
    // 域名长度：3-63个字符
    if (domain.length < 3 || domain.length > 63) {
      return false;
    }

    // 只能包含字母、数字、连字符
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!domainRegex.test(domain)) {
      return false;
    }

    // 不能以连字符开头或结尾
    if (domain.startsWith('-') || domain.endsWith('-')) {
      return false;
    }

    // 不能包含连续连字符
    if (domain.includes('--')) {
      return false;
    }

    return true;
  }

  /**
   * @method generateTenantCode
   * @description 生成唯一的租户代码
   * @param name 租户名称
   * @returns Promise<TenantCode>
   */
  async generateTenantCode(name: string): Promise<TenantCode> {
    // 基于名称生成代码
    let baseCode = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    if (baseCode.length === 0) {
      baseCode = 'tenant';
    }

    let code = baseCode;
    let counter = 1;

    // 确保代码唯一性
    while (await this.tenantRepository.existsByCode(new TenantCode(code))) {
      code = `${baseCode}${counter}`;
      counter++;
    }

    return new TenantCode(code);
  }
}

/**
 * @interface TenantHierarchy
 * @description 租户层级关系
 */
export interface TenantHierarchy {
  /**
   * 当前租户
   */
  tenant: Tenant;

  /**
   * 父租户
   */
  parent: Tenant | null;

  /**
   * 子租户列表
   */
  children: Tenant[];

  /**
   * 层级深度
   */
  level: number;
}
