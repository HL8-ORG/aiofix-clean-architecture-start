import { BaseCommand } from '@/shared/application/base/base-command';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * 更新用户命令
 * 用于更新用户的业务用例
 */
export class UpdateUserCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'UpdateUserCommand';

  constructor(
    public readonly userId: string,
    public readonly updateUserDto: UpdateUserDto,
  ) {
    super();
  }
}
