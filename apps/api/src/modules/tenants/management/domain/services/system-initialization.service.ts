import { Injectable } from '@nestjs/common';
import { Tenant } from '../entities/tenant.entity';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { TenantStatus } from '../value-objects/tenant-status';
import type { ITenantRepository } from '../repositories/tenant-repository.interface';
import { TenantDomainService } from './tenant-domain.service';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';

/**
 * @class SystemInitializationService
 * @description 系统初始化服务，负责系统启动时的初始化工作
 * 
 * 核心职责：
 * 1. 创建默认系统租户
 * 2. 创建系统管理员用户
 * 3. 初始化系统配置
 * 4. 确保系统基础功能可用
 */
@Injectable()
export class SystemInitializationService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly tenantDomainService: TenantDomainService
  ) { }

  /**
   * @method initializeSystem
   * @description 初始化系统，创建默认系统租户和管理员
   * @param systemAdminId 系统管理员用户ID
   * @returns Promise<void>
   */
  async initializeSystem(systemAdminId: UserId): Promise<void> {
    // 检查是否已经初始化
    if (await this.isSystemInitialized()) {
      return;
    }

    // 创建默认系统租户
    await this.createDefaultSystemTenant(systemAdminId);
  }

  /**
   * @method isSystemInitialized
   * @description 检查系统是否已经初始化
   * @returns Promise<boolean>
   */
  async isSystemInitialized(): Promise<boolean> {
    try {
      const systemTenant = await this.tenantRepository.findByCode(
        new TenantCode('SYSTEM')
      );
      return systemTenant !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * @method createDefaultSystemTenant
   * @description 创建默认系统租户
   * @param systemAdminId 系统管理员用户ID
   * @returns Promise<Tenant>
   */
  private async createDefaultSystemTenant(systemAdminId: UserId): Promise<Tenant> {
    const systemTenantCode = new TenantCode('SYSTEM');
    const systemTenantName = new TenantName('默认系统租户');

    // 验证租户创建的业务规则
    await this.tenantDomainService.validateTenantCreation(
      systemTenantCode,
      systemTenantName,
      systemAdminId
    );

    // 创建系统租户
    const systemTenant = Tenant.create(
      systemTenantCode,
      systemTenantName,
      systemAdminId,
      '系统默认租户，用于管理新用户和系统级功能',
      undefined // 不设置域名
    );

    // 保存到数据库
    await this.tenantRepository.save(systemTenant);

    return systemTenant;
  }

  /**
   * @method getSystemTenant
   * @description 获取系统租户
   * @returns Promise<Tenant | null>
   */
  async getSystemTenant(): Promise<Tenant | null> {
    return await this.tenantRepository.findByCode(
      new TenantCode('SYSTEM')
    );
  }

  /**
   * @method resetSystem
   * @description 重置系统（仅用于开发环境）
   * @returns Promise<void>
   */
  async resetSystem(): Promise<void> {
    // 注意：此方法仅用于开发环境，生产环境不应使用
    const systemTenant = await this.getSystemTenant();
    if (systemTenant) {
      // 删除系统租户（需要谨慎处理）
      // await this.tenantRepository.delete(systemTenant);
    }
  }
}
