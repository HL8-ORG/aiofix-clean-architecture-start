import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { Username } from '../value-objects/username';
import { Password } from '../value-objects/password';
import { UserStatus } from '../value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import type { IUserRepository } from '../repositories/user-repository.interface';

/**
 * @class UserDomainService
 * @description 用户领域服务
 * 
 * 核心职责：
 * 1. 用户业务逻辑的协调和编排
 * 2. 用户数据的验证和业务规则检查
 * 3. 用户相关的统计和查询
 * 4. 用户状态管理和转换
 * 
 * 业务规则：
 * - 邮箱地址必须全局唯一
 * - 用户名必须全局唯一
 * - 用户只能归属一个租户
 * - 用户必须至少归属一个组织
 * - 用户状态转换必须符合业务规则
 */
@Injectable()
export class UserDomainService {
  constructor(
    private readonly userRepository: IUserRepository
  ) { }

  /**
   * @method createUser
   * @description 创建用户
   * @param email 邮箱地址
   * @param username 用户名
   * @param password 密码
   * @param firstName 名
   * @param lastName 姓
   * @param tenantId 租户ID
   * @param primaryOrganizationId 主要组织ID
   * @param nickname 昵称
   * @param phoneNumber 手机号
   * @returns Promise<User> 创建的用户
   */
  async createUser(
    email: Email,
    username: Username,
    password: Password,
    firstName: string,
    lastName: string,
    tenantId: TenantId,
    primaryOrganizationId?: string,
    nickname?: string,
    phoneNumber?: string
  ): Promise<User> {
    // 验证邮箱唯一性
    await this.validateEmailUniqueness(email);

    // 验证用户名唯一性
    await this.validateUsernameUniqueness(username);

    // 创建用户
    const user = User.create(
      email,
      username,
      password,
      firstName,
      lastName,
      tenantId,
      primaryOrganizationId,
      nickname,
      phoneNumber
    );

    // 保存用户
    return await this.userRepository.save(user);
  }

  /**
   * @method activateUser
   * @description 激活用户
   * @param userId 用户ID
   * @returns Promise<User> 激活后的用户
   */
  async activateUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);
    user.activate();
    return await this.userRepository.save(user);
  }

  /**
   * @method deactivateUser
   * @description 停用用户
   * @param userId 用户ID
   * @returns Promise<User> 停用后的用户
   */
  async deactivateUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);
    user.deactivate();
    return await this.userRepository.save(user);
  }

  /**
   * @method suspendUser
   * @description 暂停用户
   * @param userId 用户ID
   * @returns Promise<User> 暂停后的用户
   */
  async suspendUser(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);
    user.suspend();
    return await this.userRepository.save(user);
  }

  /**
   * @method updateUserProfile
   * @description 更新用户档案
   * @param userId 用户ID
   * @param firstName 名
   * @param lastName 姓
   * @param nickname 昵称
   * @param phoneNumber 手机号
   * @param avatar 头像
   * @param bio 个人简介
   * @returns Promise<User> 更新后的用户
   */
  async updateUserProfile(
    userId: UserId,
    firstName?: string,
    lastName?: string,
    nickname?: string,
    phoneNumber?: string,
    avatar?: string,
    bio?: string
  ): Promise<User> {
    const user = await this.getUserById(userId);
    user.updateProfile(firstName, lastName, nickname, phoneNumber, avatar, bio);
    return await this.userRepository.save(user);
  }

  /**
   * @method changeUserPassword
   * @description 修改用户密码
   * @param userId 用户ID
   * @param newPassword 新密码
   * @returns Promise<User> 修改后的用户
   */
  async changeUserPassword(userId: UserId, newPassword: Password): Promise<User> {
    const user = await this.getUserById(userId);
    user.changePassword(newPassword);
    return await this.userRepository.save(user);
  }

  /**
   * @method updateUsername
   * @description 更新用户名
   * @param userId 用户ID
   * @param newUsername 新用户名
   * @returns Promise<User> 更新后的用户
   */
  async updateUsername(userId: UserId, newUsername: Username): Promise<User> {
    // 验证用户名唯一性
    await this.validateUsernameUniqueness(newUsername, userId);

    const user = await this.getUserById(userId);
    user.updateUsername(newUsername);
    return await this.userRepository.save(user);
  }

  /**
   * @method addUserToOrganization
   * @description 添加用户到组织
   * @param userId 用户ID
   * @param organizationId 组织ID
   * @returns Promise<User> 更新后的用户
   */
  async addUserToOrganization(userId: UserId, organizationId: string): Promise<User> {
    const user = await this.getUserById(userId);
    user.addOrganization(organizationId);
    return await this.userRepository.save(user);
  }

  /**
   * @method removeUserFromOrganization
   * @description 从组织移除用户
   * @param userId 用户ID
   * @param organizationId 组织ID
   * @returns Promise<User> 更新后的用户
   */
  async removeUserFromOrganization(userId: UserId, organizationId: string): Promise<User> {
    const user = await this.getUserById(userId);

    // 检查是否为最后一个组织
    if (user.organizations.length === 1) {
      throw new Error('User must belong to at least one organization');
    }

    user.removeOrganization(organizationId);
    return await this.userRepository.save(user);
  }

  /**
   * @method setUserPrimaryOrganization
   * @description 设置用户主要组织
   * @param userId 用户ID
   * @param organizationId 组织ID
   * @returns Promise<User> 更新后的用户
   */
  async setUserPrimaryOrganization(userId: UserId, organizationId: string): Promise<User> {
    const user = await this.getUserById(userId);
    user.setPrimaryOrganization(organizationId);
    return await this.userRepository.save(user);
  }

  /**
   * @method addUserRole
   * @description 添加用户角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns Promise<User> 更新后的用户
   */
  async addUserRole(userId: UserId, roleId: string): Promise<User> {
    const user = await this.getUserById(userId);
    user.addRole(roleId);
    return await this.userRepository.save(user);
  }

  /**
   * @method removeUserRole
   * @description 移除用户角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns Promise<User> 更新后的用户
   */
  async removeUserRole(userId: UserId, roleId: string): Promise<User> {
    const user = await this.getUserById(userId);
    user.removeRole(roleId);
    return await this.userRepository.save(user);
  }

  /**
   * @method updateUserLastLogin
   * @description 更新用户最后登录时间
   * @param userId 用户ID
   * @returns Promise<User> 更新后的用户
   */
  async updateUserLastLogin(userId: UserId): Promise<User> {
    const user = await this.getUserById(userId);
    user.updateLastLogin();
    return await this.userRepository.save(user);
  }

  /**
   * @method getUserById
   * @description 根据ID获取用户
   * @param userId 用户ID
   * @returns Promise<User> 用户实体
   */
  async getUserById(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId.value} not found`);
    }
    return user;
  }

  /**
   * @method getUserByEmail
   * @description 根据邮箱获取用户
   * @param email 邮箱地址
   * @returns Promise<User> 用户实体
   */
  async getUserByEmail(email: Email): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error(`User with email ${email.value} not found`);
    }
    return user;
  }

  /**
   * @method getUserByUsername
   * @description 根据用户名获取用户
   * @param username 用户名
   * @returns Promise<User> 用户实体
   */
  async getUserByUsername(username: Username): Promise<User> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error(`User with username ${username.value} not found`);
    }
    return user;
  }

  /**
   * @method getUsersByTenant
   * @description 获取租户下的用户列表
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async getUsersByTenant(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    return await this.userRepository.findByTenantId(tenantId, limit, offset);
  }

  /**
   * @method getActiveUsers
   * @description 获取激活状态的用户列表
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async getActiveUsers(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    return await this.userRepository.findActiveUsers(tenantId, limit, offset);
  }

  /**
   * @method getUsersByOrganization
   * @description 获取组织下的用户列表
   * @param organizationId 组织ID
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async getUsersByOrganization(organizationId: string, tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    return await this.userRepository.findByOrganization(organizationId, tenantId, limit, offset);
  }

  /**
   * @method searchUsers
   * @description 搜索用户
   * @param query 搜索关键词
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async searchUsers(query: string, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    return await this.userRepository.search(query, tenantId, limit, offset);
  }

  /**
   * @method getUserStatistics
   * @description 获取用户统计信息
   * @param tenantId 租户ID（可选）
   * @returns Promise<UserStatistics> 用户统计信息
   */
  async getUserStatistics(tenantId?: TenantId): Promise<UserStatistics> {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      suspendedUsers
    ] = await Promise.all([
      this.userRepository.count(tenantId),
      this.userRepository.countByStatus(UserStatus.ACTIVE, tenantId),
      this.userRepository.countByStatus(UserStatus.PENDING_ACTIVATION, tenantId),
      this.userRepository.countByStatus(UserStatus.INACTIVE, tenantId),
      this.userRepository.countByStatus(UserStatus.SUSPENDED, tenantId)
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      pendingActivation: pendingUsers,
      inactive: inactiveUsers,
      suspended: suspendedUsers,
      activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    };
  }

  /**
   * @method validateEmailUniqueness
   * @description 验证邮箱唯一性
   * @param email 邮箱地址
   * @param excludeUserId 排除的用户ID（用于更新时）
   * @throws Error 当邮箱已存在时
   */
  private async validateEmailUniqueness(email: Email, excludeUserId?: UserId): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && (!excludeUserId || !existingUser.id.equals(excludeUserId))) {
      throw new Error(`Email ${email.value} is already in use`);
    }
  }

  /**
   * @method validateUsernameUniqueness
   * @description 验证用户名唯一性
   * @param username 用户名
   * @param excludeUserId 排除的用户ID（用于更新时）
   * @throws Error 当用户名已存在时
   */
  private async validateUsernameUniqueness(username: Username, excludeUserId?: UserId): Promise<void> {
    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser && (!excludeUserId || !existingUser.id.equals(excludeUserId))) {
      throw new Error(`Username ${username.value} is already in use`);
    }
  }
}

/**
 * @interface UserStatistics
 * @description 用户统计信息接口
 */
export interface UserStatistics {
  total: number;
  active: number;
  pendingActivation: number;
  inactive: number;
  suspended: number;
  activationRate: number;
}
