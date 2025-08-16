# 应用层开发指南

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档状态**: 正式版
- **负责人**: 开发团队

---

## 🎯 概述

应用层是Clean Architecture中的关键层，负责协调领域层和基础设施层，实现具体的业务用例。我们采用CQRS（Command Query Responsibility Segregation）模式来分离读写操作，提高系统的可扩展性和维护性。

### 核心价值
1. **职责分离**: 读写操作完全分离，职责清晰
2. **可扩展性**: 可以独立扩展读写操作
3. **可维护性**: 每个处理器职责单一，易于维护
4. **可测试性**: 每个组件都可以独立测试
5. **性能优化**: 可以为读写操作使用不同的优化策略

---

## 🏗️ 架构设计要点

### 1. Clean Architecture 应用层结构

#### 核心组件
- **用例（Use Cases）**: 封装具体的业务逻辑，是应用层的核心
- **接口（Interfaces）**: 定义用例的抽象契约
- **DTO（Data Transfer Objects）**: 用例的输入输出数据结构
- **命令（Commands）**: 表示写操作，如创建用户、更新用户等
- **查询（Queries）**: 表示读操作，如获取用户信息、获取用户列表等
- **命令处理器（Command Handlers）**: 处理命令的业务逻辑
- **查询处理器（Query Handlers）**: 处理查询的业务逻辑
- **命令总线（Command Bus）**: 负责路由命令到对应的处理器
- **查询总线（Query Bus）**: 负责路由查询到对应的处理器
- **应用服务（Application Services）**: 协调用例和外部接口

#### 优势
- **业务逻辑封装**: 用例层封装完整的业务逻辑，职责清晰
- **依赖倒置**: 依赖抽象接口而非具体实现
- **可测试性**: 每个用例都可以独立测试
- **可维护性**: 业务逻辑集中管理，易于维护
- **可扩展性**: 可以独立扩展业务用例
- **职责分离**: 读写操作完全分离，职责清晰
- **性能优化**: 可以为读写操作使用不同的优化策略

### 2. 目录结构设计

```
application/
├── use-cases/               # 用例层（核心业务逻辑）
│   ├── login.use-case.ts    # 登录用例
│   ├── logout.use-case.ts   # 登出用例
│   ├── create-user.use-case.ts
│   ├── update-user.use-case.ts
│   └── ...
├── interfaces/              # 接口定义
│   ├── use-case.interface.ts
│   ├── repository.interface.ts
│   └── service.interface.ts
├── dto/                     # 数据传输对象
│   ├── request/             # 请求DTO
│   │   ├── login-request.dto.ts
│   │   ├── create-user-request.dto.ts
│   │   └── ...
│   └── response/            # 响应DTO
│       ├── login-response.dto.ts
│       ├── user-response.dto.ts
│       └── ...
├── commands/                # 命令定义（CQRS）
│   ├── base-command.ts      # 基础命令接口
│   ├── create-user.command.ts
│   ├── update-user.command.ts
│   └── ...
├── queries/                 # 查询定义（CQRS）
│   ├── base-query.ts        # 基础查询接口
│   ├── get-user.query.ts
│   ├── get-users.query.ts
│   └── ...
├── handlers/                # 处理器（CQRS）
│   ├── command-handler.interface.ts
│   ├── query-handler.interface.ts
│   ├── commands/            # 命令处理器
│   └── queries/             # 查询处理器
├── bus/                     # 总线（CQRS）
│   ├── command-bus.interface.ts
│   ├── query-bus.interface.ts
│   ├── command-bus.ts
│   └── query-bus.ts
├── services/                # 应用服务（协调层）
├── application.module.ts    # 应用层模块
└── index.ts                 # 导出文件
```

---

## 🔧 开发要点

### 1. 用例层设计

#### UseCase接口
```typescript
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
```

#### 用例实现示例
```typescript
@Injectable()
export class LoginUseCase implements ILoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(request: LoginRequestDto): Promise<LoginResponseDto> {
    // 1. 验证输入数据
    this.validateRequest(request);
    
    // 2. 执行业务逻辑
    const user = await this.findUser(request.usernameOrEmail);
    await this.validatePassword(request.password, user.password);
    
    // 3. 生成令牌和会话
    const tokens = await this.generateTokens(user);
    const session = await this.createSession(user.id);
    
    // 4. 记录审计日志
    await this.auditService.logLoginSuccess(user.id);
    
    // 5. 返回结果
    return new LoginResponseDto({
      user: user.toDto(),
      tokens,
      session,
    });
  }
}
```

### 2. DTO设计

#### 请求DTO
```typescript
export class LoginRequestDto {
  readonly usernameOrEmail: string;
  readonly password: string;
  readonly rememberMe: boolean;
  readonly tenantId?: string;

  constructor(data: Partial<LoginRequestDto>) {
    this.usernameOrEmail = data.usernameOrEmail || '';
    this.password = data.password || '';
    this.rememberMe = data.rememberMe || false;
    this.tenantId = data.tenantId;
  }

  validate(): boolean {
    return !!(this.usernameOrEmail && this.password);
  }
}
```

#### 响应DTO
```typescript
export class LoginResponseDto {
  readonly success: boolean;
  readonly user: UserInfo;
  readonly tokens: TokenInfo;
  readonly session: SessionInfo;

  constructor(data: Partial<LoginResponseDto>) {
    this.success = data.success || false;
    this.user = data.user || {};
    this.tokens = data.tokens || {};
    this.session = data.session || {};
  }
}
```

### 3. 基础接口设计

#### BaseCommand
```typescript
export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
}

export abstract class BaseCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = this.generateCommandId();
    this.timestamp = new Date();
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### BaseQuery
```typescript
export interface IQuery<TResult = any> {
  readonly queryId: string;
  readonly timestamp: Date;
}

export abstract class BaseQuery<TResult = any> implements IQuery<TResult> {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = this.generateQueryId();
    this.timestamp = new Date();
  }

  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2. 处理器接口设计

#### CommandHandler
```typescript
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = any> {
  execute(command: TCommand): Promise<TResult>;
}
```

#### QueryHandler
```typescript
export interface IQueryHandler<TQuery extends IQuery = IQuery, TResult = any> {
  execute(query: TQuery): Promise<TResult>;
}
```

### 3. 总线设计

#### CommandBus
```typescript
export interface ICommandBus {
  execute<T extends ICommand = ICommand, R = any>(command: T): Promise<R>;
}

@Injectable()
export class CommandBus implements ICommandBus {
  private handlers = new Map<string, Type<ICommandHandler>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  register<T extends ICommand>(
    commandType: string,
    handler: Type<ICommandHandler<T, any>>,
  ): void {
    this.handlers.set(commandType, handler);
  }

  async execute<T extends ICommand = ICommand, R = any>(command: T): Promise<R> {
    const commandType = command.constructor.name;
    const handlerType = this.handlers.get(commandType);
    
    if (!handlerType) {
      throw new Error(`No handler found for command: ${commandType}`);
    }

    const handler = this.moduleRef.get(handlerType, { strict: false });
    return await handler.execute(command);
  }
}
```

#### QueryBus
```typescript
export interface IQueryBus {
  execute<T extends IQuery = IQuery, R = any>(query: T): Promise<R>;
}

@Injectable()
export class QueryBus implements IQueryBus {
  private handlers = new Map<string, Type<IQueryHandler>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  register<T extends IQuery>(
    queryType: string,
    handler: Type<IQueryHandler<T, any>>,
  ): void {
    this.handlers.set(queryType, handler);
  }

  async execute<T extends IQuery = IQuery, R = any>(query: T): Promise<R> {
    const queryType = query.constructor.name;
    const handlerType = this.handlers.get(queryType);
    
    if (!handlerType) {
      throw new Error(`No handler found for query: ${queryType}`);
    }

    const handler = this.moduleRef.get(handlerType, { strict: false });
    return await handler.execute(query);
  }
}
```

### 4. 应用服务设计

#### 使用用例模式
```typescript
@Injectable()
export class AuthApplicationService implements IAuthApplicationService {
  constructor(
    private readonly loginUseCase: ILoginUseCase,
    private readonly logoutUseCase: ILogoutUseCase,
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly validateTokenUseCase: IValidateTokenUseCase,
  ) {}

  async login(usernameOrEmail: string, password: string, rememberMe?: boolean): Promise<LoginResponseDto> {
    const request = new LoginRequestDto({
      usernameOrEmail,
      password,
      rememberMe,
    });
    return await this.loginUseCase.execute(request);
  }

  async logout(userId: string, sessionId?: string): Promise<LogoutResponseDto> {
    const request = new LogoutRequestDto({
      userId,
      sessionId,
    });
    return await this.logoutUseCase.execute(request);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const request = new RefreshTokenRequestDto({
      refreshToken,
    });
    return await this.refreshTokenUseCase.execute(request);
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponseDto> {
    const request = new ValidateTokenRequestDto({
      accessToken,
    });
    return await this.validateTokenUseCase.execute(request);
  }
}
```

#### 使用CQRS模式（可选）
```typescript
@Injectable()
export class UserApplicationService implements IUserApplicationService {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(createUserDto);
    return await this.commandBus.execute(command);
  }

  async getUser(userId: string): Promise<UserDto> {
    const query = new GetUserQuery(userId);
    return await this.queryBus.execute(query);
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const command = new UpdateUserCommand(userId, updateUserDto);
    return await this.commandBus.execute(command);
  }

  async getUsers(tenantId: string, page: number, limit: number, search?: string): Promise<UserListDto> {
    const query = new GetUsersQuery(tenantId, page, limit, search);
    return await this.queryBus.execute(query);
  }
}
```

### 5. 模块配置

#### 应用层模块（用例模式）
```typescript
@Module({
  providers: [
    // 应用服务
    AuthApplicationService,
    
    // 用例
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ValidateTokenUseCase,
    
    // CQRS总线（可选）
    CommandBus,
    QueryBus,
    
    // 命令处理器（可选）
    CreateUserHandler,
    UpdateUserHandler,
    
    // 查询处理器（可选）
    GetUserHandler,
    GetUsersHandler,
  ],
  exports: [
    AuthApplicationService,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ValidateTokenUseCase,
    CommandBus,
    QueryBus,
  ],
})
export class AuthApplicationModule implements OnModuleInit {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  onModuleInit() {
    // 注册命令处理器（可选）
    this.commandBus.register('CreateUserCommand', CreateUserHandler);
    this.commandBus.register('UpdateUserCommand', UpdateUserHandler);
    
    // 注册查询处理器（可选）
    this.queryBus.register('GetUserQuery', GetUserHandler);
    this.queryBus.register('GetUsersQuery', GetUsersHandler);
  }
}
```

---

## 📝 开发规范

### 1. 命名规范
- **用例**: 使用动词+名词，如 `LoginUseCase`, `CreateUserUseCase`
- **用例接口**: 使用I+用例名，如 `ILoginUseCase`
- **DTO**: 使用名词+RequestDto/ResponseDto，如 `LoginRequestDto`, `UserResponseDto`
- **命令**: 使用动词+名词，如 `CreateUserCommand`
- **查询**: 使用Get+名词，如 `GetUserQuery`
- **处理器**: 使用命令/查询名+Handler，如 `CreateUserHandler`

### 2. 类型安全
- 使用 `import type` 导入接口类型
- 在装饰器中使用类型时，确保正确导入
- 使用泛型确保类型安全

### 3. 错误处理
- 在处理器中进行业务规则验证
- 使用适当的异常类型（如 `NotFoundException`, `ConflictException`）
- 提供清晰的错误信息

### 4. 依赖注入
- 利用NestJS的依赖注入容器
- 在模块中正确配置提供者和导出
- 使用接口进行依赖抽象

---

## 🔄 工作流程

### 用例处理流程
1. 客户端调用应用服务方法
2. 应用服务创建请求DTO对象
3. 应用服务调用对应的用例
4. 用例验证输入数据
5. 用例执行业务逻辑（调用领域服务、仓储等）
6. 用例创建响应DTO对象
7. 返回处理结果

### 命令处理流程（CQRS）
1. 客户端调用应用服务方法
2. 应用服务创建命令对象
3. 应用服务通过命令总线发送命令
4. 命令总线根据命令类型路由到对应的处理器
5. 命令处理器执行业务逻辑
6. 返回处理结果

### 查询处理流程（CQRS）
1. 客户端调用应用服务方法
2. 应用服务创建查询对象
3. 应用服务通过查询总线发送查询
4. 查询总线根据查询类型路由到对应的处理器
5. 查询处理器执行查询逻辑
6. 返回查询结果

---

## 🎯 最佳实践

### 1. 单一职责原则
- 每个用例只处理一个业务场景
- 每个命令/查询只做一件事
- 每个处理器只处理一种类型的命令/查询
- 应用服务只负责协调，不包含业务逻辑

### 2. 依赖倒置原则
- 用例依赖抽象接口而非具体实现
- 通过依赖注入管理依赖关系
- 使用接口进行抽象和解耦

### 3. 开闭原则
- 通过添加新的用例来扩展功能
- 通过添加新的命令/查询来扩展功能
- 不修改现有的用例和处理器代码
- 使用接口进行抽象

### 4. 依赖倒置原则
- 应用层依赖领域层的接口
- 不依赖具体的实现
- 通过依赖注入管理依赖关系

### 5. 接口隔离原则
- 定义专门的用例接口
- 定义专门的命令和查询接口
- 避免大而全的接口
- 保持接口的简洁性

---

## 📊 性能考虑

### 1. 用例处理
- 包含完整的业务逻辑，性能要求适中
- 可以异步处理复杂业务逻辑
- 考虑使用缓存优化重复操作
- 支持事务管理和回滚机制

### 2. 命令处理
- 通常涉及业务逻辑和持久化，性能要求相对较低
- 可以异步处理，提高响应速度
- 考虑使用事件溯源记录状态变更

### 3. 查询处理
- 通常涉及数据读取，性能要求较高
- 可以使用缓存优化查询性能
- 考虑使用读写分离的数据库架构

### 4. 总线路由
- 使用Map进行路由，性能开销很小
- 避免在路由过程中进行复杂的逻辑处理
- 考虑使用反射或装饰器简化路由配置

---

## 🔒 安全考虑

### 1. 用例验证
- 在用例中进行业务规则验证
- 验证输入数据的完整性和有效性
- 检查用户权限和业务约束
- 支持多层级的安全验证

### 2. 命令验证
- 在命令处理器中进行业务规则验证
- 验证输入数据的完整性和有效性
- 检查用户权限和业务约束

### 3. 权限检查
- 在应用服务层进行权限验证
- 确保用户只能执行有权限的操作
- 记录权限检查的审计日志

### 4. 数据验证
- 使用DTO进行输入数据验证
- 使用class-validator等库进行验证
- 提供清晰的验证错误信息

### 5. 审计日志
- 记录所有用例、命令和查询的执行日志
- 包含执行时间、用户信息、操作内容等
- 支持审计和问题追踪

---

## 🔧 扩展指南

### 添加新用例
1. 创建用例接口，定义 `IUseCase<TRequest, TResponse>`
2. 创建用例实现类，实现具体的业务逻辑
3. 创建请求和响应DTO
4. 在 `application.module.ts` 中注册用例
5. 在应用服务中添加对应方法

### 添加新命令
1. 创建命令类，继承 `BaseCommand`
2. 创建命令处理器，实现 `ICommandHandler`
3. 在 `application.module.ts` 中注册处理器
4. 在应用服务中添加对应方法

### 添加新查询
1. 创建查询类，继承 `BaseQuery`
2. 创建查询处理器，实现 `IQueryHandler`
3. 在 `application.module.ts` 中注册处理器
4. 在应用服务中添加对应方法

---

## 📋 总结

应用层开发的核心要点是：

1. **采用用例模式**：封装完整的业务逻辑，是Clean Architecture的核心
2. **采用CQRS模式**：分离读写操作，提高系统可扩展性
3. **遵循Clean Architecture原则**：保持层间依赖的正确方向
4. **使用依赖注入**：提高代码的可测试性和可维护性
5. **实现类型安全**：确保编译时错误检查
6. **注重性能优化**：为读写操作使用不同的优化策略
7. **重视安全审计**：记录操作日志，确保系统安全
8. **保持代码简洁**：每个组件职责单一，易于理解和维护

通过这样的架构设计，我们建立了一个可扩展、可维护、高性能的应用层架构，为整个系统的成功奠定了坚实的基础。

通过这样的架构设计，我们建立了一个可扩展、可维护、高性能的应用层架构，为整个系统的成功奠定了坚实的基础。

---

## 📝 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2024-12 | 初始版本，包含CQRS架构设计 | 开发团队 |

---

## 📞 联系方式

- **技术负责人**: [待填写]
- **架构师**: [待填写]
- **开发团队**: [待填写]
- **邮箱**: [待填写]
