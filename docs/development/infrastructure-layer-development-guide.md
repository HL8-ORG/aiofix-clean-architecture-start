# 基础设施层开发指南

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档状态**: 正式版
- **负责人**: 开发团队

---

## 🎯 概述

基础设施层是Clean Architecture中的最外层，负责与外部系统的交互，包括数据库、缓存、消息队列、外部API等。在用户管理模块中，我们实现了多数据库适配的基础设施层，支持PostgreSQL和MongoDB，并采用了数据映射器模式来解耦领域层和基础设施层。

**重要说明**: 
1. 本项目统一使用 **MikroORM** 作为ORM框架，MikroORM提供了强大的TypeScript支持、灵活的查询API、优秀的性能表现以及完善的生态系统。
2. 本项目采用 **CQRS架构**，将命令（Command）和查询（Query）分离，而不是传统的CRUD模式。

### 核心价值
1. **CQRS架构**: 命令和查询职责分离，支持读写分离和性能优化
2. **多数据库适配**: 支持PostgreSQL和MongoDB，便于技术选型和迁移
3. **数据映射**: 通过Mapper模式解耦领域实体和数据库实体
4. **仓储模式**: 提供统一的数据访问接口，支持命令和查询分离
5. **事件溯源**: 支持事件存储和聚合重建
6. **可测试性**: 通过接口抽象，便于单元测试和集成测试
7. **可扩展性**: 易于添加新的数据库支持和功能扩展

---

## 🏗️ 架构设计要点

### 1. CQRS + 多数据库适配架构

#### 核心组件
- **仓储**: 统一的数据访问接口，支持读写操作
- **数据库适配器工厂**: 根据配置创建不同的数据库适配器
- **数据库配置服务**: 管理数据库连接配置
- **动态模块**: 根据数据库类型动态加载相应的实现
- **数据映射器**: 转换领域实体和数据库实体
- **事件存储**: 支持事件溯源的事件持久化

#### 目录结构
```
infrastructure/
├── postgresql/              # PostgreSQL实现
│   ├── entities/            # 数据库实体
│   │   └── user.entity.ts
│   ├── mappers/             # 数据映射器
│   │   ├── user.mapper.ts
│   │   └── user.mapper.spec.ts
│   ├── repositories/        # 仓储实现
│   │   ├── user.repository.ts
│   │   └── user.repository.spec.ts
│   ├── event-store/         # 事件存储
│   │   ├── postgres-event-store.ts
│   │   └── event-store.spec.ts
│   └── index.ts
├── mongodb/                 # MongoDB实现（预留）
├── README.md               # 基础设施层说明文档
└── index.ts                # 导出文件
```

### 2. CQRS + 设计模式应用

#### CQRS模式
- **命令**: 通过应用层的命令处理器处理写操作
- **查询**: 通过应用层的查询处理器处理读操作
- **事件存储**: 支持事件溯源的事件持久化和聚合重建
- **统一仓储**: 提供统一的数据访问接口，支持读写操作

#### 工厂模式
- 数据库适配器工厂根据配置创建不同的数据库实现
- 支持运行时切换数据库类型
- 命令仓储和查询仓储的工厂创建

#### 映射器模式
- 数据映射器：领域实体 ↔ 数据库实体
- 保持领域层的纯净性

#### 仓储模式
- **统一仓储**: 提供数据读写接口，支持事件存储和复杂查询
- 隐藏具体的数据存储实现细节

#### 策略模式
- 不同的数据库实现作为不同的策略
- 支持策略的动态切换

### 3. MikroORM集成

#### MikroORM优势
- **TypeScript优先**: 原生TypeScript支持，提供完整的类型安全
- **性能优秀**: 高效的查询执行和内存管理
- **功能丰富**: 支持复杂查询、关系映射、迁移等
- **生态系统**: 完善的文档和社区支持
- **灵活性**: 支持多种数据库和配置选项

#### 核心组件
- **EntityManager**: 核心的实体管理器，负责所有数据库操作
- **Repository**: 提供便捷的查询方法
- **QueryBuilder**: 构建复杂查询的API
- **Migration**: 数据库迁移管理
- **Schema**: 数据库模式管理

---

## 🔧 开发要点

### 1. 数据库实体设计

#### 实体设计原则
- **单一职责**: 每个实体只负责一个业务概念的数据映射
- **完整性**: 确保所有必要的字段都有定义
- **性能优化**: 合理使用索引提升查询性能
- **数据隔离**: 支持多租户数据隔离

#### UserEntity示例 (MikroORM)
```typescript
import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

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
}
```

#### 设计要点
1. **索引设计**: 为常用查询字段创建索引
2. **字段类型**: 根据业务需求选择合适的字段类型
3. **约束设计**: 使用唯一约束确保数据一致性
4. **版本控制**: 使用版本字段支持乐观锁
5. **审计字段**: 包含创建时间、更新时间等审计字段

#### MikroORM实体注解说明
- **@Entity**: 标记类为数据库实体
- **@PrimaryKey**: 定义主键字段
- **@Property**: 定义普通属性字段
- **@Index**: 定义数据库索引
- **@Unique**: 定义唯一约束
- **@Version**: 定义版本字段（乐观锁）

### 2. 数据映射器设计

#### 映射器设计原则
- **单一职责**: 只负责数据转换，不包含业务逻辑
- **双向转换**: 支持领域实体到数据库实体的双向转换
- **数据完整性**: 确保转换过程中数据不丢失
- **性能优化**: 避免不必要的对象创建

#### UserMapper示例
```typescript
@Injectable()
export class UserMapper {
  /**
   * 将领域实体转换为数据库实体
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
   * 将数据库实体转换为领域实体
   */
  toDomain(entity: UserEntity): User {
    // 创建值对象
    const userId = new UserId(entity.id);
    const email = Email.create(entity.email);
    const username = Username.create(entity.username);
    const password = Password.fromHashed(entity.passwordHash);
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
   * 将数据库实体列表转换为领域实体列表
   */
  toDomainList(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
```

#### 设计要点
1. **值对象处理**: 正确处理值对象的创建和转换
2. **事件溯源**: 支持事件溯源实体的快照数据转换
3. **批量转换**: 提供列表转换方法提高性能
4. **数据验证**: 在转换过程中进行数据验证
5. **错误处理**: 处理转换过程中的异常情况

### 3. 仓储实现设计

#### 仓储设计原则
- **接口实现**: 实现领域层定义的仓储接口
- **数据转换**: 使用映射器进行数据转换
- **事务管理**: 正确处理数据库事务
- **事件处理**: 支持事件溯源的事件存储
- **聚合持久化**: 支持聚合根的持久化和快照管理
- **查询优化**: 使用索引和合适的查询策略
- **复杂查询**: 支持复杂的业务查询需求

#### 统一仓储示例 (UserRepository)
```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly userMapper: UserMapper,
    private readonly eventStore: PostgresEventStore
  ) {}

  /**
   * 保存用户
   */
  async save(user: User): Promise<User> {
    // 使用映射器转换为数据库实体
    const userEntity = this.userMapper.toEntity(user);

    // 检查是否存在未提交的事件
    const uncommittedEvents = user.uncommittedEvents;
    if (uncommittedEvents.length > 0) {
      // 保存事件到事件存储
      await this.eventStore.appendEvents(user.id.value, uncommittedEvents);
    }

    // 使用MikroORM的EntityManager保存或更新用户实体
    await this.em.persistAndFlush(userEntity);

    // 标记事件为已提交
    user.markEventsAsCommitted();

    return user;
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: UserId): Promise<User | null> {
    const userEntity = await this.em.findOne(UserEntity, { id: id.value });
    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: Email): Promise<User | null> {
    const userEntity = await this.em.findOne(UserEntity, { email: email.value });
    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  /**
   * 根据租户ID查找用户列表
   */
  async findByTenantId(
    tenantId: TenantId,
    offset: number,
    limit: number,
    search?: string
  ): Promise<[User[], number]> {
    const where: any = { tenantId: tenantId.value };
    
    if (search) {
      where.$or = [
        { email: { $ilike: `%${search}%` } },
        { username: { $ilike: `%${search}%` } },
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } }
      ];
    }

    // 使用MikroORM的findAndCount方法
    const [entities, total] = await this.em.findAndCount(UserEntity, where, {
      offset,
      limit,
      orderBy: { createdAt: 'DESC' }
    });

    const users = this.userMapper.toDomainList(entities);
    return [users, total];
  }

  /**
   * 使用QueryBuilder进行复杂查询
   */
  async findActiveUsersByTenant(tenantId: TenantId): Promise<User[]> {
    const qb = this.em.createQueryBuilder(UserEntity, 'u');
    
    const entities = await qb
      .where({ tenantId: tenantId.value, status: 'active' })
      .orderBy({ createdAt: 'DESC' })
      .getResult();

    return this.userMapper.toDomainList(entities);
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(tenantId?: TenantId): Promise<object> {
    const where = tenantId ? { tenantId: tenantId.value } : {};

    const [total, active, inactive, pending] = await Promise.all([
      this.em.count(UserEntity, where),
      this.em.count(UserEntity, { ...where, status: 'active' }),
      this.em.count(UserEntity, { ...where, status: 'inactive' }),
      this.em.count(UserEntity, { ...where, status: 'pending_activation' })
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
   * 删除用户
   */
  async delete(id: UserId): Promise<void> {
    await this.em.nativeDelete(UserEntity, { id: id.value });
  }
}
```

#### 仓储设计要点
1. **事件溯源集成**: 支持事件溯源的事件存储和聚合重建
2. **聚合持久化**: 支持聚合根的持久化和快照管理
3. **事务一致性**: 确保数据操作的原子性
4. **事件存储**: 正确处理未提交事件的存储
5. **版本控制**: 支持乐观锁和版本管理
6. **查询优化**: 使用索引和合适的查询条件
7. **分页支持**: 实现高效的分页查询
8. **搜索功能**: 支持多字段模糊搜索

#### MikroORM仓储特性
- **EntityManager**: 核心的实体管理器，提供所有数据库操作
- **QueryBuilder**: 构建复杂查询的API
- **findAndCount**: 支持分页查询和总数统计
- **persistAndFlush**: 持久化实体并立即刷新
- **事务支持**: 完整的事务管理支持

### 4. 多数据库适配设计

#### 适配器工厂模式
```typescript
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb'
}

export interface DatabaseAdapter {
  getEntities(): any[];
  getRepositories(): any[];
  getMappers(): any[];
  getEventStore(): any;
}

export class DatabaseAdapterFactory {
  private static currentAdapter: DatabaseAdapter;
  private static databaseType: DatabaseType = DatabaseType.POSTGRESQL;

  static setDatabaseType(type: DatabaseType): void {
    this.databaseType = type;
    this.currentAdapter = this.createAdapter(type);
  }

  static getCurrentAdapter(): DatabaseAdapter {
    if (!this.currentAdapter) {
      this.currentAdapter = this.createAdapter(this.databaseType);
    }
    return this.currentAdapter;
  }

  private static createAdapter(type: DatabaseType): DatabaseAdapter {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        return this.createPostgreSQLAdapter();
      case DatabaseType.MONGODB:
        return this.createMongoDBAdapter();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  private static createPostgreSQLAdapter(): DatabaseAdapter {
    return {
      getEntities: () => [
        UserEntity,
        TenantEntity,
        // 其他实体
      ],
      getRepositories: () => [
        UserRepository,
        TenantRepository,
        // 其他仓储
      ],
      getMappers: () => [
        UserMapper,
        TenantMapper,
        // 其他映射器
      ],
      getEventStore: () => PostgresEventStore
    };
  }
}
```

#### 动态模块配置 (MikroORM)
```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({})
export class UsersManagementDynamicModule {
  static forRoot(): DynamicModule {
    const adapter = DatabaseAdapterFactory.getCurrentAdapter();
    
    return {
      module: UsersManagementDynamicModule,
      imports: [
        // 使用MikroORM模块注册实体
        MikroOrmModule.forFeature(adapter.getEntities())
      ],
      providers: [
        ...adapter.getRepositories(),
        ...adapter.getMappers(),
        adapter.getEventStore()
      ],
      exports: [
        ...adapter.getRepositories(),
        ...adapter.getMappers(),
        adapter.getEventStore()
      ]
    };
  }
}
```

---

## 📝 开发规范

### 1. 命名规范
- **实体**: 使用名词+Entity，如 `UserEntity`
- **映射器**: 使用名词+Mapper，如 `UserMapper`
- **仓储**: 使用名词+Repository，如 `UserRepository`
- **仓储接口**: 使用I+名词+Repository，如 `IUserRepository`

### 2. 文件组织
- 按数据库类型分目录：`postgresql/`, `mongodb/`
- 每个数据库类型下按功能分目录：`entities/`, `mappers/`, `repositories/`
- 事件存储目录：`event-store/`
- 每个功能目录下包含实现文件和测试文件

### 3. 依赖注入
- 使用NestJS的依赖注入容器
- 在模块中正确配置提供者和导出
- 使用接口进行依赖抽象
- 仓储依赖事件存储服务

### 4. 错误处理
- 在仓储层进行数据库异常处理
- 在事件存储层进行事件存储异常处理
- 使用适当的异常类型
- 提供清晰的错误信息

### 5. 测试规范
- 为每个组件编写单元测试
- 使用模拟对象隔离依赖
- 测试数据转换的正确性
- 测试事件存储和聚合重建

---

## 🎯 最佳实践

### 1. 单一职责原则
- 每个实体只负责一个业务概念的数据映射
- 每个映射器只负责数据转换
- 每个仓储只负责数据访问

### 2. 开闭原则
- 通过添加新的数据库适配器来扩展功能
- 不修改现有的数据库实现代码
- 使用接口进行抽象

### 3. 依赖倒置原则
- 基础设施层依赖领域层的接口
- 不依赖具体的数据库实现
- 通过依赖注入管理依赖关系

### 4. 接口隔离原则
- 定义专门的仓储接口
- 避免大而全的接口
- 保持接口的简洁性

---

## 📊 性能优化

### 1. 数据库查询优化 (MikroORM)
- **索引设计**: 为常用查询字段创建索引
- **查询优化**: 使用合适的查询条件和连接
- **分页查询**: 使用MikroORM的findAndCount实现高效分页
- **批量操作**: 使用MikroORM的批量插入和更新API
- **QueryBuilder**: 使用QueryBuilder构建复杂查询
- **关系查询**: 利用MikroORM的关系映射功能

### 2. 数据映射优化
- **懒加载**: 避免不必要的数据加载
- **缓存映射**: 缓存常用的映射结果
- **批量映射**: 使用批量映射方法
- **内存管理**: 及时释放不需要的对象

### 3. 连接池管理 (MikroORM)
- **连接池配置**: 在MikroORM配置中合理设置连接池大小
- **连接复用**: 利用MikroORM的连接池管理
- **连接监控**: 监控MikroORM连接池状态
- **连接清理**: MikroORM自动管理连接生命周期
- **事务管理**: 使用MikroORM的事务API确保数据一致性

### 4. 缓存策略
- **查询缓存**: 缓存常用的查询结果
- **映射缓存**: 缓存数据映射结果
- **缓存失效**: 合理设置缓存失效策略
- **缓存监控**: 监控缓存命中率

---

## 🔧 扩展指南

### 添加新的数据库支持
1. 在 `DatabaseType` 枚举中添加新的数据库类型
2. 创建新的数据库适配器实现
3. 在 `DatabaseAdapterFactory` 中添加创建方法
4. 实现相应的MikroORM实体、映射器和仓储
5. 实现相应的事件存储
6. 更新动态模块配置，使用MikroOrmModule.forFeature注册实体

### 添加新的实体
1. 创建MikroORM数据库实体类（使用@Entity、@Property等装饰器）
2. 实现相应的映射器
3. 实现相应的仓储（使用EntityManager）
4. 在适配器中注册新的组件
5. 在MikroOrmModule.forFeature中注册实体
6. 编写单元测试

### 添加新的查询方法
1. 在仓储接口中定义新方法
2. 在仓储实现中使用MikroORM的EntityManager或QueryBuilder实现新方法
3. 优化查询性能（使用索引、QueryBuilder等）
4. 编写单元测试
5. 更新文档

---

## 📋 总结

基础设施层开发的核心要点是：

1. **CQRS架构**: 命令和查询职责分离，支持应用层的读写分离
2. **MikroORM集成**: 统一使用MikroORM作为ORM框架，提供强大的TypeScript支持和优秀的性能
3. **多数据库适配**: 支持多种数据库，便于技术选型和迁移
4. **数据映射**: 通过Mapper模式解耦领域层和基础设施层
5. **统一仓储**: 提供数据读写接口，支持事件存储和复杂查询
6. **事件溯源**: 支持事件溯源的数据存储和聚合重建
7. **性能优化**: 合理使用索引、缓存和连接池
8. **可测试性**: 通过接口抽象，便于单元测试
9. **可扩展性**: 易于添加新的数据库支持和功能

通过这样的架构设计，我们建立了一个灵活、高效、可维护的基础设施层，为整个系统的成功奠定了坚实的基础。

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.3 | 2024-12 | 简化CQRS架构，统一使用单一数据库实体，保持传统映射关系 | 开发团队 |
| v1.2 | 2024-12 | 更新为CQRS架构，明确命令端和查询端分离，添加事件存储支持 | 开发团队 |
| v1.1 | 2024-12 | 明确MikroORM作为ORM框架，添加相关配置和使用说明 | 开发团队 |
| v1.0 | 2024-12 | 初始版本，包含多数据库适配架构 | 开发团队 |

---

## 📞 联系方式

- **技术负责人**: [待填写]
- **架构师**: [待填写]
- **开发团队**: [待填写]
- **邮箱**: [待填写]
