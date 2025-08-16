import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @class ValidateTokenCommand
 * @description
 * 验证令牌命令。该命令用于处理JWT令牌验证请求，
 * 包括令牌有效性检查、权限验证和安全审计。
 * 
 * 主要职责：
 * 1. 封装令牌验证请求的参数
 * 2. 提供令牌验证所需的数据
 * 3. 支持令牌权限检查
 * 4. 记录令牌验证操作的元数据
 * 
 * 业务规则：
 * - 访问令牌必须提供
 * - 支持令牌有效性检查
 * - 支持令牌权限验证
 * - 记录令牌验证操作的安全审计信息
 */
export class ValidateTokenCommand extends BaseCommand {
  public readonly commandType = 'ValidateTokenCommand';
  /**
   * @constructor
   * @description
   * 构造函数，初始化验证令牌命令的参数
   * 
   * @param {string} accessToken - 访问令牌
   * @param {string} [requiredPermission] - 所需权限（可选）
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   */
  constructor(
    public readonly accessToken: string,
    public readonly requiredPermission?: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
