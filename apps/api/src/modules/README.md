# IAM系统模块目录结构

## 概述

本目录包含IAM系统的所有业务模块，采用DDD（领域驱动设计）和Clean Architecture（整洁架构）的设计原则。

## 架构原则

### DDD分层架构
每个模块都遵循四层架构设计：

- **domain/**: 领域层 - 包含业务逻辑、实体、值对象、领域服务、领域事件
- **application/**: 应用层 - 包含应用服务、Use Cases、DTO、接口、校验器
- **infrastructure/**: 基础设施层 - 包含ORM实体、仓储实现、外部服务集成
- **presentation/**: 表现层 - 包含控制器、表现层DTO、校验器、守卫

### 领域划分
系统按业务领域进行模块划分，每个领域包含多个子领域：

## 模块列表

### 1. 租户领域 (Tenants Domain)
- **management/**: 租户管理子领域
- **billing/**: 租户计费子领域
- **settings/**: 租户设置子领域
- **applications/**: 租户申请子领域
- **tenant-change/**: 租户变更子领域

### 2. 用户领域 (Users Domain)
- **management/**: 用户管理子领域
- **profiles/**: 用户档案子领域
- **preferences/**: 用户偏好子领域
- **registration/**: 用户注册子领域
- **tenant-change/**: 用户租户变更子领域

### 3. 认证领域 (Authentication Domain)
- **login/**: 登录子领域
- **password/**: 密码管理子领域
- **mfa/**: 多因子认证子领域
- **sessions/**: 会话管理子领域

### 4. 授权领域 (Authorization Domain)
- **permissions/**: 权限管理子领域
- **roles/**: 角色管理子领域
- **policies/**: 策略管理子领域
- **casl/**: CASL集成子领域
- **obac/**: 基于组织的访问控制子领域

### 5. 组织领域 (Organizations Domain)
- **management/**: 组织管理子领域
- **hierarchy/**: 组织层级子领域
- **structure/**: 组织结构子领域
- **user-assignment/**: 用户分配子领域
- **permissions/**: 组织权限子领域

### 6. 租户变更领域 (Tenant Change Domain)
- **applications/**: 租户变更申请子领域
- **approval/**: 租户变更审核子领域
- **history/**: 租户变更历史子领域

### 7. 申请审核领域 (Application Review Domain)
- **management/**: 申请管理子领域
- **rules/**: 审核规则子领域
- **history/**: 审核历史子领域

### 8. 事件领域 (Events Domain)
- **sourcing/**: 事件溯源子领域
- **publishing/**: 事件发布子领域
- **replay/**: 事件重放子领域

### 9. 审计领域 (Audit Domain)
- **logging/**: 审计日志子领域
- **compliance/**: 合规审计子领域
- **reporting/**: 审计报告子领域

### 10. 通知领域 (Notifications Domain)
- **email/**: 邮件通知子领域
- **sms/**: 短信通知子领域
- **push/**: 推送通知子领域

## 开发规范

### 命名规范
- 领域名称使用复数形式（如：tenants, users）
- 子领域名称使用名词（如：management, billing）
- 文件名使用kebab-case（如：tenant-management.service.ts）

### 依赖关系
- 领域层不依赖其他层
- 应用层依赖领域层
- 基础设施层依赖领域层和应用层
- 表现层依赖应用层

### 模块文件
每个领域都有一个主模块文件（如：tenants.module.ts），用于：
- 导入所有子领域模块
- 配置依赖注入
- 导出公共接口

## 开发指南

1. **创建新子领域**：在对应领域下创建新的子领域目录
2. **实现四层架构**：确保每个子领域都包含完整的四层结构
3. **遵循依赖倒置**：通过接口定义依赖关系
4. **事件驱动**：使用领域事件进行模块间通信
5. **测试驱动**：为每个层编写对应的测试

## 注意事项

- 保持领域边界清晰，避免跨领域依赖
- 使用事件驱动架构实现松耦合
- 遵循单一职责原则
- 确保代码的可测试性和可维护性
