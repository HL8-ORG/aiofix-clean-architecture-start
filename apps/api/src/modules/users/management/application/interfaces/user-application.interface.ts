import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserDto } from '../dto/user.dto';
import { UserListDto } from '../dto/user-list.dto';

/**
 * 用户管理应用层接口
 * 定义用户管理的主要业务操作
 */
export interface IUserApplicationService {
  /**
   * 创建用户
   * @param createUserDto 创建用户DTO
   * @returns 创建的用户信息
   */
  createUser(createUserDto: CreateUserDto): Promise<UserDto>;

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param updateUserDto 更新用户DTO
   * @returns 更新后的用户信息
   */
  updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserDto>;

  /**
   * 删除用户
   * @param userId 用户ID
   * @returns 删除结果
   */
  deleteUser(userId: string): Promise<void>;

  /**
   * 激活用户
   * @param userId 用户ID
   * @returns 激活结果
   */
  activateUser(userId: string): Promise<UserDto>;

  /**
   * 停用用户
   * @param userId 用户ID
   * @returns 停用结果
   */
  deactivateUser(userId: string): Promise<UserDto>;

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns 用户信息
   */
  getUser(userId: string): Promise<UserDto>;

  /**
   * 获取用户列表
   * @param tenantId 租户ID
   * @param page 页码
   * @param limit 每页数量
   * @param search 搜索关键词
   * @returns 用户列表
   */
  getUsers(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<UserListDto>;

  /**
   * 根据邮箱获取用户
   * @param email 邮箱地址
   * @returns 用户信息
   */
  getUserByEmail(email: string): Promise<UserDto | null>;

  /**
   * 根据用户名获取用户
   * @param username 用户名
   * @returns 用户信息
   */
  getUserByUsername(username: string): Promise<UserDto | null>;

  /**
   * 检查邮箱是否已存在
   * @param email 邮箱地址
   * @returns 是否存在
   */
  isEmailExists(email: string): Promise<boolean>;

  /**
   * 检查用户名是否已存在
   * @param username 用户名
   * @returns 是否存在
   */
  isUsernameExists(username: string): Promise<boolean>;

  /**
   * 修改用户密码
   * @param userId 用户ID
   * @param changePasswordDto 修改密码DTO
   * @returns 修改结果
   */
  changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;

  /**
   * 重置用户密码
   * @param userId 用户ID
   * @param newPassword 新密码
   * @returns 重置结果
   */
  resetPassword(userId: string, newPassword: string): Promise<void>;

  /**
   * 改变用户状态
   * @param userId 用户ID
   * @param status 目标状态
   * @returns 更新后的用户信息
   */
  changeUserStatus(userId: string, status: string): Promise<UserDto>;

  /**
   * 搜索用户
   * @param tenantId 租户ID
   * @param searchDto 搜索参数
   * @returns 用户列表
   */
  searchUsers(tenantId: string, searchDto: any): Promise<UserListDto>;
}
