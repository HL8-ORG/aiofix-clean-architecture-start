import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @class RefreshTokenCommand
 * @description
 * 刷新令牌命令。该命令用于处理JWT令牌刷新请求，
 * 包括令牌验证、新令牌生成和安全检查。
 * 
 * 主要职责：
 * 1. 封装令牌刷新请求的参数
 * 2. 提供令牌验证所需的数据
 * 3. 支持令牌刷新策略配置
 * 4. 记录令牌刷新操作的元数据
 * 
 * 业务规则：
 * - 刷新令牌必须提供且有效
 * - 支持令牌刷新策略（如刷新次数限制）
 * - 记录令牌刷新操作的安全审计信息
 * - 支持令牌黑名单检查
 */
export class RefreshTokenCommand extends BaseCommand {
  public readonly commandType = 'RefreshTokenCommand';
  /**
   * @constructor
   * @description
   * 构造函数，初始化刷新令牌命令的参数
   * 
   * @param {string} refreshToken - 刷新令牌
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   */
  constructor(
    public readonly refreshToken: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
