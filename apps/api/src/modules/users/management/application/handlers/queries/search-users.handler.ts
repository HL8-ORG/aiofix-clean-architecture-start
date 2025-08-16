import { Injectable } from '@nestjs/common';
import { IQueryHandler } from '../query-handler.interface';
import { SearchUsersQuery } from '../../queries/search-users.query';
import { UserListDto } from '../../dto/user-list.dto';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TenantId } from '../../../../tenants/management/domain/value-objects/tenant-id';

/**
 * @class SearchUsersHandler
 * @description
 * 搜索用户的查询处理器。该处理器负责处理SearchUsersQuery查询，
 * 执行用户搜索的业务逻辑，支持多字段模糊搜索和分页查询。
 * 
 * 主要原理与机制如下：
 * 1. 实现IQueryHandler接口，确保类型安全
 * 2. 通过依赖注入获取用户仓储
 * 3. 执行搜索逻辑并返回匹配的用户列表
 * 
 * 搜索功能：
 * - 支持多字段模糊搜索（用户名、邮箱、姓名）
 * - 支持租户隔离，确保数据安全
 * - 支持分页查询，提高性能
 * - 支持排序和过滤
 * 
 * @implements {IQueryHandler<SearchUsersQuery, UserListDto>}
 */
@Injectable()
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery, UserListDto> {

  /**
   * @constructor
   * @description
   * 构造函数，注入用户仓储依赖
   * 
   * @param {IUserRepository} userRepository - 用户仓储，用于数据访问
   */
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  /**
   * @function execute
   * @description
   * 执行搜索用户的业务逻辑。该方法负责处理用户搜索，
   * 包括搜索条件验证、数据查询和结果格式化。
   * 
   * 执行流程：
   * 1. 验证搜索参数的有效性
   * 2. 构建搜索条件
   * 3. 执行数据库查询
   * 4. 格式化查询结果
   * 5. 返回用户列表DTO
   * 
   * @param {SearchUsersQuery} query - 搜索用户查询
   * @returns {Promise<UserListDto>} 用户列表DTO
   */
  async execute(query: SearchUsersQuery): Promise<UserListDto> {
    // 1. 验证搜索参数
    if (!query.searchTerm || query.searchTerm.trim().length === 0) {
      throw new Error('搜索关键词不能为空');
    }

    // 2. 构建搜索条件
    const tenantId = new TenantId(query.tenantId);
    const searchTerm = query.searchTerm.trim();
    const offset = (query.page - 1) * query.limit;

    // 3. 执行搜索查询
    const [users, total] = await this.userRepository.searchUsers(
      searchTerm,
      tenantId,
      query.limit,
      offset
    );

    // 4. 转换为DTO
    const userDtos = users.map(user => new UserListDto({
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
    }));

    // 5. 返回用户列表DTO
    return new UserListDto({
      users: userDtos,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }
}
