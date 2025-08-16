import { Injectable } from '@nestjs/common';
import { IQueryHandler } from '../query-handler.interface';
import { GetUserByEmailQuery } from '../../queries/get-user-by-email.query';
import { UserDto } from '../../dto/user.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email';

/**
 * 根据邮箱获取用户查询处理器
 * 处理根据邮箱查询用户的业务逻辑
 */
@Injectable()
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, UserDto | null> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(query: GetUserByEmailQuery): Promise<UserDto | null> {
    const email = Email.create(query.email);
    const user = await this.userRepository.findByEmail(email);

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
