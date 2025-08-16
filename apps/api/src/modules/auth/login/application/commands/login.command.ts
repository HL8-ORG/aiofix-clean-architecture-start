import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @class LoginCommand
 * @description
 * 用户登录命令。该命令用于处理用户登录请求，
 * 包括用户名/邮箱验证、密码验证和会话创建。
 * 
 * 主要职责：
 * 1. 封装登录请求的参数
 * 2. 提供登录验证所需的数据
 * 3. 支持多种登录方式（用户名、邮箱）
 * 4. 记录登录请求的元数据
 * 
 * 业务规则：
 * - 用户名或邮箱必须提供
 * - 密码必须提供且不能为空
 * - 支持记住登录状态选项
 * - 支持多因子认证集成
 */
export class LoginCommand extends BaseCommand {
  public readonly commandType = 'LoginCommand';
  /**
   * @constructor
   * @description
   * 构造函数，初始化登录命令的参数
   * 
   * @param {string} usernameOrEmail - 用户名或邮箱地址
   * @param {string} password - 用户密码
   * @param {boolean} [rememberMe=false] - 是否记住登录状态
   * @param {string} [tenantId] - 租户ID（多租户环境）
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   */
  constructor(
    public readonly usernameOrEmail: string,
    public readonly password: string,
    public readonly rememberMe: boolean = false,
    public readonly tenantId?: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
