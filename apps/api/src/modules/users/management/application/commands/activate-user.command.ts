import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * 激活用户命令
 * 用于激活用户的业务用例
 */
export class ActivateUserCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'ActivateUserCommand';

  constructor(
    public readonly userId: string,
  ) {
    super();
  }
}
