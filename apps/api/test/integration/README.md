# 集成测试文档

## 概述

本目录包含IAM系统的集成测试，主要用于测试系统组件间的协作和集成功能。

## 测试结构

```
test/integration/
├── jest-integration.json                    # 集成测试Jest配置
├── jest-integration.setup.ts                # 集成测试设置文件
├── README.md                                # 本文档
├── event-sourcing/                          # 事件溯源系统集成测试
│   └── event-sourcing-system.integration-spec.ts
└── cache/                                   # 缓存系统集成测试
    └── cache-system.integration-spec.ts
```

## 运行测试

### 运行所有集成测试

```bash
# 在apps/api目录下
pnpm test:integration

# 或者使用npm
npm run test:integration

# 或者使用yarn
yarn test:integration
```

### 运行特定测试文件

```bash
# 运行事件溯源系统集成测试
pnpm test:integration event-sourcing-system.integration-spec.ts

# 运行缓存系统集成测试
pnpm test:integration cache-system.integration-spec.ts
```

### 运行测试并生成覆盖率报告

```bash
pnpm test:integration --coverage
```

## 测试场景

### 事件溯源系统集成测试 (event-sourcing-system.integration-spec.ts)

1. **事件存储与缓存集成测试**
   - 事件存储到数据库并同步到缓存
   - 缓存失效和重建机制
   - 数据一致性验证

2. **事件发布与处理器集成测试**
   - 事件发布和处理器触发
   - 处理器失败和重试机制
   - 事件处理流程验证

3. **事件重放与快照集成测试**
   - 快照优化的事件重放
   - 状态构建器集成
   - 重放性能验证

4. **事件投影与查询集成测试**
   - 事件投影执行和查询
   - 投影处理器集成
   - 投影数据验证

5. **系统间协作集成测试**
   - 多服务协调完成业务流程
   - 跨聚合根操作
   - 系统集成验证

6. **性能与并发集成测试**
   - 并发事件存储
   - 并发事件查询
   - 性能指标验证

### 缓存系统集成测试 (cache-system.integration-spec.ts)

1. **缓存服务集成测试**
   - Redis缓存服务功能
   - 内存缓存服务功能
   - 缓存操作验证

2. **缓存管理器集成测试**
   - 多策略缓存管理
   - 缓存回退策略
   - 策略切换验证

3. **缓存失效集成测试**
   - 精确失效策略
   - 前缀失效策略
   - 通配符失效策略

4. **缓存键工厂集成测试**
   - 标准化缓存键生成
   - 命名空间键生成
   - 键格式验证

5. **多级缓存集成测试**
   - L1/L2缓存策略
   - 缓存穿透保护
   - 多级缓存协调

6. **性能与并发集成测试**
   - 并发缓存操作
   - 高并发读取
   - 性能指标验证

7. **缓存统计与监控集成测试**
   - 缓存统计信息收集
   - 缓存健康状态监控
   - 监控数据验证

## 测试配置

### Jest配置 (jest-integration.json)

- **测试环境**: Node.js
- **测试超时**: 120秒
- **测试文件匹配**: `*.integration-spec.ts`
- **覆盖率**: 自动生成
- **详细输出**: 启用

### 测试设置 (jest-integration.setup.ts)

- **全局超时设置**: 120秒
- **环境变量配置**: 测试环境配置
- **服务就绪检查**: 数据库和Redis连接检查
- **错误处理**: 未处理异常和拒绝
- **测试生命周期**: 全局设置和清理

## 测试数据

### 模拟业务数据

测试使用模拟的业务数据，包括：

- **租户数据**: 租户创建、更新等操作
- **用户数据**: 用户创建、激活等操作
- **缓存数据**: 各种类型的缓存数据
- **事件数据**: 业务事件和系统事件

### 测试隔离

- 每个测试用例使用独立的测试数据
- 测试完成后自动清理数据
- 避免测试间的数据干扰

## 环境要求

### 必需服务

1. **PostgreSQL数据库**
   - 测试数据库: `iam_test`
   - 连接配置: 通过环境变量设置

2. **Redis缓存服务**
   - 测试数据库: `1`
   - 连接配置: 通过环境变量设置

### 环境变量

```bash
# 数据库配置
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/iam_test

# Redis配置
TEST_REDIS_URL=redis://localhost:6379/1

# 其他配置
NODE_ENV=test
```

## 注意事项

### 测试隔离

- 每个测试用例使用独立的聚合根ID
- 测试完成后自动清理资源
- 避免测试间的数据干扰

### 性能考虑

- 测试超时设置为120秒
- 并发测试限制在合理范围内
- 大量数据测试使用较小的数据集

### 数据清理

- 测试前清理历史数据
- 测试后清理测试数据
- 使用try-catch处理清理错误

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证数据库连接配置
   - 确保测试数据库存在

2. **Redis连接失败**
   - 检查Redis服务是否运行
   - 验证Redis连接配置
   - 确保Redis数据库可访问

3. **测试超时**
   - 检查网络连接
   - 增加测试超时时间
   - 检查系统资源使用情况

4. **服务就绪检查失败**
   - 检查服务启动状态
   - 验证服务配置
   - 查看服务日志

### 调试技巧

1. **启用详细日志**
   ```bash
   pnpm test:integration --verbose
   ```

2. **运行单个测试**
   ```bash
   pnpm test:integration --testNamePattern="应该能够存储事件并同步到缓存"
   ```

3. **调试模式运行**
   ```bash
   pnpm test:debug
   ```

4. **查看测试覆盖率**
   ```bash
   pnpm test:integration --coverage
   ```

## 扩展测试

### 添加新的集成测试

1. 在相应目录下创建新的测试文件
2. 遵循命名规范：`*.integration-spec.ts`
3. 使用描述性的测试用例名称
4. 添加适当的超时设置
5. 实现数据清理逻辑

### 测试最佳实践

1. **测试独立性**: 每个测试应该独立运行
2. **数据清理**: 测试完成后清理测试数据
3. **错误处理**: 适当处理异常情况
4. **性能监控**: 监控测试执行时间
5. **文档化**: 为复杂测试添加注释

## 持续集成

### CI/CD集成

集成测试可以集成到CI/CD流程中：

```yaml
# GitHub Actions示例
- name: Run Integration Tests
  run: |
    cd apps/api
    pnpm test:integration
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    TEST_REDIS_URL: ${{ secrets.TEST_REDIS_URL }}
```

### 测试报告

- 测试结果自动生成报告
- 失败测试提供详细错误信息
- 性能指标记录和趋势分析
- 覆盖率报告生成

## 性能基准

### 测试性能指标

- **事件存储**: < 100ms per event
- **事件查询**: < 50ms per query
- **缓存操作**: < 10ms per operation
- **并发处理**: 支持100+并发操作
- **内存使用**: < 500MB per test suite

### 性能监控

- 测试执行时间监控
- 内存使用情况监控
- 并发处理能力验证
- 性能回归检测
