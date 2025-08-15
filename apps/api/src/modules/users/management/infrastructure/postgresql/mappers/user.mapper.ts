import { Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { Password } from '../../../domain/value-objects/password';
import { UserStatus } from '../../../domain/value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @class UserMapper
 * @description 用户数据实体映射器
 * 
 * 核心职责：
 * 1. 将领域实体转换为数据库实体
 * 2. 将数据库实体转换为领域实体
 * 3. 处理复杂的数据转换逻辑
 * 4. 确保数据完整性
 */
@Injectable()
export class UserMapper {
  /**
   * @method toEntity
   * @description 将领域实体转换为数据库实体
   * @param user 用户领域实体
   * @returns UserEntity 用户数据库实体
   */
  toEntity(user: User): UserEntity {
    const userData = user.getSnapshotData();
    const entity = new UserEntity();

    // 基本属性映射
    entity.id = userData.id;
    entity.email = userData.email;
    entity.username = userData.username;
    entity.passwordHash = userData.passwordHash;
    entity.firstName = userData.firstName;
    entity.lastName = userData.lastName;
    entity.nickname = userData.nickname;
    entity.phoneNumber = userData.phoneNumber;
    entity.avatar = userData.avatar;
    entity.bio = userData.bio;
    entity.status = userData.status;
    entity.tenantId = userData.tenantId;
    entity.primaryOrganizationId = userData.primaryOrganizationId;
    entity.organizations = userData.organizations;
    entity.roles = userData.roles;
    entity.lastLoginAt = userData.lastLoginAt;
    entity.createdAt = userData.createdAt;
    entity.updatedAt = userData.updatedAt;
    entity.version = userData.version || 1;

    return entity;
  }

  /**
   * @method toDomain
   * @description 将数据库实体转换为领域实体
   * @param entity 用户数据库实体
   * @returns User 用户领域实体
   */
  toDomain(entity: UserEntity): User {
    // 创建值对象
    const userId = new UserId(entity.id);
    const email = Email.create(entity.email);
    const username = Username.create(entity.username);
    const password = Password.fromHashed(entity.passwordHash); // 从哈希创建
    const userStatus = UserStatus.create(entity.status);
    const tenantId = new TenantId(entity.tenantId);

    // 创建用户领域实体
    const user = User.create(
      email,
      username,
      password,
      entity.firstName,
      entity.lastName,
      tenantId,
      entity.primaryOrganizationId,
      entity.nickname,
      entity.phoneNumber
    );

    // 设置其他属性
    this.setUserProperties(user, entity);

    return user;
  }

  /**
   * @method toDomainList
   * @description 将数据库实体列表转换为领域实体列表
   * @param entities 用户数据库实体列表
   * @returns User[] 用户领域实体列表
   */
  toDomainList(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * @method toEntityList
   * @description 将领域实体列表转换为数据库实体列表
   * @param users 用户领域实体列表
   * @returns UserEntity[] 用户数据库实体列表
   */
  toEntityList(users: User[]): UserEntity[] {
    return users.map(user => this.toEntity(user));
  }

  /**
   * @method updateEntity
   * @description 更新数据库实体
   * @param entity 现有的数据库实体
   * @param user 用户领域实体
   * @returns UserEntity 更新后的数据库实体
   */
  updateEntity(entity: UserEntity, user: User): UserEntity {
    const userData = user.getSnapshotData();

    // 更新属性
    entity.email = userData.email;
    entity.username = userData.username;
    entity.passwordHash = userData.passwordHash;
    entity.firstName = userData.firstName;
    entity.lastName = userData.lastName;
    entity.nickname = userData.nickname;
    entity.phoneNumber = userData.phoneNumber;
    entity.avatar = userData.avatar;
    entity.bio = userData.bio;
    entity.status = userData.status;
    entity.tenantId = userData.tenantId;
    entity.primaryOrganizationId = userData.primaryOrganizationId;
    entity.organizations = userData.organizations;
    entity.roles = userData.roles;
    entity.lastLoginAt = userData.lastLoginAt;
    entity.updatedAt = userData.updatedAt;
    entity.version = userData.version || entity.version + 1;

    return entity;
  }

  /**
   * @method toPartialEntity
   * @description 创建部分数据库实体（用于更新操作）
   * @param user 用户领域实体
   * @returns Partial<UserEntity> 部分数据库实体
   */
  toPartialEntity(user: User): Partial<UserEntity> {
    const userData = user.getSnapshotData();

    return {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      nickname: userData.nickname,
      phoneNumber: userData.phoneNumber,
      avatar: userData.avatar,
      bio: userData.bio,
      status: userData.status,
      tenantId: userData.tenantId,
      primaryOrganizationId: userData.primaryOrganizationId,
      organizations: userData.organizations,
      roles: userData.roles,
      lastLoginAt: userData.lastLoginAt,
      updatedAt: userData.updatedAt
    };
  }

  /**
   * @method setUserProperties
   * @description 设置用户实体的属性
   * @param user 用户领域实体
   * @param entity 用户数据库实体
   * @private
   */
  private setUserProperties(user: User, entity: UserEntity): void {
    // 使用类型断言来访问私有属性
    (user as any)._id = new UserId(entity.id);
    (user as any)._avatar = entity.avatar;
    (user as any)._bio = entity.bio;
    (user as any)._status = UserStatus.create(entity.status);
    (user as any)._organizations = entity.organizations || [];
    (user as any)._roles = entity.roles || [];
    (user as any)._lastLoginAt = entity.lastLoginAt;
    (user as any)._createdAt = entity.createdAt;
    (user as any)._updatedAt = entity.updatedAt;
  }

  /**
   * @method validateEntity
   * @description 验证数据库实体的完整性
   * @param entity 用户数据库实体
   * @returns boolean 是否有效
   */
  validateEntity(entity: UserEntity): boolean {
    return !!(
      entity.id &&
      entity.email &&
      entity.username &&
      entity.passwordHash &&
      entity.firstName &&
      entity.lastName &&
      entity.status &&
      entity.tenantId &&
      entity.createdAt &&
      entity.updatedAt
    );
  }

  /**
   * @method validateDomain
   * @description 验证领域实体的完整性
   * @param user 用户领域实体
   * @returns boolean 是否有效
   */
  validateDomain(user: User): boolean {
    return !!(
      user.id &&
      user.email &&
      user.username &&
      user.password &&
      user.firstName &&
      user.lastName &&
      user.status &&
      user.tenantId &&
      user.createdAt &&
      user.updatedAt
    );
  }
}
