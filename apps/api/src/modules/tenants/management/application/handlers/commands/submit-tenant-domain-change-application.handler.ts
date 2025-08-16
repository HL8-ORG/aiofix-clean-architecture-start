import { Injectable } from '@nestjs/common';
import { ICommandHandler } from '@/shared/application/handlers/command-handler.interface';
import { SubmitTenantDomainChangeApplicationCommand } from '../../commands/submit-tenant-domain-change-application.command';
import { ITenantDomainChangeApplicationRepository } from '../../../domain/repositories/tenant-domain-change-application-repository.interface';
import { ITenantRepository } from '../../../domain/repositories/tenant-repository.interface';
import { TenantDomainChangeApplication } from '../../../domain/entities/tenant-domain-change-application.entity';
import { TenantId } from '../../../domain/value-objects/tenant-id';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @class SubmitTenantDomainChangeApplicationHandler
 * @description 提交租户域名变更申请命令处理器
 * 
 * 该处理器负责处理租户域名变更申请的提交操作，包括：
 * 1. 验证申请人的权限（必须是租户管理员）
 * 2. 验证新域名的唯一性
 * 3. 创建申请记录
 * 4. 发布相关事件
 * 
 * 业务规则：
 * - 申请人必须是租户管理员
 * - 新域名必须全局唯一
 * - 申请信息必须完整有效
 * - 支持事件溯源
 */
@Injectable()
export class SubmitTenantDomainChangeApplicationHandler implements ICommandHandler<SubmitTenantDomainChangeApplicationCommand, void> {
  constructor(
    private readonly applicationRepository: ITenantDomainChangeApplicationRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly logger: PinoLoggerService
  ) { }

  /**
   * @method execute
   * @description 执行提交租户域名变更申请命令
   * @param command 提交申请命令
   * @returns Promise<void>
   */
  async execute(command: SubmitTenantDomainChangeApplicationCommand): Promise<void> {
    this.logger.info('开始处理租户域名变更申请提交', LogContext.BUSINESS, {
      tenantId: command.tenantId,
      applicantId: command.applicantId,
      newDomain: command.newDomain
    });

    try {
      // 1. 验证租户是否存在
      const tenantId = new TenantId(command.tenantId);
      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${command.tenantId} not found`);
      }

      // 2. 验证申请人是否为租户管理员
      const applicantId = new UserId(command.applicantId);
      if (tenant.adminId.value !== command.applicantId) {
        throw new Error('Only tenant admin can submit domain change application');
      }

      // 3. 验证新域名是否已被申请
      const existingApplication = await this.applicationRepository.findByNewDomain(command.newDomain);
      if (existingApplication) {
        throw new Error(`Domain ${command.newDomain} has already been applied for`);
      }

      // 4. 验证新域名是否已被其他租户使用
      const existingTenant = await this.tenantRepository.findByDomain(command.newDomain);
      if (existingTenant) {
        throw new Error(`Domain ${command.newDomain} is already in use by another tenant`);
      }

      // 5. 创建申请
      const application = TenantDomainChangeApplication.submit(
        tenantId,
        applicantId,
        command.newDomain,
        command.reason,
        command.currentDomain
      );

      // 6. 保存申请
      await this.applicationRepository.save(application);

      this.logger.info('租户域名变更申请提交成功', LogContext.BUSINESS, {
        applicationId: application.id.value,
        tenantId: command.tenantId,
        newDomain: command.newDomain
      });

    } catch (error) {
      this.logger.error('租户域名变更申请提交失败', LogContext.BUSINESS, {
        tenantId: command.tenantId,
        applicantId: command.applicantId,
        newDomain: command.newDomain,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * @method getCommandType
   * @description 获取处理器支持的命令类型
   * @returns string
   */
  getCommandType(): string {
    return 'SubmitTenantDomainChangeApplication';
  }
}
