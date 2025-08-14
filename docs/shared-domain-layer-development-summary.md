# 共享领域层开发总结

## 概述

共享领域层是DDD（领域驱动设计）和Clean Architecture（整洁架构）的核心基础，提供了所有业务模块都可以使用的领域组件。该层完全独立于外部依赖，包含纯业务逻辑。

## 架构设计

### 分层原则
- **纯业务逻辑**: 不依赖任何外部框架或技术
- **领域驱动**: 基于业务概念和规则设计
- **聚合设计**: 通过聚合根管理业务一致性
- **事件驱动**: 通过领域事件实现松耦合

### 目录结构
```
apps/api/src/shared/domain/
├── entities/                    # 实体定义
│   ├── base.entity.ts          # 基础实体
│   └── event-sourced-aggregate.ts # 事件溯源聚合根
├── value-objects/              # 值对象
│   └── base.value-object.ts    # 值对象基类
├── events/                     # 领域事件
│   ├── base.event.ts           # 事件基类
│   └── event-handler.interface.ts # 事件处理器接口
├── repositories/               # 仓储接口
│   ├── event-store.interface.ts # 事件存储接口
│   └── snapshot-manager.interface.ts # 快照管理接口
├── exceptions/                 # 领域异常
│   └── domain.exception.ts     # 异常基类
├── event-sourcing/             # 事件溯源工具（待完善）
├── examples/                   # 示例实现
│   ├── tenant.example.ts       # 租户聚合根示例
│   └── tenant.example.spec.ts  # 租户示例测试
└── index.ts                    # 导出文件
```

## 已完成的核心组件

### 1. 实体 (Entities)

#### 1.1 BaseEntity - 基础实体
- **文件**: `entities/base.entity.ts`
- **功能**: 所有领域实体的基类
- **特性**:
  - 唯一标识管理（支持泛型ID类型）
  - 时间戳管理（创建时间、更新时间）
  - 实体状态管理（新建、删除状态）
  - 相等性比较
  - 验证能力
  - 序列化支持
  - UUID自动生成

#### 1.2 EventSourcedAggregate - 事件溯源聚合根
- **文件**: `entities/event-sourced-aggregate.ts`
- **功能**: 事件溯源聚合根基类
- **特性**:
  - 事件管理（收集、存储、应用）
  - 状态重建（从事件历史重建）
  - 版本控制（乐观锁支持）
  - 快照支持
  - 事件处理器注册
  - 并发控制

### 2. 值对象 (Value Objects)

#### 2.1 BaseValueObject - 值对象基类
- **文件**: `value-objects/base.value-object.ts`
- **功能**: 所有值对象的基类
- **特性**:
  - 不可变性保证
  - 相等性比较
  - 验证能力
  - 序列化能力
  - 克隆能力

#### 2.2 具体值对象类型
- **StringValueObject**: 字符串值对象基类
  - 自动去除首尾空格
  - 长度检查
  - 字符串操作（大小写转换）
- **NumberValueObject**: 数字值对象基类
  - 数学运算（加减乘除）
  - 数值检查（正数、负数、零）
- **BooleanValueObject**: 布尔值对象基类
  - 逻辑运算（与、或、非）
  - 布尔值检查

### 3. 领域事件 (Domain Events)

#### 3.1 BaseEvent - 事件基类
- **文件**: `events/base.event.ts`
- **功能**: 所有领域事件的基类
- **特性**:
  - 事件元数据管理
  - 事件版本控制
  - 事件序列化
  - 事件验证
  - 请求上下文追踪

#### 3.2 事件类型
- **DomainEvent**: 领域事件抽象类
  - 用于领域内事件通知
  - 支持聚合根状态变更
- **IntegrationEvent**: 集成事件抽象类
  - 用于跨边界上下文通信
  - 支持外部系统集成

#### 3.3 事件处理器
- **文件**: `events/event-handler.interface.ts`
- **功能**: 事件处理机制
- **特性**:
  - 事件处理器接口
  - 事件处理器注册表
  - 事件发布器
  - 事件总线
  - 处理结果管理

### 4. 仓储接口 (Repository Interfaces)

#### 4.1 EventStore - 事件存储接口
- **文件**: `repositories/event-store.interface.ts`
- **功能**: 事件存储的基本契约
- **特性**:
  - 事件存储和检索
  - 版本控制支持
  - 事件查询功能
  - 聚合根管理
  - 乐观锁支持

#### 4.2 SnapshotManager - 快照管理接口
- **文件**: `repositories/snapshot-manager.interface.ts`
- **功能**: 聚合根快照管理
- **特性**:
  - 快照创建和存储
  - 快照恢复
  - 快照清理
  - 性能优化
  - 版本管理

### 5. 领域异常 (Domain Exceptions)

#### 5.1 DomainException - 异常基类
- **文件**: `exceptions/domain.exception.ts`
- **功能**: 所有领域异常的基类
- **特性**:
  - 统一异常结构
  - 错误码支持
  - 异常上下文
  - 异常链支持
  - 国际化支持

#### 5.2 具体异常类型
- **ValidationException**: 验证异常
- **BusinessRuleException**: 业务规则异常
- **EntityNotFoundException**: 实体未找到异常
- **ConcurrencyException**: 并发异常
- **UnauthorizedException**: 未授权异常
- **InvalidOperationException**: 无效操作异常
- **DomainEventException**: 领域事件异常
- **AggregateNotFoundException**: 聚合根未找到异常
- **EventStoreException**: 事件存储异常
- **SnapshotException**: 快照异常

### 6. 示例实现 (Examples)

#### 6.1 Tenant示例
- **文件**: `examples/tenant.example.ts`
- **功能**: 完整的租户聚合根示例
- **特性**:
  - 租户值对象（名称、代码）
  - 租户状态枚举
  - 租户事件（创建、重命名、状态变更）
  - 租户业务逻辑
  - 完整的事件溯源实现

## 设计模式应用

### 1. 聚合模式 (Aggregate Pattern)
- 通过EventSourcedAggregate实现聚合根
- 确保业务一致性边界
- 支持并发控制

### 2. 值对象模式 (Value Object Pattern)
- 通过值对象基类实现不可变性
- 确保相等性比较
- 支持业务规则验证

### 3. 领域事件模式 (Domain Event Pattern)
- 通过事件基类实现事件驱动
- 支持松耦合架构
- 实现事件溯源

### 4. 仓储模式 (Repository Pattern)
- 通过接口定义数据访问抽象
- 支持多种存储实现
- 实现依赖倒置

### 5. 异常模式 (Exception Pattern)
- 通过异常基类实现统一异常处理
- 支持异常分类和错误码
- 提供丰富的上下文信息

## 使用示例

### 1. 创建聚合根
```typescript
import { EventSourcedAggregate } from '@shared/domain';

export class Tenant extends EventSourcedAggregate {
  private _name: string;
  private _code: string;
  private _status: TenantStatus;

  constructor(id: string, name: string, code: string) {
    super(id);
    this.applyEvent(new TenantCreatedEvent(id, name, code));
  }

  rename(newName: string): void {
    this.applyEvent(new TenantRenamedEvent(this.id, this._name, newName));
  }

  // 事件处理器
  private onTenantCreated(event: TenantCreatedEvent): void {
    this._name = event.name;
    this._code = event.code;
    this._status = TenantStatus.ACTIVE;
  }

  private onTenantRenamed(event: TenantRenamedEvent): void {
    this._name = event.newName;
  }
}
```

### 2. 创建值对象
```typescript
import { StringValueObject } from '@shared/domain';

export class Email extends StringValueObject {
  protected isValidValue(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return super.isValidValue(value) && emailRegex.test(value);
  }
}
```

### 3. 创建领域事件
```typescript
import { DomainEvent } from '@shared/domain';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly name: string
  ) {
    super(aggregateId, 'User', 1);
  }

  protected getEventData(): Record<string, any> {
    return {
      email: this.email,
      name: this.name,
    };
  }
}
```

## 下一步计划

### 1. 完善事件溯源工具
- [ ] 添加事件溯源工具类
- [ ] 实现事件重放工具
- [ ] 添加事件版本迁移工具
- [ ] 实现事件投影工具

### 2. 增强现有组件
- [ ] 添加更多值对象类型（日期、货币等）
- [ ] 增强事件元数据支持
- [ ] 添加事件订阅机制
- [ ] 实现事件过滤器

### 3. 测试和文档
- [ ] 完善单元测试覆盖
- [ ] 添加集成测试
- [ ] 创建更多示例
- [ ] 完善API文档

## 总结

共享领域层为整个IAM系统提供了：

1. **统一的领域模型**: 所有业务模块都基于相同的领域概念
2. **事件溯源支持**: 完整的事件溯源架构支持
3. **类型安全**: 强类型支持，减少运行时错误
4. **可测试性**: 纯业务逻辑，易于单元测试
5. **可扩展性**: 基于接口设计，支持多种实现
6. **一致性**: 统一的异常处理和验证机制

通过严格遵循DDD原则，共享领域层确保了业务逻辑的清晰性和一致性，为后续的业务模块开发提供了坚实的基础。
