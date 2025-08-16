import { Injectable } from '@nestjs/common';
import type { IUserApplicationService } from '../interfaces/user-application.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserDto } from '../dto/user.dto';
import { UserListDto } from '../dto/user-list.dto';
import { CommandBus } from '../bus/command-bus';
import { QueryBus } from '../bus/query-bus';
import { CreateUserCommand } from '../commands/create-user.command';
import { UpdateUserCommand } from '../commands/update-user.command';
import { DeleteUserCommand } from '../commands/delete-user.command';
import { ChangePasswordCommand } from '../commands/change-password.command';
import { ResetPasswordCommand } from '../commands/reset-password.command';
import { ActivateUserCommand } from '../commands/activate-user.command';
import { DeactivateUserCommand } from '../commands/deactivate-user.command';
import { GetUserQuery } from '../queries/get-user.query';
import { GetUsersQuery } from '../queries/get-users.query';
import { GetUserByEmailQuery } from '../queries/get-user-by-email.query';
import { GetUserByUsernameQuery } from '../queries/get-user-by-username.query';
import { SearchUsersQuery } from '../queries/search-users.query';
import { ChangeUserStatusCommand } from '../commands/change-user-status.command';
import { UserStatus } from '../../domain/value-objects/user-status';

/**
 * @class UserApplicationService
 * @description
 * 用户管理应用服务实现。该服务使用CQRS模式，通过命令总线和查询总线处理业务逻辑，
 * 提供完整的用户管理功能，包括用户CRUD操作、状态管理和密码管理。
 * 
 * 主要原理与机制如下：
 * 1. 通过依赖注入获取命令总线和查询总线，实现命令查询职责分离
 * 2. 将业务操作封装为命令对象，通过命令总线发送给对应的处理器
 * 3. 将查询操作封装为查询对象，通过查询总线发送给对应的处理器
 * 4. 提供统一的异常处理和业务规则验证
 * 5. 支持事务管理和事件发布
 * 
 * 架构特点：
 * - 采用CQRS模式，分离读写操作
 * - 支持命令和查询的异步处理
 * - 提供统一的异常处理和日志记录
 * - 支持业务规则的集中管理
 * 
 * @implements {IUserApplicationService}
 */
@Injectable()
export class UserApplicationService implements IUserApplicationService {
  /**
   * @constructor
   * @description
   * 构造函数，注入命令总线和查询总线依赖
   * 
   * @param {ICommandBus} commandBus - 命令总线，用于处理所有命令操作
   * @param {IQueryBus} queryBus - 查询总线，用于处理所有查询操作
   */
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * 创建用户
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(createUserDto);
    return await this.commandBus.execute(command);
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const command = new UpdateUserCommand(userId, updateUserDto);
    return await this.commandBus.execute(command);
  }

  /**
   * @function deleteUser
   * @description
   * 删除用户的核心方法。该方法负责处理用户删除的业务逻辑，
   * 包括用户存在性验证、业务规则检查和用户删除操作。
   * 
   * 执行流程：
   * 1. 将用户ID封装为DeleteUserCommand命令
   * 2. 通过命令总线发送命令给DeleteUserHandler处理器
   * 3. 处理器执行业务逻辑并完成用户删除操作
   * 
   * @param {string} userId - 要删除的用户ID
   * @returns {Promise<void>} 删除操作完成后的Promise
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {Error} 当用户状态不允许删除时抛出异常
   */
  async deleteUser(userId: string): Promise<void> {
    const command = new DeleteUserCommand(userId);
    return await this.commandBus.execute(command);
  }

  /**
   * 激活用户
   */
  async activateUser(userId: string): Promise<UserDto> {
    const command = new ActivateUserCommand(userId);
    return await this.commandBus.execute(command);
  }

  /**
   * 停用用户
   */
  async deactivateUser(userId: string): Promise<UserDto> {
    const command = new DeactivateUserCommand(userId);
    return await this.commandBus.execute(command);
  }

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<UserDto> {
    const query = new GetUserQuery(userId);
    return await this.queryBus.execute(query);
  }

  /**
   * 获取用户列表
   */
  async getUsers(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<UserListDto> {
    const query = new GetUsersQuery(tenantId, page, limit, search);
    return await this.queryBus.execute(query);
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<UserDto | null> {
    const query = new GetUserByEmailQuery(email);
    return await this.queryBus.execute(query);
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<UserDto | null> {
    const query = new GetUserByUsernameQuery(username);
    return await this.queryBus.execute(query);
  }

  /**
   * 检查邮箱是否已存在
   */
  async isEmailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return !!user;
  }

  /**
   * 检查用户名是否已存在
   */
  async isUsernameExists(username: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    return !!user;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const command = new ChangePasswordCommand(userId, changePasswordDto);
    return await this.commandBus.execute(command);
  }

  /**
   * @function resetPassword
   * @description
   * 重置用户密码的核心方法。该方法负责处理用户密码重置的业务逻辑，
   * 包括用户存在性验证、密码复杂度检查和密码重置操作。
   * 
   * 执行流程：
   * 1. 将用户ID和新密码封装为ResetPasswordCommand命令
   * 2. 通过命令总线发送命令给ResetPasswordHandler处理器
   * 3. 处理器执行业务逻辑并完成密码重置操作
   * 
   * @param {string} userId - 要重置密码的用户ID
   * @param {string} newPassword - 新的密码
   * @returns {Promise<void>} 密码重置操作完成后的Promise
   * @throws {NotFoundException} 当用户不存在时抛出异常
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const command = new ResetPasswordCommand(userId, newPassword);
    return await this.commandBus.execute(command);
  }

  /**
   * @function changeUserStatus
   * @description
   * 改变用户状态的核心方法。该方法负责处理用户状态变更的业务逻辑，
   * 包括用户存在性验证、状态转换规则检查和状态更新操作。
   * 
   * 执行流程：
   * 1. 将用户ID和目标状态封装为ChangeUserStatusCommand命令
   * 2. 通过命令总线发送命令给ChangeUserStatusHandler处理器
   * 3. 处理器执行业务逻辑并完成状态更新操作
   * 
   * @param {string} userId - 要改变状态的用户ID
   * @param {string} status - 目标用户状态
   * @returns {Promise<UserDto>} 更新后的用户信息
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {Error} 当状态转换违反业务规则时抛出异常
   */
  async changeUserStatus(userId: string, status: string): Promise<UserDto> {
    const userStatus = UserStatus.create(status);
    const command = new ChangeUserStatusCommand(userId, userStatus);
    return await this.commandBus.execute(command);
  }

  /**
   * @function searchUsers
   * @description
   * 搜索用户的核心方法。该方法负责处理用户搜索的业务逻辑，
   * 支持多字段模糊搜索、分页查询和排序功能。
   * 
   * 执行流程：
   * 1. 将搜索参数封装为SearchUsersQuery查询
   * 2. 通过查询总线发送查询给SearchUsersHandler处理器
   * 3. 处理器执行业务逻辑并返回匹配的用户列表
   * 
   * @param {string} tenantId - 租户ID，用于数据隔离
   * @param {any} searchDto - 搜索参数DTO
   * @returns {Promise<UserListDto>} 用户列表和分页信息
   * @throws {Error} 当搜索参数无效时抛出异常
   */
  async searchUsers(tenantId: string, searchDto: any): Promise<UserListDto> {
    const query = new SearchUsersQuery(
      tenantId,
      searchDto.searchTerm,
      searchDto.page,
      searchDto.limit,
      searchDto.sortBy,
      searchDto.sortOrder,
      searchDto.status
    );
    return await this.queryBus.execute(query);
  }
}
