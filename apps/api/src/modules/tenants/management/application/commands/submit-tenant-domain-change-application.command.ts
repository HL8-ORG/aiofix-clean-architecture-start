import { BaseCommand } from '@/shared/application/base/base-command';
import { TenantId } from '../../domain/value-objects/tenant-id';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';

/**
 * @class SubmitTenantDomainChangeApplicationCommand
 * @description 提交租户域名变更申请命令
 * 
 * 该命令用于处理租户域名变更申请的提交操作，包含：
 * - 租户ID
 * - 申请人ID
 * - 新域名
 * - 变更原因
 * - 当前域名（可选）
 * 
 * 业务规则：
 * - 申请人必须是租户管理员
 * - 新域名必须符合格式规范
 * - 新域名必须全局唯一
 * - 申请原因不能为空
 */
export class SubmitTenantDomainChangeApplicationCommand extends BaseCommand {
  public readonly commandType = 'SubmitTenantDomainChangeApplication';

  constructor(
    public readonly tenantId: string,
    public readonly applicantId: string,
    public readonly newDomain: string,
    public readonly reason: string,
    public readonly currentDomain?: string,
    options?: {
      userId?: string;
      tenantId?: string;
      correlationId?: string;
    }
  ) {
    super(options);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令数据的有效性
   * @returns boolean 验证结果
   */
  public validate(): boolean {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID cannot be empty');
    }

    if (!this.applicantId || this.applicantId.trim().length === 0) {
      throw new Error('Applicant ID cannot be empty');
    }

    if (!this.newDomain || this.newDomain.trim().length === 0) {
      throw new Error('New domain cannot be empty');
    }

    if (!this.reason || this.reason.trim().length === 0) {
      throw new Error('Reason cannot be empty');
    }

    // 验证新域名格式
    this.validateDomainFormat(this.newDomain);

    return true;
  }

  /**
   * @method validateDomainFormat
   * @description 验证域名格式
   * @param domain 域名
   * @throws Error 当域名格式无效时
   */
  private validateDomainFormat(domain: string): void {
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
}
