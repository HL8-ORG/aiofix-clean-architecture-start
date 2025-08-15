import { Entity, PrimaryKey, Property, Index, Collection, OneToMany, ManyToOne, Enum } from '@mikro-orm/core';
import { UserId } from '../../../domain/value-objects/user-id';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { Password } from '../../../domain/value-objects/password';
import { UserStatus } from '../../../domain/value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @class UserEntity
 * @description 用户数据库实体
 * 
 * 核心职责：
 * 1. 用户数据的数据库映射
 * 2. 支持MikroORM的查询和持久化
 * 3. 维护用户数据的完整性
 * 4. 支持多租户数据隔离
 */
@Entity({ tableName: 'users' })
@Index({ name: 'idx_users_email', properties: ['email'] })
@Index({ name: 'idx_users_username', properties: ['username'] })
@Index({ name: 'idx_users_tenant_id', properties: ['tenantId'] })
@Index({ name: 'idx_users_status', properties: ['status'] })
@Index({ name: 'idx_users_created_at', properties: ['createdAt'] })
export class UserEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Property({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Property({ type: 'varchar', length: 100 })
  firstName!: string;

  @Property({ type: 'varchar', length: 100 })
  lastName!: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  nickname?: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @Property({ type: 'text', nullable: true })
  bio?: string;

  @Property({ type: 'varchar', length: 20 })
  status!: string;

  @Property({ type: 'uuid' })
  tenantId!: string;

  @Property({ type: 'uuid', nullable: true })
  primaryOrganizationId?: string;

  @Property({ type: 'json', nullable: true })
  organizations?: string[];

  @Property({ type: 'json', nullable: true })
  roles?: string[];

  @Property({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @Property({ type: 'datetime' })
  createdAt!: Date;

  @Property({ type: 'datetime' })
  updatedAt!: Date;

  @Property({ type: 'int', version: true })
  version!: number;

  /**
   * @method fromDomain
   * @description 从领域实体创建数据库实体
   * @param user 用户领域实体
   * @returns UserEntity
   */
  static fromDomain(user: any): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id.value;
    entity.email = user.email.value;
    entity.username = user.username.value;
    entity.passwordHash = user.password.hash;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.nickname = user.nickname;
    entity.phoneNumber = user.phoneNumber;
    entity.avatar = user.avatar;
    entity.bio = user.bio;
    entity.status = user.status.value;
    entity.tenantId = user.tenantId.value;
    entity.primaryOrganizationId = user.primaryOrganizationId;
    entity.organizations = user.organizations;
    entity.roles = user.roles;
    entity.lastLoginAt = user.lastLoginAt;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }

  /**
   * @method toDomain
   * @description 转换为领域实体
   * @returns 用户领域实体
   */
  toDomain(): any {
    // 这里需要调用领域实体的工厂方法或构造函数
    // 由于领域实体有私有构造函数，需要通过静态方法创建
    // 具体实现将在仓储中处理
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      nickname: this.nickname,
      phoneNumber: this.phoneNumber,
      avatar: this.avatar,
      bio: this.bio,
      status: this.status,
      tenantId: this.tenantId,
      primaryOrganizationId: this.primaryOrganizationId,
      organizations: this.organizations || [],
      roles: this.roles || [],
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    };
  }
}
