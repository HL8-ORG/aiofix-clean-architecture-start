import { Injectable, NotFoundException } from '@nestjs/common';
import { ICommandHandler } from '../command-handler.interface';
import { ActivateUserCommand } from '../../commands/activate-user.command';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';

/**
 * 激活用户命令处理器
 * 处理激活用户的业务逻辑
 */
@Injectable()
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand, UserDto> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(command: ActivateUserCommand): Promise<UserDto> {
    const userId = UserId.create(command.userId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 激活用户
    user.activate();

    // 保存用户
    await this.userRepository.save(user);

    // 返回用户DTO
    return this.toUserDto(user);
  }

  /**
   * 将用户实体转换为DTO
   */
  private toUserDto(user: any): UserDto {
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
