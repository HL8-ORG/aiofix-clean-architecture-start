import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * 更新用户命令
 * 用于更新用户的业务用例
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly updateUserDto: UpdateUserDto,
  ) {}
}
