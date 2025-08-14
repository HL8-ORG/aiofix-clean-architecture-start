# IAM系统模块目录结构总结

## 概述

根据更新后的 `iam-system-overview-design.md` 和 `development-todo-list.md`，我们重新创建了完整的模块目录结构，严格遵循DDD（领域驱动设计）和Clean Architecture（整洁架构）的设计原则。

## 目录结构概览

```
apps/api/src/modules/
├── README.md                           # 模块目录说明文档
├── tenants/                            # 租户领域
│   ├── tenants.module.ts              # 租户领域主模块
│   ├── management/                     # 租户管理子领域
│   ├── billing/                        # 租户计费子领域
│   ├── settings/                       # 租户设置子领域
│   ├── applications/                   # 租户申请子领域
│   └── tenant-change/                  # 租户变更子领域
├── users/                              # 用户领域
│   ├── users.module.ts                # 用户领域主模块
│   ├── management/                     # 用户管理子领域
│   ├── profiles/                       # 用户档案子领域
│   ├── preferences/                    # 用户偏好子领域
│   ├── registration/                   # 用户注册子领域
│   └── tenant-change/                  # 用户租户变更子领域
├── authentication/                     # 认证领域
│   ├── authentication.module.ts       # 认证领域主模块
│   ├── login/                          # 登录子领域
│   ├── password/                       # 密码管理子领域
│   ├── mfa/                            # 多因子认证子领域
│   └── sessions/                       # 会话管理子领域
├── authorization/                      # 授权领域
│   ├── authorization.module.ts        # 授权领域主模块
│   ├── permissions/                    # 权限管理子领域
│   ├── roles/                          # 角色管理子领域
│   ├── policies/                       # 策略管理子领域
│   ├── casl/                           # CASL集成子领域
│   └── obac/                           # 基于组织的访问控制子领域
├── organizations/                      # 组织领域
│   ├── organizations.module.ts        # 组织领域主模块
│   ├── management/                     # 组织管理子领域
│   ├── hierarchy/                      # 组织层级子领域
│   ├── structure/                      # 组织结构子领域
│   ├── user-assignment/                # 用户分配子领域
│   └── permissions/                    # 组织权限子领域
├── tenant-change/                      # 租户变更领域
│   ├── tenant-change.module.ts        # 租户变更领域主模块
│   ├── applications/                   # 租户变更申请子领域
│   ├── approval/                       # 租户变更审核子领域
│   └── history/                        # 租户变更历史子领域
├── application-review/                 # 申请审核领域
│   ├── application-review.module.ts   # 申请审核领域主模块
│   ├── management/                     # 申请管理子领域
│   ├── rules/                          # 审核规则子领域
│   └── history/                        # 审核历史子领域
├── events/                             # 事件领域
│   ├── events.module.ts               # 事件领域主模块
│   ├── sourcing/                       # 事件溯源子领域
│   ├── publishing/                     # 事件发布子领域
│   └── replay/                         # 事件重放子领域
├── audit/                              # 审计领域
│   ├── audit.module.ts                # 审计领域主模块
│   ├── logging/                        # 审计日志子领域
│   ├── compliance/                     # 合规审计子领域
│   └── reporting/                      # 审计报告子领域
└── notifications/                      # 通知领域
    ├── notifications.module.ts        # 通知领域主模块
    ├── email/                          # 邮件通知子领域
    ├── sms/                            # 短信通知子领域
    └── push/                           # 推送通知子领域
```

## 架构分层设计

每个子领域都遵循四层架构设计：

### 1. Domain Layer (领域层)
- **entities/**: 实体定义
- **value-objects/**: 值对象
- **aggregates/**: 聚合根
- **services/**: 领域服务
- **events/**: 领域事件
- **repositories/**: 仓储接口

### 2. Application Layer (应用层)
- **services/**: 应用服务
- **use-cases/**: 业务用例
- **dto/**: 数据传输对象
- **interfaces/**: 应用接口

### 3. Infrastructure Layer (基础设施层)
- **entities/**: ORM实体
- **repositories/**: 仓储实现
- **external/**: 外部服务集成

### 4. Presentation Layer (表现层)
- **controllers/**: 控制器
- **dto/**: 请求/响应DTO
- **validators/**: 数据校验器

## 领域划分详情

### 1. 租户领域 (Tenants Domain)
- **management**: 租户管理子领域 - 负责租户的核心业务逻辑
- **billing**: 租户计费子领域 - 负责租户的计费、套餐管理、支付处理
- **settings**: 租户设置子领域 - 负责租户的配置管理、个性化设置
- **applications**: 租户申请子领域 - 负责租户创建申请的流程管理
- **tenant-change**: 租户变更子领域 - 负责租户信息变更的管理

### 2. 用户领域 (Users Domain)
- **management**: 用户管理子领域 - 负责用户的核心业务逻辑
- **profiles**: 用户档案子领域 - 负责用户档案、个人信息的管理
- **preferences**: 用户偏好子领域 - 负责用户偏好设置、个性化配置
- **registration**: 用户注册子领域 - 负责用户注册、账户创建的业务流程
- **tenant-change**: 用户租户变更子领域 - 负责用户租户变更的管理

### 3. 认证领域 (Authentication Domain)
- **login**: 登录子领域 - 负责用户登录流程、认证策略的管理
- **password**: 密码管理子领域 - 负责密码管理、重置、验证等业务
- **mfa**: 多因子认证子领域 - 负责多因子认证、OTP、生物识别等
- **sessions**: 会话管理子领域 - 负责会话管理、令牌管理等

### 4. 授权领域 (Authorization Domain)
- **permissions**: 权限管理子领域 - 负责权限定义、权限管理的核心业务
- **roles**: 角色管理子领域 - 负责角色管理、角色分配的业务逻辑
- **policies**: 策略管理子领域 - 负责访问策略、策略引擎的管理
- **casl**: CASL集成子领域 - 负责CASL权限库的集成和管理
- **obac**: 基于组织的访问控制子领域 - 负责基于组织的权限控制

### 5. 组织领域 (Organizations Domain)
- **management**: 组织管理子领域 - 负责组织架构管理、CRUD操作
- **hierarchy**: 组织层级子领域 - 负责组织层级关系管理
- **structure**: 组织结构子领域 - 负责组织结构管理
- **user-assignment**: 用户分配子领域 - 负责用户组织分配管理
- **permissions**: 组织权限子领域 - 负责组织权限管理

### 6. 租户变更领域 (Tenant Change Domain)
- **applications**: 租户变更申请子领域 - 负责租户变更申请的管理
- **approval**: 租户变更审核子领域 - 负责租户变更审核流程
- **history**: 租户变更历史子领域 - 负责租户变更历史记录

### 7. 申请审核领域 (Application Review Domain)
- **management**: 申请管理子领域 - 负责申请管理、流程协调
- **rules**: 审核规则子领域 - 负责审核规则管理
- **history**: 审核历史子领域 - 负责审核历史记录

### 8. 事件领域 (Events Domain)
- **sourcing**: 事件溯源子领域 - 负责事件溯源的核心业务
- **publishing**: 事件发布子领域 - 负责事件发布的管理
- **replay**: 事件重放子领域 - 负责事件重放的业务逻辑

### 9. 审计领域 (Audit Domain)
- **logging**: 审计日志子领域 - 负责审计日志记录
- **compliance**: 合规审计子领域 - 负责合规性检查
- **reporting**: 审计报告子领域 - 负责审计报告生成

### 10. 通知领域 (Notifications Domain)
- **email**: 邮件通知子领域 - 负责邮件通知的管理
- **sms**: 短信通知子领域 - 负责短信通知的管理
- **push**: 推送通知子领域 - 负责推送通知的管理

## 创建的文件

### 1. 目录结构
- 创建了10个主要领域目录
- 每个领域包含3-5个子领域
- 每个子领域包含完整的四层架构目录
- 总计创建了206个目录

### 2. 模块文件
- 为每个领域创建了主模块文件（.module.ts）
- 包含完整的模块配置和依赖注入设置
- 预留了子领域模块的导入位置

### 3. 文档文件
- 创建了模块目录的总体README.md
- 为每个子领域生成了详细的README.md文件
- 包含架构说明、职责范围、开发指南等

### 4. 脚本文件
- 创建了 `scripts/generate-subdomain-readme.sh` 脚本
- 用于批量生成子领域的README文件
- 便于后续维护和更新

## 开发指南

### 1. 命名规范
- 领域名称使用复数形式（如：tenants, users）
- 子领域名称使用名词（如：management, billing）
- 文件名使用kebab-case（如：tenant-management.service.ts）

### 2. 依赖关系
- 领域层不依赖其他层
- 应用层依赖领域层
- 基础设施层依赖领域层和应用层
- 表现层依赖应用层

### 3. 开发流程
1. 在对应子领域下创建具体的业务文件
2. 遵循四层架构的设计原则
3. 使用依赖注入管理组件关系
4. 通过领域事件实现模块间通信
5. 编写完整的单元测试

## 下一步计划

1. **实现共享层组件**：完成共享领域层和基础设施层的开发
2. **开发核心领域**：优先实现租户、用户、认证、授权等核心领域
3. **集成测试**：为每个子领域编写集成测试
4. **文档完善**：根据实际开发情况更新README文件
5. **性能优化**：实现缓存、事件溯源等高级功能

## 总结

新的模块目录结构完全符合DDD和Clean Architecture的设计原则，为后续的开发工作提供了清晰的结构指导。每个子领域都有明确的职责边界，便于团队协作和功能扩展。
