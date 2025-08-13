# 领域层开发指南

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档状态**: 开发指南
- **负责人**: 架构设计团队

---

## 🎯 领域层概述

### 1.1 领域层的核心地位

领域层是DDD和Clean Architecture的核心，具有以下特征：

- **业务逻辑中心**: 包含所有核心业务逻辑和规则
- **无外部依赖**: 不依赖其他层，保持纯净
- **领域模型**: 定义实体、值对象、聚合根等核心概念
- **业务规则**: 封装业务约束和验证逻辑

### 1.2 领域层的职责

```typescript
/**
 * @description 领域层的主要职责
 */
export class DomainLayerResponsibilities {
  // 1. 定义领域模型
  static getDomainModels(): string[] {
    return [
      'Entities (实体)',
      'Value Objects (值对象)', 
      'Aggregates (聚合根)',
      'Domain Services (领域服务)',
      'Domain Events (领域事件)',
      'Repositories (仓储接口)'
    ];
  }

  // 2. 封装业务逻辑
  static getBusinessLogic(): string[] {
    return [
      '业务规则验证',
      '状态变更逻辑',
      '业务计算',
      '约束检查',
      '业务策略'
    ];
  }

  // 3. 定义领域接口
  static getDomainInterfaces(): string[] {
    return [
      'Repository Interfaces',
      'Domain Service Interfaces',
      'Event Interfaces'
    ];
  }
}
```

---

## 🏗️ 开发注意事项

### 2.1 架构原则

#### 2.1.1 依赖倒置原则
```typescript
/**
 * @description 领域层依赖倒置原则
 */
export class DependencyInversionPrinciple {
  // ✅ 正确：领域层定义接口
  export interface TenantRepository {
    findById(id: TenantId): Promise<Tenant | null>;
    save(tenant: Tenant): Promise<void>;
  }

  // ❌ 错误：领域层依赖具体实现
  // import { PostgresTenantRepository } from '../infrastructure';
  
  // ✅ 正确：基础设施层实现接口
  export class PostgresTenantRepository implements TenantRepository {
    // 实现细节
  }
}
```

#### 2.1.2 单一职责原则
```typescript
/**
 * @description 每个类只负责一个职责
 */
export class SingleResponsibilityPrinciple {
  // ✅ 正确：租户实体只负责租户业务逻辑
  export class Tenant extends EventSourcedAggregate {
    // 租户相关的业务逻辑
  }

  // ✅ 正确：租户仓储接口只负责数据访问抽象
  export interface TenantRepository {
    // 数据访问相关的方法
  }

  // ✅ 正确：租户领域服务只负责跨实体的业务逻辑
  export class TenantDomainService {
    // 跨实体的业务逻辑
  }
}
```

#### 2.1.3 开闭原则
```typescript
/**
 * @description 对扩展开放，对修改封闭
 */
export class OpenClosedPrinciple {
  // ✅ 正确：通过接口扩展
  export interface TenantValidationRule {
    validate(tenant: Tenant): ValidationResult;
  }

  export class TenantNameValidationRule implements TenantValidationRule {
    validate(tenant: Tenant): ValidationResult {
      // 验证租户名称
    }
  }

  export class TenantCodeValidationRule implements TenantValidationRule {
    validate(tenant: Tenant): ValidationResult {
      // 验证租户代码
    }
  }
}
```

### 2.2 领域模型设计

#### 2.2.1 实体设计
```typescript
/**
 * @description 实体设计注意事项
 */
export class EntityDesignGuidelines {
  // 1. 实体必须有唯一标识
  export class Tenant extends EventSourcedAggregate {
    private readonly id: TenantId; // 唯一标识
    private name: TenantName;
    private status: TenantStatus;
    
    constructor(id: TenantId) {
      super();
      this.id = id;
    }

    getId(): TenantId {
      return this.id;
    }
  }

  // 2. 实体应该封装业务逻辑
  export class User extends EventSourcedAggregate {
    private email: Email;
    private status: UserStatus;
    private tenantId: TenantId;

    activate(): void {
      if (this.status === UserStatus.ACTIVE) {
        throw new UserAlreadyActiveException(this.id.value);
      }
      
      this.apply(new UserActivatedEvent(this.id.value, new Date()));
    }

    changeTenant(newTenantId: TenantId, reason: string): void {
      if (this.tenantId.equals(newTenantId)) {
        return; // 无变更，直接返回
      }

      this.apply(new UserTenantChangedEvent(
        this.id.value,
        this.tenantId.value,
        newTenantId.value,
        reason
      ));
    }
  }

  // 3. 实体应该保护内部状态
  export class Role extends EventSourcedAggregate {
    private permissions: Set<PermissionId> = new Set();

    addPermission(permissionId: PermissionId): void {
      if (this.permissions.has(permissionId)) {
        throw new PermissionAlreadyExistsException(permissionId.value);
      }
      
      this.permissions.add(permissionId);
      this.apply(new PermissionAddedToRoleEvent(this.id.value, permissionId.value));
    }

    removePermission(permissionId: PermissionId): void {
      if (!this.permissions.has(permissionId)) {
        throw new PermissionNotFoundException(permissionId.value);
      }
      
      this.permissions.delete(permissionId);
      this.apply(new PermissionRemovedFromRoleEvent(this.id.value, permissionId.value));
    }

    // 提供只读访问
    getPermissions(): ReadonlySet<PermissionId> {
      return this.permissions;
    }
  }
}
```

#### 2.2.2 值对象设计
```typescript
/**
 * @description 值对象设计注意事项
 */
export class ValueObjectDesignGuidelines {
  // 1. 值对象应该是不可变的
  export class Email {
    private readonly value: string;

    constructor(value: string) {
      this.validate(value);
      this.value = value.toLowerCase().trim();
    }

    private validate(value: string): void {
      if (!value || !value.includes('@')) {
        throw new InvalidEmailException(value);
      }
    }

    getValue(): string {
      return this.value;
    }

    // 2. 值对象应该实现相等性比较
    equals(other: Email): boolean {
      return this.value === other.value;
    }

    // 3. 值对象应该提供有意义的字符串表示
    toString(): string {
      return this.value;
    }
  }

  // 4. 值对象可以包含验证逻辑
  export class TenantName {
    private readonly value: string;

    constructor(value: string) {
      this.validate(value);
      this.value = value.trim();
    }

    private validate(value: string): void {
      if (!value || value.length < 2 || value.length > 100) {
        throw new InvalidTenantNameException(value);
      }
      
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_]+$/.test(value)) {
        throw new InvalidTenantNameException(value);
      }
    }

    getValue(): string {
      return this.value;
    }

    equals(other: TenantName): boolean {
      return this.value === other.value;
    }

    toString(): string {
      return this.value;
    }
  }

  // 5. 值对象可以包含业务计算
  export class Password {
    private readonly value: string;
    private readonly hashedValue: string;

    constructor(value: string) {
      this.validate(value);
      this.value = value;
      this.hashedValue = this.hashPassword(value);
    }

    private validate(value: string): void {
      if (!value || value.length < 8) {
        throw new InvalidPasswordException('Password must be at least 8 characters');
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        throw new InvalidPasswordException('Password must contain uppercase, lowercase and number');
      }
    }

    private hashPassword(password: string): string {
      return bcrypt.hashSync(password, 10);
    }

    verifyPassword(password: string): boolean {
      return bcrypt.compareSync(password, this.hashedValue);
    }

    getHashedValue(): string {
      return this.hashedValue;
    }
  }
}
```

#### 2.2.3 聚合根设计
```typescript
/**
 * @description 聚合根设计注意事项
 */
export class AggregateRootDesignGuidelines {
  // 1. 聚合根是聚合的入口点
  export class Tenant extends EventSourcedAggregate {
    private id: TenantId;
    private name: TenantName;
    private code: TenantCode;
    private status: TenantStatus;
    private adminId: UserId;
    private config: TenantConfig;
    private users: Map<UserId, User> = new Map();

    // 2. 聚合根保护内部实体
    addUser(user: User): void {
      if (this.users.has(user.getId())) {
        throw new UserAlreadyExistsException(user.getId().value);
      }

      if (user.getTenantId() && !user.getTenantId().equals(this.id)) {
        throw new UserBelongsToDifferentTenantException(user.getId().value);
      }

      this.users.set(user.getId(), user);
      this.apply(new UserAddedToTenantEvent(this.id.value, user.getId().value));
    }

    removeUser(userId: UserId): void {
      if (!this.users.has(userId)) {
        throw new UserNotFoundException(userId.value);
      }

      this.users.delete(userId);
      this.apply(new UserRemovedFromTenantEvent(this.id.value, userId.value));
    }

    // 3. 聚合根提供业务操作
    rename(newName: TenantName): void {
      if (this.name.equals(newName)) {
        return;
      }

      this.apply(new TenantRenamedEvent(this.id.value, this.name.value, newName.value));
    }

    changeStatus(newStatus: TenantStatus, reason: string): void {
      if (this.status === newStatus) {
        return;
      }

      // 业务规则：不能将活跃租户直接设为删除状态
      if (this.status === TenantStatus.ACTIVE && newStatus === TenantStatus.DELETED) {
        throw new InvalidTenantStatusTransitionException(this.status, newStatus);
      }

      this.apply(new TenantStatusChangedEvent(this.id.value, this.status, newStatus, reason));
    }

    // 4. 聚合根确保一致性
    changeAdmin(newAdminId: UserId): void {
      // 确保新管理员属于当前租户
      if (!this.users.has(newAdminId)) {
        throw new UserNotFoundException(newAdminId.value);
      }

      const oldAdminId = this.adminId;
      this.adminId = newAdminId;
      
      this.apply(new TenantAdminChangedEvent(
        this.id.value,
        oldAdminId.value,
        newAdminId.value
      ));
    }

    // 5. 聚合根提供查询方法
    getUserCount(): number {
      return this.users.size;
    }

    hasUser(userId: UserId): boolean {
      return this.users.has(userId);
    }

    getUsers(): ReadonlyMap<UserId, User> {
      return this.users;
    }
  }
}
```

### 2.3 领域服务设计

#### 2.3.1 领域服务的使用场景
```typescript
/**
 * @description 领域服务的使用场景
 */
export class DomainServiceGuidelines {
  // 1. 跨聚合的业务逻辑
  export class TenantDomainService {
    constructor(
      private readonly tenantRepository: TenantRepository,
      private readonly userRepository: UserRepository
    ) {}

    async transferUserBetweenTenants(
      userId: UserId,
      fromTenantId: TenantId,
      toTenantId: TenantId,
      reason: string
    ): Promise<void> {
      // 获取源租户和目标租户
      const fromTenant = await this.tenantRepository.findById(fromTenantId);
      const toTenant = await this.tenantRepository.findById(toTenantId);
      const user = await this.userRepository.findById(userId);

      if (!fromTenant || !toTenant || !user) {
        throw new EntityNotFoundException('Tenant or User not found');
      }

      // 业务规则：用户必须属于源租户
      if (!user.getTenantId().equals(fromTenantId)) {
        throw new UserNotBelongToTenantException(userId.value, fromTenantId.value);
      }

      // 业务规则：目标租户必须处于活跃状态
      if (toTenant.getStatus() !== TenantStatus.ACTIVE) {
        throw new TenantNotActiveException(toTenantId.value);
      }

      // 执行租户变更
      fromTenant.removeUser(userId);
      toTenant.addUser(user);
      user.changeTenant(toTenantId, reason);

      // 保存变更
      await this.tenantRepository.save(fromTenant);
      await this.tenantRepository.save(toTenant);
      await this.userRepository.save(user);
    }
  }

  // 2. 复杂的业务计算
  export class PermissionDomainService {
    calculateEffectivePermissions(user: User, roles: Role[]): Set<PermissionId> {
      const effectivePermissions = new Set<PermissionId>();

      // 收集所有角色的权限
      for (const role of roles) {
        for (const permission of role.getPermissions()) {
          effectivePermissions.add(permission);
        }
      }

      // 应用权限继承规则
      this.applyInheritanceRules(effectivePermissions);

      // 应用权限冲突解决规则
      this.resolvePermissionConflicts(effectivePermissions);

      return effectivePermissions;
    }

    private applyInheritanceRules(permissions: Set<PermissionId>): void {
      // 实现权限继承逻辑
    }

    private resolvePermissionConflicts(permissions: Set<PermissionId>): void {
      // 实现权限冲突解决逻辑
    }
  }

  // 3. 外部依赖的业务逻辑
  export class TenantApplicationDomainService {
    constructor(
      private readonly tenantRepository: TenantRepository,
      private readonly notificationService: NotificationService,
      private readonly auditService: AuditService
    ) {}

    async processTenantApplication(application: TenantApplication): Promise<void> {
      // 业务规则验证
      this.validateApplication(application);

      // 检查租户代码唯一性
      const existingTenant = await this.tenantRepository.findByCode(application.tenantCode);
      if (existingTenant) {
        throw new TenantCodeAlreadyExistsException(application.tenantCode.value);
      }

      // 创建租户
      const tenant = Tenant.create(
        application.tenantId,
        application.tenantCode,
        application.tenantName,
        application.adminId
      );

      // 保存租户
      await this.tenantRepository.save(tenant);

      // 发送通知
      await this.notificationService.sendTenantCreatedNotification(
        application.adminId,
        application.tenantName
      );

      // 记录审计日志
      await this.auditService.logTenantCreation(
        tenant.getId(),
        application.adminId,
        application.tenantName
      );
    }

    private validateApplication(application: TenantApplication): void {
      // 实现申请验证逻辑
    }
  }
}
```

### 2.4 领域事件设计

#### 2.4.1 领域事件的使用
```typescript
/**
 * @description 领域事件设计注意事项
 */
export class DomainEventGuidelines {
  // 1. 事件应该表示已发生的事实
  export class TenantCreatedEvent extends BaseEvent {
    constructor(
      aggregateId: string,
      public readonly tenantCode: string,
      public readonly tenantName: string,
      public readonly adminId: string,
      metadata?: Partial<EventMetadata>
    ) {
      super(aggregateId, 'TenantCreated', 1, metadata);
    }
  }

  // 2. 事件应该包含足够的信息
  export class UserTenantChangedEvent extends BaseEvent {
    constructor(
      aggregateId: string,
      public readonly oldTenantId: string,
      public readonly newTenantId: string,
      public readonly reason: string,
      public readonly changedAt: Date,
      metadata?: Partial<EventMetadata>
    ) {
      super(aggregateId, 'UserTenantChanged', 1, metadata);
    }
  }

  // 3. 事件应该在聚合根中发布
  export class Tenant extends EventSourcedAggregate {
    rename(newName: TenantName): void {
      if (this.name.equals(newName)) {
        return;
      }

      // 发布事件
      this.apply(new TenantRenamedEvent(
        this.id.value,
        this.name.value,
        newName.value
      ));
    }

    changeStatus(newStatus: TenantStatus, reason: string): void {
      if (this.status === newStatus) {
        return;
      }

      // 发布事件
      this.apply(new TenantStatusChangedEvent(
        this.id.value,
        this.status,
        newStatus,
        reason
      ));
    }
  }
}
```

### 2.5 仓储接口设计

#### 2.5.1 仓储接口规范
```typescript
/**
 * @description 仓储接口设计注意事项
 */
export class RepositoryInterfaceGuidelines {
  // 1. 仓储接口应该定义在领域层
  export interface TenantRepository {
    findById(id: TenantId): Promise<Tenant | null>;
    findByCode(code: TenantCode): Promise<Tenant | null>;
    save(tenant: Tenant): Promise<void>;
    delete(id: TenantId): Promise<void>;
    exists(id: TenantId): Promise<boolean>;
  }

  export interface UserRepository {
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByTenantId(tenantId: TenantId): Promise<User[]>;
    save(user: User): Promise<void>;
    delete(id: UserId): Promise<void>;
    exists(id: UserId): Promise<boolean>;
  }

  export interface RoleRepository {
    findById(id: RoleId): Promise<Role | null>;
    findByTenantId(tenantId: TenantId): Promise<Role[]>;
    save(role: Role): Promise<void>;
    delete(id: RoleId): Promise<void>;
    exists(id: RoleId): Promise<boolean>;
  }

  // 2. 仓储接口应该使用领域对象
  export interface PermissionRepository {
    findById(id: PermissionId): Promise<Permission | null>;
    findByRoleId(roleId: RoleId): Promise<Permission[]>;
    save(permission: Permission): Promise<void>;
    delete(id: PermissionId): Promise<void>;
  }

  // 3. 仓储接口应该支持查询规范
  export interface TenantRepository {
    findById(id: TenantId): Promise<Tenant | null>;
    findByCode(code: TenantCode): Promise<Tenant | null>;
    findByStatus(status: TenantStatus): Promise<Tenant[]>;
    findByAdminId(adminId: UserId): Promise<Tenant[]>;
    findActiveTenants(): Promise<Tenant[]>;
    countByStatus(status: TenantStatus): Promise<number>;
  }
}
```

---

## 🔧 开发最佳实践

### 3.1 代码组织

#### 3.1.1 目录结构
```
apps/api/src/
├── shared/
│   └── domain/
│       ├── entities/
│       │   └── base.entity.ts
│       ├── value-objects/
│       │   ├── email.vo.ts
│       │   ├── tenant-name.vo.ts
│       │   └── password.vo.ts
│       ├── events/
│       │   ├── base-event.ts
│       │   └── event-metadata.ts
│       ├── repositories/
│       │   └── base-repository.interface.ts
│       ├── services/
│       │   └── domain-service.interface.ts
│       └── exceptions/
│           └── domain.exception.ts
│
├── modules/
│   ├── tenant-management/
│   │   └── domain/
│   │       ├── entities/
│   │       │   └── tenant.entity.ts
│   │       ├── value-objects/
│   │       │   ├── tenant-id.vo.ts
│   │       │   ├── tenant-code.vo.ts
│   │       │   └── tenant-config.vo.ts
│   │       ├── events/
│   │       │   ├── tenant-created.event.ts
│   │       │   ├── tenant-renamed.event.ts
│   │       │   └── tenant-status-changed.event.ts
│   │       ├── repositories/
│   │       │   └── tenant.repository.interface.ts
│   │       ├── services/
│   │       │   └── tenant-domain.service.ts
│   │       └── exceptions/
│   │           ├── tenant-not-found.exception.ts
│   │           └── invalid-tenant-status.exception.ts
│   │
│   ├── user-management/
│   │   └── domain/
│   │       ├── entities/
│   │       │   └── user.entity.ts
│   │       ├── value-objects/
│   │       │   ├── user-id.vo.ts
│   │       │   ├── username.vo.ts
│   │       │   └── user-profile.vo.ts
│   │       ├── events/
│   │       │   ├── user-created.event.ts
│   │       │   ├── user-activated.event.ts
│   │       │   └── user-tenant-changed.event.ts
│   │       ├── repositories/
│   │       │   └── user.repository.interface.ts
│   │       ├── services/
│   │       │   └── user-domain.service.ts
│   │       └── exceptions/
│   │           ├── user-not-found.exception.ts
│   │           └── user-already-active.exception.ts
│   │
│   └── permission-management/
│       └── domain/
│           ├── entities/
│           │   ├── role.entity.ts
│           │   └── permission.entity.ts
│           ├── value-objects/
│           │   ├── role-id.vo.ts
│           │   ├── role-name.vo.ts
│           │   ├── permission-id.vo.ts
│           │   └── permission-name.vo.ts
│           ├── events/
│           │   ├── role-created.event.ts
│           │   ├── user-role-assigned.event.ts
│           │   └── permission-added-to-role.event.ts
│           ├── repositories/
│           │   ├── role.repository.interface.ts
│           │   └── permission.repository.interface.ts
│           ├── services/
│           │   └── permission-domain.service.ts
│           └── exceptions/
│               ├── role-not-found.exception.ts
│               └── permission-not-found.exception.ts
```

#### 3.1.2 命名规范
```typescript
/**
 * @description 命名规范
 */
export class NamingConventions {
  // 1. 实体命名
  export class Tenant {} // 单数形式，表示一个租户
  export class User {} // 单数形式，表示一个用户
  export class Role {} // 单数形式，表示一个角色

  // 2. 值对象命名
  export class TenantId {} // 实体ID值对象
  export class TenantName {} // 实体属性值对象
  export class Email {} // 通用值对象

  // 3. 事件命名
  export class TenantCreatedEvent {} // 过去时态，表示已发生的事件
  export class UserActivatedEvent {} // 过去时态
  export class RoleAssignedEvent {} // 过去时态

  // 4. 仓储接口命名
  export interface TenantRepository {} // 实体名 + Repository
  export interface UserRepository {} // 实体名 + Repository
  export interface RoleRepository {} // 实体名 + Repository

  // 5. 领域服务命名
  export class TenantDomainService {} // 实体名 + DomainService
  export class UserDomainService {} // 实体名 + DomainService
  export class PermissionDomainService {} // 实体名 + DomainService

  // 6. 异常命名
  export class TenantNotFoundException {} // 实体名 + 异常类型
  export class InvalidTenantNameException {} // 异常类型 + 实体名
  export class UserAlreadyActiveException {} // 实体名 + 异常类型
}
```

### 3.2 测试策略

#### 3.2.1 单元测试
```typescript
/**
 * @description 领域层单元测试
 */
export class DomainLayerTesting {
  // 1. 实体测试
  describe('Tenant Entity', () => {
    it('should create tenant with valid data', () => {
      const tenantId = new TenantId('tenant-1');
      const tenantCode = new TenantCode('TENANT001');
      const tenantName = new TenantName('Test Tenant');
      const adminId = new UserId('admin-1');

      const tenant = Tenant.create(tenantId, tenantCode, tenantName, adminId);

      expect(tenant.getId()).toEqual(tenantId);
      expect(tenant.getCode()).toEqual(tenantCode);
      expect(tenant.getName()).toEqual(tenantName);
      expect(tenant.getStatus()).toEqual(TenantStatus.ACTIVE);
    });

    it('should throw exception when renaming with invalid name', () => {
      const tenant = createTestTenant();
      const invalidName = new TenantName(''); // 空名称

      expect(() => tenant.rename(invalidName)).toThrow(InvalidTenantNameException);
    });

    it('should publish event when status changes', () => {
      const tenant = createTestTenant();
      const newStatus = TenantStatus.SUSPENDED;
      const reason = 'Violation of terms';

      tenant.changeStatus(newStatus, reason);

      const events = tenant.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TenantStatusChangedEvent);
      expect(events[0].newStatus).toEqual(newStatus);
      expect(events[0].reason).toEqual(reason);
    });
  });

  // 2. 值对象测试
  describe('Email Value Object', () => {
    it('should create email with valid format', () => {
      const emailValue = 'test@example.com';
      const email = new Email(emailValue);

      expect(email.getValue()).toEqual(emailValue);
    });

    it('should throw exception with invalid email format', () => {
      const invalidEmail = 'invalid-email';

      expect(() => new Email(invalidEmail)).toThrow(InvalidEmailException);
    });

    it('should be equal when values are same', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');

      expect(email1.equals(email2)).toBe(true);
    });
  });

  // 3. 领域服务测试
  describe('TenantDomainService', () => {
    it('should transfer user between tenants successfully', async () => {
      const service = new TenantDomainService(mockTenantRepo, mockUserRepo);
      const userId = new UserId('user-1');
      const fromTenantId = new TenantId('tenant-1');
      const toTenantId = new TenantId('tenant-2');

      await service.transferUserBetweenTenants(userId, fromTenantId, toTenantId, 'Business need');

      expect(mockTenantRepo.save).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw exception when user not belongs to source tenant', async () => {
      const service = new TenantDomainService(mockTenantRepo, mockUserRepo);
      const userId = new UserId('user-1');
      const fromTenantId = new TenantId('tenant-1');
      const toTenantId = new TenantId('tenant-2');

      // 模拟用户不属于源租户
      mockUserRepo.findById.mockResolvedValue(createUserWithDifferentTenant());

      await expect(
        service.transferUserBetweenTenants(userId, fromTenantId, toTenantId, 'Business need')
      ).rejects.toThrow(UserNotBelongToTenantException);
    });
  });
}
```

### 3.3 异常处理

#### 3.3.1 领域异常设计
```typescript
/**
 * @description 领域异常设计
 */
export class DomainExceptionGuidelines {
  // 1. 基础领域异常
  export abstract class DomainException extends Error {
    constructor(message: string) {
      super(message);
      this.name = this.constructor.name;
    }
  }

  // 2. 实体相关异常
  export class EntityNotFoundException extends DomainException {
    constructor(entityName: string, id: string) {
      super(`${entityName} with id ${id} not found`);
    }
  }

  export class EntityAlreadyExistsException extends DomainException {
    constructor(entityName: string, id: string) {
      super(`${entityName} with id ${id} already exists`);
    }
  }

  // 3. 业务规则异常
  export class BusinessRuleViolationException extends DomainException {
    constructor(ruleName: string, details: string) {
      super(`Business rule violation: ${ruleName} - ${details}`);
    }
  }

  export class InvalidStateTransitionException extends DomainException {
    constructor(fromState: string, toState: string) {
      super(`Invalid state transition from ${fromState} to ${toState}`);
    }
  }

  // 4. 值对象异常
  export class InvalidValueException extends DomainException {
    constructor(valueName: string, value: any, reason: string) {
      super(`Invalid ${valueName}: ${value} - ${reason}`);
    }
  }

  // 5. 具体业务异常
  export class TenantNotFoundException extends EntityNotFoundException {
    constructor(tenantId: string) {
      super('Tenant', tenantId);
    }
  }

  export class InvalidTenantNameException extends InvalidValueException {
    constructor(name: string) {
      super('tenant name', name, 'must be 2-100 characters and contain only letters, numbers, spaces, hyphens and underscores');
    }
  }

  export class UserAlreadyActiveException extends DomainException {
    constructor(userId: string) {
      super(`User ${userId} is already active`);
    }
  }

  export class TenantNotActiveException extends DomainException {
    constructor(tenantId: string) {
      super(`Tenant ${tenantId} is not active`);
    }
  }
}
```

---

## ⚠️ 常见陷阱

### 4.1 架构陷阱

#### 4.1.1 依赖外部层
```typescript
/**
 * @description 避免在领域层依赖外部层
 */
export class ArchitecturePitfalls {
  // ❌ 错误：领域层依赖基础设施层
  // import { PostgresTenantRepository } from '../infrastructure';
  // import { EmailService } from '../application';

  // ✅ 正确：领域层只定义接口
  export interface TenantRepository {
    findById(id: TenantId): Promise<Tenant | null>;
    save(tenant: Tenant): Promise<void>;
  }

  // ✅ 正确：领域层不依赖具体实现
  export class Tenant extends EventSourcedAggregate {
    // 业务逻辑实现
  }
}
```

#### 4.1.2 贫血模型
```typescript
/**
 * @description 避免贫血模型
 */
export class AnemicModelPitfalls {
  // ❌ 错误：贫血模型 - 只有数据，没有行为
  export class Tenant {
    public id: string;
    public name: string;
    public status: string;
    public adminId: string;
    
    // 没有业务方法
  }

  // ✅ 正确：充血模型 - 包含业务逻辑
  export class Tenant extends EventSourcedAggregate {
    private id: TenantId;
    private name: TenantName;
    private status: TenantStatus;
    private adminId: UserId;

    rename(newName: TenantName): void {
      if (this.name.equals(newName)) {
        return;
      }

      this.apply(new TenantRenamedEvent(
        this.id.value,
        this.name.value,
        newName.value
      ));
    }

    changeStatus(newStatus: TenantStatus, reason: string): void {
      if (this.status === newStatus) {
        return;
      }

      this.apply(new TenantStatusChangedEvent(
        this.id.value,
        this.status,
        newStatus,
        reason
      ));
    }
  }
}
```

### 4.2 设计陷阱

#### 4.2.1 过度设计
```typescript
/**
 * @description 避免过度设计
 */
export class OverDesignPitfalls {
  // ❌ 错误：过度抽象
  export interface IEntity<TId> {
    getId(): TId;
  }

  export interface IAggregateRoot<TId> extends IEntity<TId> {
    getVersion(): number;
  }

  export interface IEventSourcedAggregate<TId> extends IAggregateRoot<TId> {
    getUncommittedEvents(): BaseEvent[];
  }

  // ✅ 正确：适度抽象
  export abstract class EventSourcedAggregate {
    private uncommittedEvents: BaseEvent[] = [];
    private version: number = 0;

    protected apply(event: BaseEvent): void {
      this.uncommittedEvents.push(event);
      this.when(event);
    }

    getUncommittedEvents(): BaseEvent[] {
      return [...this.uncommittedEvents];
    }

    getVersion(): number {
      return this.version;
    }

    protected abstract when(event: BaseEvent): void;
    abstract getId(): string;
  }
}
```

#### 4.2.2 违反封装
```typescript
/**
 * @description 避免违反封装
 */
export class EncapsulationPitfalls {
  // ❌ 错误：暴露内部状态
  export class Tenant {
    public id: string;
    public name: string;
    public status: string;
    public adminId: string;
    public users: User[] = []; // 直接暴露集合
  }

  // ✅ 正确：保护内部状态
  export class Tenant extends EventSourcedAggregate {
    private id: TenantId;
    private name: TenantName;
    private status: TenantStatus;
    private adminId: UserId;
    private users: Map<UserId, User> = new Map();

    addUser(user: User): void {
      if (this.users.has(user.getId())) {
        throw new UserAlreadyExistsException(user.getId().value);
      }

      this.users.set(user.getId(), user);
      this.apply(new UserAddedToTenantEvent(this.id.value, user.getId().value));
    }

    removeUser(userId: UserId): void {
      if (!this.users.has(userId)) {
        throw new UserNotFoundException(userId.value);
      }

      this.users.delete(userId);
      this.apply(new UserRemovedFromTenantEvent(this.id.value, userId.value));
    }

    // 提供只读访问
    getUserCount(): number {
      return this.users.size;
    }

    hasUser(userId: UserId): boolean {
      return this.users.has(userId);
    }

    getUsers(): ReadonlyMap<UserId, User> {
      return this.users;
    }
  }
}
```

---

## 📋 开发检查清单

### 5.1 架构检查

- [ ] 领域层不依赖其他层
- [ ] 所有外部依赖都通过接口抽象
- [ ] 实体、值对象、聚合根定义清晰
- [ ] 领域服务职责明确
- [ ] 仓储接口定义在领域层

### 5.2 设计检查

- [ ] 实体包含业务逻辑
- [ ] 值对象不可变且自验证
- [ ] 聚合根保护内部状态
- [ ] 领域事件表示已发生的事实
- [ ] 异常类型丰富且有意义

### 5.3 代码质量检查

- [ ] 命名规范统一
- [ ] 代码结构清晰
- [ ] 单元测试覆盖充分
- [ ] 异常处理完善
- [ ] 文档注释完整

### 5.4 业务逻辑检查

- [ ] 业务规则完整实现
- [ ] 状态转换逻辑正确
- [ ] 约束验证充分
- [ ] 事件发布时机正确
- [ ] 一致性保证机制

---

## 🎯 总结

领域层开发是DDD和Clean Architecture的核心，需要特别注意：

1. **架构纯净性**: 保持领域层不依赖其他层
2. **业务完整性**: 完整实现业务逻辑和规则
3. **设计合理性**: 合理设计实体、值对象、聚合根
4. **代码质量**: 保持高代码质量和测试覆盖
5. **文档完善**: 建立完善的开发文档

通过遵循这些指导原则，可以构建出高质量、可维护、可扩展的领域层，为整个系统奠定坚实的基础。
