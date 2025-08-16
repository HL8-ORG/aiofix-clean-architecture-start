import { BaseCommand } from '@/shared/application/base/base-command';
import { ChangePasswordDto } from '../dto/change-password.dto';

/**
 * 修改密码命令
 * 用于修改用户密码的业务用例
 */
export class ChangePasswordCommand extends BaseCommand {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'ChangePasswordCommand';

  constructor(
    public readonly userId: string,
    public readonly changePasswordDto: ChangePasswordDto,
  ) {
    super();
  }
}
