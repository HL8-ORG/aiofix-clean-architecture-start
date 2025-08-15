import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { Username } from '../value-objects/username';
import { UserStatus } from '../value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @interface IUserRepository
 * @description 用户仓储接口
 * 
 * 核心职责：
 * 1. 用户数据的持久化操作
 * 2. 用户数据的查询操作
 * 3. 用户数据的统计操作
 * 4. 支持多租户数据隔离
 * 
 * 业务规则：
 * - 邮箱地址必须全局唯一
 * - 用户名必须全局唯一
 * - 用户只能归属一个租户
 * - 支持基于组织的用户查询
 */
export interface IUserRepository {
  /**
   * @method save
   * @description 保存用户
   * @param user 用户实体
   * @returns Promise<User> 保存后的用户
   */
  save(user: User): Promise<User>;

  /**
   * @method findById
   * @description 根据ID查找用户
   * @param id 用户ID
   * @returns Promise<User | null> 用户实体或null
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * @method findByEmail
   * @description 根据邮箱查找用户
   * @param email 邮箱地址
   * @returns Promise<User | null> 用户实体或null
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * @method findByUsername
   * @description 根据用户名查找用户
   * @param username 用户名
   * @returns Promise<User | null> 用户实体或null
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * @method findByTenantId
   * @description 根据租户ID查找用户列表
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findByTenantId(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findByStatus
   * @description 根据状态查找用户列表
   * @param status 用户状态
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findByStatus(status: UserStatus, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findByOrganization
   * @description 根据组织ID查找用户列表
   * @param organizationId 组织ID
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findByOrganization(organizationId: string, tenantId: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findByRole
   * @description 根据角色ID查找用户列表
   * @param roleId 角色ID
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findByRole(roleId: string, tenantId: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findActiveUsers
   * @description 查找激活状态的用户列表
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findActiveUsers(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findPendingActivationUsers
   * @description 查找待激活的用户列表
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findPendingActivationUsers(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findAll
   * @description 查找所有用户
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findAll(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method count
   * @description 统计用户数量
   * @param tenantId 租户ID（可选）
   * @returns Promise<number> 用户数量
   */
  count(tenantId?: TenantId): Promise<number>;

  /**
   * @method countByStatus
   * @description 根据状态统计用户数量
   * @param status 用户状态
   * @param tenantId 租户ID（可选）
   * @returns Promise<number> 用户数量
   */
  countByStatus(status: UserStatus, tenantId?: TenantId): Promise<number>;

  /**
   * @method countByOrganization
   * @description 根据组织统计用户数量
   * @param organizationId 组织ID
   * @param tenantId 租户ID
   * @returns Promise<number> 用户数量
   */
  countByOrganization(organizationId: string, tenantId: TenantId): Promise<number>;

  /**
   * @method countByRole
   * @description 根据角色统计用户数量
   * @param roleId 角色ID
   * @param tenantId 租户ID
   * @returns Promise<number> 用户数量
   */
  countByRole(roleId: string, tenantId: TenantId): Promise<number>;

  /**
   * @method exists
   * @description 检查用户是否存在
   * @param id 用户ID
   * @returns Promise<boolean> 是否存在
   */
  exists(id: UserId): Promise<boolean>;

  /**
   * @method existsByEmail
   * @description 检查邮箱是否已存在
   * @param email 邮箱地址
   * @returns Promise<boolean> 是否存在
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * @method existsByUsername
   * @description 检查用户名是否已存在
   * @param username 用户名
   * @returns Promise<boolean> 是否存在
   */
  existsByUsername(username: Username): Promise<boolean>;

  /**
   * @method delete
   * @description 删除用户
   * @param id 用户ID
   * @returns Promise<void>
   */
  delete(id: UserId): Promise<void>;

  /**
   * @method search
   * @description 搜索用户
   * @param query 搜索关键词
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  search(query: string, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findUsersByLastLogin
   * @description 根据最后登录时间查找用户
   * @param fromDate 开始时间
   * @param toDate 结束时间
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findUsersByLastLogin(fromDate: Date, toDate: Date, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findUsersByCreatedDate
   * @description 根据创建时间查找用户
   * @param fromDate 开始时间
   * @param toDate 结束时间
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findUsersByCreatedDate(fromDate: Date, toDate: Date, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findMultiOrganizationUsers
   * @description 查找多组织用户
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findMultiOrganizationUsers(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]>;

  /**
   * @method findUsersWithoutPrimaryOrganization
   * @description 查找没有主要组织的用户
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  findUsersWithoutPrimaryOrganization(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]>;
}
