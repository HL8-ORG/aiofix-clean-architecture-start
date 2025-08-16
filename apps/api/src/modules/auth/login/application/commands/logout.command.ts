import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @class LogoutCommand
 * @description
 * 用户登出命令。该命令用于处理用户登出请求，
 * 包括会话清理、令牌失效和安全审计。
 * 
 * 主要职责：
 * 1. 封装登出请求的参数
 * 2. 提供会话清理所需的数据
 * 3. 支持全局登出和单会话登出
 * 4. 记录登出操作的元数据
 * 
 * 业务规则：
 * - 用户ID必须提供
 * - 支持指定会话ID进行单会话登出
 * - 支持全局登出（清除所有会话）
 * - 记录登出操作的安全审计信息
 */
export class LogoutCommand extends BaseCommand {
  public readonly commandType = 'LogoutCommand';
  /**
   * @constructor
   * @description
   * 构造函数，初始化登出命令的参数
   * 
   * @param {string} userId - 用户ID
   * @param {string} [sessionId] - 会话ID（可选，用于单会话登出）
   * @param {boolean} [globalLogout=false] - 是否全局登出
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   */
  constructor(
    public readonly userId: string,
    public readonly sessionId?: string,
    public readonly globalLogout: boolean = false,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
