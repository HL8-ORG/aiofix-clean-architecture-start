import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * 删除用户命令
 * 用于删除指定用户
 */
export class DeleteUserCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'DeleteUserCommand';

  constructor(
    public readonly userId: string,
  ) {
    super();
  }
}
