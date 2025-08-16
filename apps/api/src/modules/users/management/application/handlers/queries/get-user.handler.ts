import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler } from '../query-handler.interface';
import { GetUserQuery } from '../../queries/get-user.query';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id';

/**
 * 获取用户查询处理器
 * 处理获取用户信息的业务逻辑
 */
@Injectable()
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userRepository.findById(UserId.create(query.userId));
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

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
