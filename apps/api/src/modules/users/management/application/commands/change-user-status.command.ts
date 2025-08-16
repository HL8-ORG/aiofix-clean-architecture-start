import { BaseCommand } from '@/shared/application/base/base-command';
import { UserStatus } from '../../domain/value-objects/user-status';

/**
 * @class ChangeUserStatusCommand
 * @description
 * 改变用户状态的命令。该命令用于更新用户的激活状态，
 * 支持将用户从激活状态改为停用状态，或从停用状态改为激活状态。
 * 
 * 主要原理与机制如下：
 * 1. 继承BaseCommand基类，获得命令的基础功能
 * 2. 封装用户ID和目标状态，确保数据完整性
 * 3. 通过命令总线发送给ChangeUserStatusHandler处理器
 * 4. 处理器执行业务逻辑并更新用户状态
 * 
 * 业务规则：
 * - 用户ID必须存在且有效
 * - 目标状态必须是有效的UserStatus枚举值
 * - 状态变更需要记录审计日志
 * 
 * @extends {BaseCommand}
 */
export class ChangeUserStatusCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'ChangeUserStatusCommand';

  /**
   * @constructor
   * @description
   * 构造函数，初始化改变用户状态命令
   * 
   * @param {string} userId - 要改变状态的用户ID
   * @param {UserStatus} status - 目标用户状态
   */
  constructor(
    public readonly userId: string,
    public readonly status: UserStatus,
  ) {
    super();
  }
}
