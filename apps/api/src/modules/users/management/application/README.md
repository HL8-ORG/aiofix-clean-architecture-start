# 用户管理应用层 - CQRS架构

## 📋 概述

用户管理应用层采用CQRS（Command Query Responsibility Segregation）架构模式，将读写操作分离，提高系统的可扩展性和维护性。

## 🏗️ 架构设计

### 核心组件

1. **命令（Commands）**: 表示写操作，如创建用户、更新用户等
2. **查询（Queries）**: 表示读操作，如获取用户信息、获取用户列表等
3. **命令处理器（Command Handlers）**: 处理命令的业务逻辑
4. **查询处理器（Query Handlers）**: 处理查询的业务逻辑
5. **命令总线（Command Bus）**: 负责路由命令到对应的处理器
6. **查询总线（Query Bus）**: 负责路由查询到对应的处理器

### 目录结构

```
application/
├── commands/                 # 命令定义
│   ├── base-command.ts      # 基础命令接口
│   ├── create-user.command.ts
│   ├── update-user.command.ts
│   ├── change-password.command.ts
│   ├── activate-user.command.ts
│   ├── deactivate-user.command.ts
│   └── reset-password.command.ts
├── queries/                  # 查询定义
│   ├── base-query.ts        # 基础查询接口
│   ├── get-user.query.ts
│   ├── get-users.query.ts
│   ├── get-user-by-email.query.ts
│   └── get-user-by-username.query.ts
├── handlers/                 # 处理器
│   ├── command-handler.interface.ts
│   ├── query-handler.interface.ts
│   ├── commands/            # 命令处理器
│   │   ├── create-user.handler.ts
│   │   └── update-user.handler.ts
│   └── queries/             # 查询处理器
│       ├── get-user.handler.ts
│       └── get-users.handler.ts
├── bus/                     # 总线
│   ├── command-bus.interface.ts
│   ├── query-bus.interface.ts
│   ├── command-bus.ts
│   └── query-bus.ts
├── services/                # 应用服务
│   └── user-application.service.ts
├── interfaces/              # 接口定义
│   └── user-application.interface.ts
├── dto/                     # 数据传输对象
│   ├── user.dto.ts
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── change-password.dto.ts
│   └── user-list.dto.ts
├── application.module.ts    # 应用层模块
└── index.ts                 # 导出文件
```

## 🔄 工作流程

### 命令处理流程

1. 客户端调用应用服务方法
2. 应用服务创建命令对象
3. 应用服务通过命令总线发送命令
4. 命令总线根据命令类型路由到对应的处理器
5. 命令处理器执行业务逻辑
6. 返回处理结果

### 查询处理流程

1. 客户端调用应用服务方法
2. 应用服务创建查询对象
3. 应用服务通过查询总线发送查询
4. 查询总线根据查询类型路由到对应的处理器
5. 查询处理器执行查询逻辑
6. 返回查询结果

## 📝 使用示例

### 创建用户

```typescript
// 在应用服务中
async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
  const command = new CreateUserCommand(createUserDto);
  return await this.commandBus.execute(command);
}
```

### 获取用户

```typescript
// 在应用服务中
async getUser(userId: string): Promise<UserDto> {
  const query = new GetUserQuery(userId);
  return await this.queryBus.execute(query);
}
```

## 🎯 优势

1. **职责分离**: 读写操作完全分离，职责清晰
2. **可扩展性**: 可以独立扩展读写操作
3. **可维护性**: 每个处理器职责单一，易于维护
4. **可测试性**: 每个组件都可以独立测试
5. **性能优化**: 可以为读写操作使用不同的优化策略

## 🔧 扩展指南

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

## 📊 性能考虑

1. **命令处理**: 通常涉及业务逻辑和持久化，性能要求相对较低
2. **查询处理**: 通常涉及数据读取，性能要求较高，可以考虑缓存优化
3. **总线路由**: 使用Map进行路由，性能开销很小
4. **依赖注入**: 利用NestJS的依赖注入容器，避免手动管理依赖

## 🔒 安全考虑

1. **命令验证**: 在命令处理器中进行业务规则验证
2. **权限检查**: 在应用服务层进行权限验证
3. **数据验证**: 使用DTO进行输入数据验证
4. **审计日志**: 记录所有命令和查询的执行日志
