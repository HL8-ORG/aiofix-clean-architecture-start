import { CreateUserDto } from '../dto/create-user.dto';

/**
 * 创建用户命令
 * 用于创建用户的业务用例
 */
export class CreateUserCommand {
  constructor(
    public readonly createUserDto: CreateUserDto,
  ) {}
}
