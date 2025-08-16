import { ChangePasswordDto } from '../dto/change-password.dto';

/**
 * 修改密码命令
 * 用于修改用户密码的业务用例
 */
export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly changePasswordDto: ChangePasswordDto,
  ) { }
}
