import { Injectable, ConflictException } from '@nestjs/common';
import { ICommandHandler } from '../command-handler.interface';
import { CreateUserCommand } from '../../commands/create-user.command';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { Password } from '../../../domain/value-objects/password';
import { TenantId } from '../../../../tenants/management/domain/value-objects/tenant-id';

/**
 * 创建用户命令处理器
 * 处理创建用户的业务逻辑
 */
@Injectable()
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserDto> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserDto> {
    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findByEmail(
      Email.create(command.createUserDto.email)
    );
    if (existingUserByEmail) {
      throw new ConflictException('邮箱已存在');
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findByUsername(
      Username.create(command.createUserDto.username)
    );
    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 创建用户
    const user = User.create(
      Email.create(command.createUserDto.email),
      Username.create(command.createUserDto.username),
      Password.create(command.createUserDto.password),
      command.createUserDto.name, // firstName
      '', // lastName (暂时为空)
      TenantId.create(command.createUserDto.tenantId),
      undefined, // primaryOrganizationId
      command.createUserDto.nickname,
      command.createUserDto.phone
    );

    // 保存用户
    await this.userRepository.save(user);

    // 返回用户DTO
    return this.toUserDto(user);
  }

  /**
   * 将用户实体转换为DTO
   */
  private toUserDto(user: User): UserDto {
    return new UserDto({
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      name: user.getFullName(),
      nickname: user.nickname,
      phone: user.phoneNumber,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status.value,
      tenantId: user.tenantId.value,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  }
}
