import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { Username } from '../value-objects/username';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * 用户仓储接口
 * 定义用户数据访问的抽象接口
 */
export interface IUserRepository {
  /**
   * 根据ID查找用户
   * @param id 用户ID
   * @returns 用户实体或null
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * 根据邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户实体或null
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户实体或null
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * 根据租户ID查找用户列表
   * @param tenantId 租户ID
   * @param offset 偏移量
   * @param limit 限制数量
   * @param search 搜索关键词
   * @returns 用户列表和总数
   */
  findByTenantId(
    tenantId: TenantId,
    offset: number,
    limit: number,
    search?: string,
  ): Promise<[User[], number]>;

  /**
   * 查找激活状态的用户
   * @param tenantId 租户ID
   * @returns 激活用户列表
   */
  findActiveUsers(tenantId: TenantId): Promise<User[]>;

  /**
   * 查找待激活的用户
   * @param tenantId 租户ID
   * @returns 待激活用户列表
   */
  findPendingActivationUsers(tenantId: TenantId): Promise<User[]>;

  /**
   * 查找所有用户
   * @param tenantId 租户ID
   * @returns 所有用户列表
   */
  findAll(tenantId: TenantId): Promise<User[]>;

  /**
   * 统计用户数量
   * @param tenantId 租户ID
   * @returns 用户数量
   */
  count(tenantId: TenantId): Promise<number>;

  /**
   * 保存用户
   * @param user 用户实体
   * @returns 保存后的用户
   */
  save(user: User): Promise<User>;

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  delete(id: string): Promise<void>;

  /**
   * 检查邮箱是否存在
   * @param email 邮箱地址
   * @returns 是否存在
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * 检查用户名是否存在
   * @param username 用户名
   * @returns 是否存在
   */
  existsByUsername(username: Username): Promise<boolean>;

  /**
   * 根据邮箱和租户ID查找用户
   * @param email 邮箱地址
   * @param tenantId 租户ID
   * @returns 用户实体或null
   */
  findByEmailAndTenantId(email: Email, tenantId: TenantId): Promise<User | null>;

  /**
   * 根据用户名和租户ID查找用户
   * @param username 用户名
   * @param tenantId 租户ID
   * @returns 用户实体或null
   */
  findByUsernameAndTenantId(username: Username, tenantId: TenantId): Promise<User | null>;
}
