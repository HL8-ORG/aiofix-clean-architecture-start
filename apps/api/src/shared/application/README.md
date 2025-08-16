# CQRS 基础设施

## 概述

本目录包含了完整的CQRS（Command Query Responsibility Segregation）架构基础设施，为整个IAM系统提供了命令和查询分离的基础架构。

## 目录结构

```
shared/application/
├── interfaces/                    # 接口定义
│   ├── command.interface.ts      # 命令接口
│   ├── query.interface.ts        # 查询接口
│   ├── command-handler.interface.ts  # 命令处理器接口
│   ├── query-handler.interface.ts    # 查询处理器接口
│   ├── command-bus.interface.ts  # 命令总线接口
│   └── query-bus.interface.ts    # 查询总线接口
├── base/                         # 基础抽象类
│   ├── base-command.ts           # 基础命令类
│   ├── base-query.ts             # 基础查询类
│   ├── base-command-handler.ts   # 基础命令处理器类
│   └── base-query-handler.ts     # 基础查询处理器类
├── bus/                          # 总线实现
│   ├── command-bus.ts            # 命令总线实现
│   ├── query-bus.ts              # 查询总线实现
│   └── command-bus.spec.ts       # 命令总线测试
├── factories/                    # 工厂类
│   └── application-module-factory.ts  # 应用层模块工厂
├── shared-application.module.ts  # 共享应用层模块
├── cqrs-infrastructure.spec.ts   # CQRS基础设施集成测试
├── simple-cqrs-test.spec.ts      # 简单CQRS测试
└── README.md                     # 本文档
```

## 核心组件

### 1. 接口层 (Interfaces)

#### ICommand
- 定义命令对象的基础契约
- 包含命令ID、类型、时间戳、用户ID、租户ID、关联ID等元数据
- 支持命令验证和序列化

#### IQuery
- 定义查询对象的基础契约
- 包含查询ID、类型、时间戳、用户ID、租户ID、关联ID等元数据
- 支持查询验证、缓存和序列化

#### ICommandHandler
- 定义命令处理器的契约
- 包含execute方法和commandType属性
- 支持依赖注入和异常处理

#### IQueryHandler
- 定义查询处理器的契约
- 包含execute方法和queryType属性
- 支持依赖注入、权限检查和缓存

#### ICommandBus
- 定义命令总线的契约
- 支持命令的注册、注销、执行和路由
- 提供统一的异常处理和日志记录

#### IQueryBus
- 定义查询总线的契约
- 支持查询的注册、注销、执行和路由
- 提供缓存管理和权限验证

### 2. 基础抽象类 (Base Classes)

#### BaseCommand
- 提供命令对象的通用实现
- 自动生成命令ID和时间戳
- 支持元数据管理和序列化
- 提供验证框架

#### BaseQuery
- 提供查询对象的通用实现
- 自动生成查询ID和时间戳
- 支持元数据管理和序列化
- 提供缓存键生成

#### BaseCommandHandler
- 提供命令处理器的通用实现
- 实现模板方法模式
- 提供统一的日志记录和异常处理
- 支持命令验证和权限检查

#### BaseQueryHandler
- 提供查询处理器的通用实现
- 实现模板方法模式
- 提供统一的日志记录和异常处理
- 支持查询验证、权限检查和缓存

### 3. 总线实现 (Bus Implementations)

#### CommandBus
- 实现命令的路由和执行
- 支持处理器的动态注册和注销
- 提供统一的异常处理和日志记录
- 支持命令执行的监控和追踪

#### QueryBus
- 实现查询的路由和执行
- 支持处理器的动态注册和注销
- 提供查询结果缓存
- 支持权限验证和监控

### 4. 工厂类 (Factories)

#### ApplicationModuleFactory
- 提供动态模块创建功能
- 支持CQRS组件的自动注册
- 提供多种模块配置选项
- 支持全局模块和自定义提供者

## 使用示例

### 创建命令

```typescript
import { BaseCommand } from '@/shared/application/base/base-command';

class CreateUserCommand extends BaseCommand {
  public readonly commandType = 'CreateUserCommand';
  public readonly email: string;
  public readonly username: string;

  constructor(email: string, username: string, options?: { userId?: string; tenantId?: string }) {
    super(options);
    this.email = email;
    this.username = username;
  }

  public validate(): boolean {
    return this.email && this.username && this.email.length > 0 && this.username.length > 0;
  }
}
```

### 创建命令处理器

```typescript
import { BaseCommandHandler } from '@/shared/application/base/base-command-handler';
import { CreateUserCommand } from './create-user.command';

export class CreateUserHandler extends BaseCommandHandler<CreateUserCommand, string> {
  public readonly commandType = 'CreateUserCommand';

  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  protected async handleCommand(command: CreateUserCommand): Promise<string> {
    const user = new User(command.email, command.username);
    await this.userRepository.save(user);
    return user.id;
  }
}
```

### 创建查询

```typescript
import { BaseQuery } from '@/shared/application/base/base-query';

class GetUserQuery extends BaseQuery<User> {
  public readonly queryType = 'GetUserQuery';
  public readonly userId: string;

  constructor(userId: string, options?: { userId?: string; tenantId?: string }) {
    super(options);
    this.userId = userId;
  }

  public validate(): boolean {
    return this.userId && this.userId.length > 0;
  }
}
```

### 创建查询处理器

```typescript
import { BaseQueryHandler } from '@/shared/application/base/base-query-handler';
import { GetUserQuery } from './get-user.query';

export class GetUserHandler extends BaseQueryHandler<GetUserQuery, User> {
  public readonly queryType = 'GetUserQuery';

  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  protected async handleQuery(query: GetUserQuery): Promise<User> {
    return await this.userRepository.findById(query.userId);
  }
}
```

### 注册和使用总线

```typescript
import { CommandBus } from '@/shared/application/bus/command-bus';
import { QueryBus } from '@/shared/application/bus/query-bus';

// 注册处理器
commandBus.registerHandler('CreateUserCommand', createUserHandler);
queryBus.registerHandler('GetUserQuery', getUserHandler);

// 执行命令
const command = new CreateUserCommand('user@example.com', 'username', { userId: 'admin-123' });
const userId = await commandBus.execute(command);

// 执行查询
const query = new GetUserQuery(userId, { userId: 'admin-123' });
const user = await queryBus.execute(query);
```

### 使用模块工厂

```typescript
import { ApplicationModuleFactory } from '@/shared/application/factories/application-module-factory';

const applicationModule = ApplicationModuleFactory.createModule({
  commandHandlers: [createUserHandler, updateUserHandler],
  queryHandlers: [getUserHandler, listUsersHandler],
  moduleName: 'UserManagementModule'
});
```

## 特性

### 1. 类型安全
- 完整的TypeScript类型支持
- 泛型约束确保类型安全
- 编译时错误检查

### 2. 依赖注入
- 与NestJS依赖注入系统完全集成
- 支持服务、仓储等依赖的自动注入
- 支持作用域管理

### 3. 日志记录
- 统一的日志记录机制
- 支持结构化日志
- 包含执行时间、用户信息等上下文

### 4. 异常处理
- 统一的异常处理机制
- 支持自定义异常类型
- 提供详细的错误信息

### 5. 缓存支持
- 查询结果自动缓存
- 支持缓存键自定义
- 支持缓存失效策略

### 6. 权限控制
- 支持查询权限验证
- 支持租户隔离
- 支持用户权限检查

### 7. 监控和追踪
- 支持执行时间监控
- 支持命令/查询追踪
- 支持性能指标收集

## 最佳实践

### 1. 命令设计
- 命令应该是不可变的
- 命令应该包含所有必要的数据
- 命令应该支持验证
- 命令应该包含审计信息

### 2. 查询设计
- 查询应该是幂等的
- 查询应该支持缓存
- 查询应该包含权限检查
- 查询应该支持分页和过滤

### 3. 处理器设计
- 处理器应该遵循单一职责原则
- 处理器应该处理异常
- 处理器应该记录日志
- 处理器应该验证输入

### 4. 总线使用
- 总线应该作为单例使用
- 总线应该在生产环境中配置
- 总线应该支持监控
- 总线应该处理并发

## 测试

### 单元测试
- 每个组件都有对应的单元测试
- 测试覆盖了正常流程和异常情况
- 测试使用了模拟对象

### 集成测试
- 提供了完整的集成测试
- 测试了组件间的交互
- 测试了端到端流程

## 扩展

### 1. 添加新的命令类型
1. 继承BaseCommand类
2. 实现validate方法
3. 创建对应的处理器
4. 注册到命令总线

### 2. 添加新的查询类型
1. 继承BaseQuery类
2. 实现validate方法
3. 创建对应的处理器
4. 注册到查询总线

### 3. 自定义总线行为
1. 继承CommandBus或QueryBus类
2. 重写相关方法
3. 注册自定义总线

## 总结

CQRS基础设施为IAM系统提供了完整的命令查询分离架构，具有以下优势：

1. **清晰的职责分离**：命令和查询有明确的职责边界
2. **高性能**：查询可以独立优化，支持缓存
3. **可扩展性**：支持水平扩展和垂直扩展
4. **可维护性**：代码结构清晰，易于维护
5. **类型安全**：完整的TypeScript支持
6. **监控友好**：内置监控和追踪功能

这个基础设施为后续的业务领域开发提供了坚实的基础。
