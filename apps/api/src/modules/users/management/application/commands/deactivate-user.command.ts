import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * 停用用户命令
 * 用于停用用户的业务用例
 */
export class DeactivateUserCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'DeactivateUserCommand';

  constructor(
    public readonly userId: string,
  ) {
    super();
  }
}
