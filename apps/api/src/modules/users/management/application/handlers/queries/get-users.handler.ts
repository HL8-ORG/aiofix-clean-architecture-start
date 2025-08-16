import { Injectable } from '@nestjs/common';
import { IQueryHandler } from '../query-handler.interface';
import { GetUsersQuery } from '../../queries/get-users.query';
import { UserListDto } from '../../dto/user-list.dto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { TenantId } from '../../../../tenants/management/domain/value-objects/tenant-id';

/**
 * 获取用户列表查询处理器
 * 处理获取用户列表的业务逻辑
 */
@Injectable()
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, UserListDto> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(query: GetUsersQuery): Promise<UserListDto> {
    const offset = (query.page - 1) * query.limit;

    const [users, total] = await this.userRepository.findByTenantId(
      TenantId.create(query.tenantId),
      offset,
      query.limit,
      query.search,
    );

    const totalPages = Math.ceil(total / query.limit);

    return new UserListDto({
      users: users.map(user => this.toUserDto(user)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      search: query.search,
    });
  }

  /**
   * 将用户实体转换为DTO
   */
  private toUserDto(user: User) {
    return {
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
    };
  }
}
