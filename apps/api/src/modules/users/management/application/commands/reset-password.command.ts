import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * 重置密码命令
 * 用于重置用户密码的业务用例
 */
export class ResetPasswordCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'ResetPasswordCommand';

  constructor(
    public readonly userId: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
