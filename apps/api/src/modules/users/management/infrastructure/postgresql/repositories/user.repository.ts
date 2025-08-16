import { Injectable } from '@nestjs/common';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user-repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { UserStatus } from '../../../domain/value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * @class UserRepository
 * @description 用户仓储的MikroORM实现
 * 
 * 核心职责：
 * 1. 实现用户数据的持久化操作
 * 2. 实现用户数据的查询操作
 * 3. 支持事件溯源的数据重建
 * 4. 维护数据一致性
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly userMapper: UserMapper
  ) { }

  /**
   * @method save
   * @description 保存用户
   * @param user 用户实体
   * @returns Promise<User> 保存后的用户
   */
  async save(user: User): Promise<User> {
    // 使用映射器转换为数据库实体
    const userEntity = this.userMapper.toEntity(user);

    // 检查是否存在未提交的事件
    const uncommittedEvents = user.uncommittedEvents;
    if (uncommittedEvents.length > 0) {
      // 保存事件到事件存储
      // 这里需要调用事件存储服务
      // await this.eventStore.appendEvents(user.id.value, uncommittedEvents);
    }

    // 保存或更新用户实体
    await this.em.persistAndFlush(userEntity);

    // 标记事件为已提交
    user.markEventsAsCommitted();

    return user;
  }

  /**
   * @method findById
   * @description 根据ID查找用户
   * @param id 用户ID
   * @returns Promise<User | null> 用户实体或null
   */
  async findById(id: UserId): Promise<User | null> {
    const userEntity = await this.em.findOne(UserEntity, { id: id.value });
    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  /**
   * @method findByEmail
   * @description 根据邮箱查找用户
   * @param email 邮箱地址
   * @returns Promise<User | null> 用户实体或null
   */
  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.em.findOne(UserEntity, { email: email.value });
    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  /**
   * @method findByUsername
   * @description 根据用户名查找用户
   * @param username 用户名
   * @returns Promise<User | null> 用户实体或null
   */
  async findByUsername(username: Username): Promise<User | null> {
    const userEntity = await this.em.findOne(UserEntity, { username: username.value });
    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  /**
   * @method findByTenantId
   * @description 根据租户ID查找用户列表
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async findByTenantId(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const userEntities = await this.em.find(UserEntity,
      { tenantId: tenantId.value },
      { limit, offset, orderBy: { createdAt: 'DESC' } }
    );

    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findByStatus
   * @description 根据状态查找用户列表
   * @param status 用户状态
   * @param tenantId 租户ID（可选）
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async findByStatus(status: UserStatus, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = { status: status.value };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity,
      where,
      { limit, offset, orderBy: { createdAt: 'DESC' } }
    );

    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findByOrganization
   * @description 根据组织ID查找用户列表
   * @param organizationId 组织ID
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async findByOrganization(organizationId: string, tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const userEntities = await this.em.find(UserEntity,
      {
        tenantId: tenantId.value,
        $or: [
          { primaryOrganizationId: organizationId },
          { organizations: { $like: `%${organizationId}%` } }
        ]
      },
      { limit, offset, orderBy: { createdAt: 'DESC' } }
    );

    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findByRole
   * @description 根据角色ID查找用户列表
   * @param roleId 角色ID
   * @param tenantId 租户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns Promise<User[]> 用户列表
   */
  async findByRole(roleId: string, tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const userEntities = await this.em.find(UserEntity,
      {
        tenantId: tenantId.value,
        roles: { $like: `%${roleId}%` }
      },
      { limit, offset, orderBy: { createdAt: 'DESC' } }
    );

    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method existsByEmail
   * @description 检查邮箱是否存在
   * @param email 邮箱地址
   * @returns Promise<boolean>
   */
  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.em.count(UserEntity, { email: email.value });
    return count > 0;
  }

  /**
   * @method existsByUsername
   * @description 检查用户名是否存在
   * @param username 用户名
   * @returns Promise<boolean>
   */
  async existsByUsername(username: Username): Promise<boolean> {
    const count = await this.em.count(UserEntity, { username: username.value });
    return count > 0;
  }

  /**
   * @method countByTenantId
   * @description 统计租户下的用户数量
   * @param tenantId 租户ID
   * @returns Promise<number>
   */
  async countByTenantId(tenantId: TenantId): Promise<number> {
    return await this.em.count(UserEntity, { tenantId: tenantId.value });
  }

  /**
   * @method countByStatus
   * @description 统计指定状态的用户数量
   * @param status 用户状态
   * @param tenantId 租户ID（可选）
   * @returns Promise<number>
   */
  async countByStatus(status: UserStatus, tenantId?: TenantId): Promise<number> {
    const where: any = { status: status.value };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }
    return await this.em.count(UserEntity, where);
  }

  /**
   * @method getUserStats
   * @description 获取用户统计信息
   * @param tenantId 租户ID（可选）
   * @returns Promise<object>
   */
  async getUserStats(tenantId?: TenantId): Promise<object> {
    const where = tenantId ? { tenantId: tenantId.value } : {};

    const [total, active, inactive, pending] = await Promise.all([
      this.em.count(UserEntity, where),
      this.em.count(UserEntity, { ...where, status: UserStatus.ACTIVE.value }),
      this.em.count(UserEntity, { ...where, status: UserStatus.INACTIVE.value }),
      this.em.count(UserEntity, { ...where, status: UserStatus.PENDING_ACTIVATION.value })
    ]);

    return {
      total,
      active,
      inactive,
      pending,
      activeRate: total > 0 ? (active / total) * 100 : 0
    };
  }

  /**
   * @method delete
   * @description 删除用户
   * @param id 用户ID
   * @returns Promise<void>
   */
  async delete(id: UserId): Promise<void> {
    await this.em.nativeDelete(UserEntity, { id: id.value });
  }

  /**
   * @method findActiveUsers
   * @description 查找激活状态的用户列表
   */
  async findActiveUsers(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = { status: UserStatus.ACTIVE.value };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findPendingActivationUsers
   * @description 查找待激活的用户列表
   */
  async findPendingActivationUsers(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = { status: UserStatus.PENDING_ACTIVATION.value };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findAll
   * @description 查找所有用户
   */
  async findAll(tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where = tenantId ? { tenantId: tenantId.value } : {};
    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method count
   * @description 统计用户数量
   */
  async count(tenantId?: TenantId): Promise<number> {
    const where = tenantId ? { tenantId: tenantId.value } : {};
    return await this.em.count(UserEntity, where);
  }

  /**
   * @method countByOrganization
   * @description 根据组织统计用户数量
   */
  async countByOrganization(organizationId: string, tenantId: TenantId): Promise<number> {
    return await this.em.count(UserEntity, {
      tenantId: tenantId.value,
      $or: [
        { primaryOrganizationId: organizationId },
        { organizations: { $like: `%${organizationId}%` } }
      ]
    });
  }

  /**
   * @method countByRole
   * @description 根据角色统计用户数量
   */
  async countByRole(roleId: string, tenantId: TenantId): Promise<number> {
    return await this.em.count(UserEntity, {
      tenantId: tenantId.value,
      roles: { $like: `%${roleId}%` }
    });
  }

  /**
   * @method exists
   * @description 检查用户是否存在
   */
  async exists(id: UserId): Promise<boolean> {
    const count = await this.em.count(UserEntity, { id: id.value });
    return count > 0;
  }

  /**
   * @method search
   * @description 搜索用户
   */
  async search(query: string, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = {
      $or: [
        { username: { $like: `%${query}%` } },
        { email: { $like: `%${query}%` } },
        { firstName: { $like: `%${query}%` } },
        { lastName: { $like: `%${query}%` } }
      ]
    };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findUsersByLastLogin
   * @description 根据最后登录时间查找用户
   */
  async findUsersByLastLogin(fromDate: Date, toDate: Date, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = {
      lastLoginAt: { $gte: fromDate, $lte: toDate }
    };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { lastLoginAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findUsersByCreatedDate
   * @description 根据创建时间查找用户
   */
  async findUsersByCreatedDate(fromDate: Date, toDate: Date, tenantId?: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const where: any = {
      createdAt: { $gte: fromDate, $lte: toDate }
    };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const userEntities = await this.em.find(UserEntity, where, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findMultiOrganizationUsers
   * @description 查找多组织用户
   */
  async findMultiOrganizationUsers(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const userEntities = await this.em.find(UserEntity, {
      tenantId: tenantId.value,
      $and: [
        { organizations: { $ne: null } },
        { organizations: { $ne: '' } }
      ]
    }, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method findUsersWithoutPrimaryOrganization
   * @description 查找没有主要组织的用户
   */
  async findUsersWithoutPrimaryOrganization(tenantId: TenantId, limit?: number, offset?: number): Promise<User[]> {
    const userEntities = await this.em.find(UserEntity, {
      tenantId: tenantId.value,
      $or: [
        { primaryOrganizationId: null },
        { primaryOrganizationId: '' }
      ]
    }, { limit, offset, orderBy: { createdAt: 'DESC' } });
    return this.userMapper.toDomainList(userEntities);
  }

  /**
   * @method healthCheck
   * @description 健康检查
   * @returns Promise<boolean>
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.em.findOne(UserEntity, {});
      return true;
    } catch (error) {
      return false;
    }
  }
}
