import { Injectable } from '@nestjs/common';
import { IQueryHandler } from '../query-handler.interface';
import { GetUserByUsernameQuery } from '../../queries/get-user-by-username.query';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Username } from '../../../domain/value-objects/username';

/**
 * 根据用户名获取用户查询处理器
 * 处理根据用户名查询用户的业务逻辑
 */
@Injectable()
export class GetUserByUsernameHandler implements IQueryHandler<GetUserByUsernameQuery, UserDto | null> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(query: GetUserByUsernameQuery): Promise<UserDto | null> {
    const username = Username.create(query.username);
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

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
