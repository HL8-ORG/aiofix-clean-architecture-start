import { BaseCommand } from '@/shared/application/base/base-command';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * 创建用户命令
 * 用于创建用户的业务用例
 */
export class CreateUserCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'CreateUserCommand';

  constructor(
    public readonly createUserDto: CreateUserDto,
  ) {
    super();
  }
}
