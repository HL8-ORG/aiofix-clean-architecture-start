# 用户管理基础设施层

## 概述

用户管理基础设施层包含具体的数据库实现，支持多数据库适配。目前支持 PostgreSQL（默认）和 MongoDB（计划中）。

## 目录结构

```
users/management/
├── index.ts                           # 用户管理模块主索引文件
├── users-management.module.ts         # 静态用户管理模块
├── users-management-dynamic.module.ts # 动态用户管理模块
├── database/                          # 数据库层
│   ├── index.ts                       # 数据库层索引文件
│   ├── database-adapter.factory.ts    # 数据库适配器工厂
│   └── database.config.ts             # 数据库配置服务
├── infrastructure/                    # 基础设施层
│   ├── index.ts                       # 基础设施层索引文件
│   ├── postgresql/                    # PostgreSQL实现
│   │   ├── index.ts                   # PostgreSQL索引文件
│   │   ├── entities/                  # 数据库实体
│   │   │   └── user.entity.ts
│   │   ├── mappers/                   # 数据映射器
│   │   │   ├── user.mapper.ts
│   │   │   └── user.mapper.spec.ts
│   │   └── repositories/              # 仓储实现
│   │       ├── user.repository.ts
│   │       └── user.repository.spec.ts
│   └── mongodb/                       # MongoDB实现（计划中）
│       ├── index.ts                   # MongoDB索引文件
│       ├── entities/                  # MongoDB文档模型
│       ├── mappers/                   # MongoDB映射器
│       └── repositories/              # MongoDB仓储实现
├── domain/                            # 领域层
└── application/                       # 应用层
```

## 架构分层

### 1. 数据库层 (database/)
- **数据库适配器工厂** (`DatabaseAdapterFactory`)
  - 管理不同数据库的实现
  - 提供统一的接口来访问数据库特定实现
  - 支持运行时切换数据库

- **数据库配置服务** (`DatabaseConfigService`)
  - 管理数据库类型选择
  - 支持环境变量配置
  - 提供默认配置

### 2. 基础设施层 (infrastructure/)
- **PostgreSQL实现** (`postgresql/`)
  - 具体的数据库实体、映射器和仓储实现
  - 使用MikroORM进行数据访问

- **MongoDB实现** (`mongodb/`)
  - 计划中的MongoDB实现
  - 文档模型和相应的映射器

### 3. 模块配置
- **静态模块** (`users-management.module.ts`)
  - 传统的NestJS模块配置
  - 固定使用PostgreSQL

- **动态模块** (`users-management-dynamic.module.ts`)
  - 根据配置动态加载不同的数据库实现
  - 支持运行时切换数据库

## 核心组件

### 1. 数据库适配器工厂 (DatabaseAdapterFactory)

管理不同数据库的实现，提供统一的接口来访问数据库特定的实现。

```typescript
import { DatabaseType, DatabaseAdapterFactory } from './database';

// 设置数据库类型
DatabaseAdapterFactory.setDatabaseType(DatabaseType.POSTGRESQL);

// 获取当前适配器
const adapter = DatabaseAdapterFactory.getCurrentAdapter();
```

### 2. 数据库配置服务 (DatabaseConfigService)

管理数据库配置，支持环境变量配置。

```typescript
import { DatabaseConfigService } from './database';

// 获取数据库类型
const dbType = DatabaseConfigService.getDatabaseType();

// 获取连接字符串
const connectionString = DatabaseConfigService.getConnectionString();
```

### 3. 动态用户管理模块 (UsersManagementDynamicModule)

根据配置动态加载不同的数据库实现。

```typescript
import { UsersManagementDynamicModule } from './users-management-dynamic.module';

@Module({
  imports: [
    UsersManagementDynamicModule.forRoot({
      databaseType: DatabaseType.POSTGRESQL
    })
  ]
})
export class AppModule {}
```

## 环境变量配置

支持通过环境变量配置数据库：

```bash
# 数据库类型 (postgresql | mongodb)
USER_DATABASE_TYPE=postgresql

# 数据库连接信息
USER_DATABASE_HOST=localhost
USER_DATABASE_PORT=5432
USER_DATABASE_USERNAME=postgres
USER_DATABASE_PASSWORD=password
USER_DATABASE_NAME=aiofix_users

# 或者使用连接字符串
USER_DATABASE_URL=postgresql://username:password@localhost:5432/database
```

## 使用方式

### 1. 使用默认模块（PostgreSQL）

```typescript
import { UsersManagementModule } from './users-management.module';

@Module({
  imports: [UsersManagementModule]
})
export class AppModule {}
```

### 2. 使用动态模块

```typescript
import { UsersManagementDynamicModule } from './users-management-dynamic.module';
import { DatabaseType } from './database';

@Module({
  imports: [
    UsersManagementDynamicModule.forRoot({
      databaseType: DatabaseType.POSTGRESQL
    })
  ]
})
export class AppModule {}
```

### 3. 运行时切换数据库

```typescript
import { DatabaseAdapterFactory, DatabaseType } from './database';

// 切换到MongoDB
DatabaseAdapterFactory.setDatabaseType(DatabaseType.MONGODB);
```

## 扩展新数据库

要添加新的数据库支持，需要：

1. 在 `infrastructure/` 下创建新的数据库目录
2. 实现对应的实体、映射器和仓储
3. 在 `DatabaseAdapterFactory` 中添加新的适配器
4. 在 `DatabaseConfigService` 中添加配置支持

### 示例：添加 MySQL 支持

```typescript
// 1. 创建目录结构
infrastructure/mysql/
├── entities/
├── mappers/
└── repositories/

// 2. 在 DatabaseType 枚举中添加
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb',
  MYSQL = 'mysql'  // 新增
}

// 3. 在 DatabaseAdapterFactory 中添加适配器
private static createMySQLAdapter(): DatabaseAdapter {
  // 实现MySQL适配器
}
```

## 测试

每个数据库实现都应该包含完整的测试：

```bash
# 运行PostgreSQL测试
npm run test -- --testPathPattern=postgresql

# 运行MongoDB测试
npm run test -- --testPathPattern=mongodb
```

## 注意事项

1. **默认数据库**: 当前默认使用 PostgreSQL
2. **向后兼容**: 现有的 `UsersManagementModule` 仍然可用
3. **配置验证**: 启动时会自动验证数据库配置
4. **错误处理**: 不支持的数据库类型会抛出错误
5. **性能考虑**: 动态模块加载可能影响启动性能
6. **架构分层**: 数据库层和基础设施层职责分离，便于维护和扩展
