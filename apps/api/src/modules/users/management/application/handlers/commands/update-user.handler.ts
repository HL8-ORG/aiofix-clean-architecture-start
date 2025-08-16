import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ICommandHandler } from '../command-handler.interface';
import { UpdateUserCommand } from '../../commands/update-user.command';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { Username } from '../../../domain/value-objects/username';

/**
 * 更新用户命令处理器
 * 处理更新用户的业务逻辑
 */
@Injectable()
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, UserDto> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(command: UpdateUserCommand): Promise<UserDto> {
    const user = await this.userRepository.findById(UserId.create(command.userId));
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查用户名是否已被其他用户使用
    if (command.updateUserDto.username && command.updateUserDto.username !== user.username.value) {
      const existingUser = await this.userRepository.findByUsername(
        Username.create(command.updateUserDto.username)
      );
      if (existingUser && existingUser.id.value !== command.userId) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 更新用户信息
    if (command.updateUserDto.username) {
      user.changeUsername(Username.create(command.updateUserDto.username));
    }
    if (command.updateUserDto.name) {
      user.changeName(command.updateUserDto.name);
    }
    if (command.updateUserDto.nickname !== undefined) {
      user.changeNickname(command.updateUserDto.nickname);
    }
    if (command.updateUserDto.phone !== undefined) {
      user.changePhone(command.updateUserDto.phone);
    }
    if (command.updateUserDto.avatar !== undefined) {
      user.changeAvatar(command.updateUserDto.avatar);
    }
    if (command.updateUserDto.bio !== undefined) {
      user.changeBio(command.updateUserDto.bio);
    }

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
