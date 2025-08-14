# IAM系统概要设计文档

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档状态**: 概要设计
- **负责人**: 架构设计团队

---

## 🎯 文档目的

本文档描述了IAM（身份与访问管理）系统的概要设计，包括系统概述、业务需求分析、领域划分、架构设计、核心实体定义等内容。本文档为后续的详细设计和开发实现提供指导。

**核心架构理念**：
本系统严格遵循**DDD（领域驱动设计）**和**Clean Architecture（整洁架构）**的设计原则，确保：
- 业务逻辑与技术实现的完全解耦
- 领域模型的完整性和一致性
- 系统架构的可维护性和可扩展性
- 开发团队与业务团队的统一语言
- 高质量、可测试的代码结构

---

## 📖 目录

1. [系统概述](#系统概述)
2. [业务需求分析](#业务需求分析)
3. [领域划分设计](#领域划分设计)
4. [架构设计](#架构设计)
   4.1 [整体架构](#整体架构)
   4.2 [技术架构](#技术架构)
   4.3 [项目结构](#项目结构)
   4.4 [事件溯源架构](#事件溯源架构-event-sourcing-architecture)
   4.5 [缓存架构设计](#缓存架构设计-caching-architecture)
   4.6 [请求追踪与租户上下文架构](#请求追踪与租户上下文架构-request-tracing--tenant-context-architecture)
   4.7 [MikroORM多数据库适配架构](#mikroorm多数据库适配架构-mikroorm-multi-database-architecture)
   4.8 [配置管理架构](#配置管理架构-configuration-management-architecture)
   4.9 [Pino日志架构设计](#pino日志架构设计-pino-logging-architecture)
5. [核心实体设计](#核心实体设计)
6. [业务流程设计](#业务流程设计)
   6.1 [租户管理流程](#租户管理流程)
   6.2 [用户管理流程](#用户管理流程)
   6.3 [权限管理流程](#权限管理流程)
   6.4 [组织管理流程](#组织管理流程)
   6.5 [申请审核流程](#申请审核流程)
   6.6 [事件溯源流程](#事件溯源流程)
   6.7 [缓存管理流程](#缓存管理流程)
   6.8 [请求追踪与租户上下文管理流程](#请求追踪与租户上下文管理流程)
   6.9 [数据库适配管理流程](#数据库适配管理流程)
   6.10 [配置管理流程](#配置管理流程)
   6.11 [日志管理流程](#日志管理流程)
7. [DDD与Clean Architecture实施指南](#ddd与clean-architecture实施指南)
8. [技术选型](#技术选型)
9. [非功能性需求](#非功能性需求)
10. [风险评估](#风险评估)
11. [实施计划](#实施计划)

---

## 🎯 系统概述

### 1.1 系统定位

本系统是一个基于**DDD（领域驱动设计）**和**Clean Architecture（整洁架构）**的多租户SaaS平台，专注于企业级身份与访问管理（IAM）。系统采用租户管理模式，每个租户拥有独立的数据空间和用户体系，确保数据隔离和安全性。

**核心架构理念**：
- **DDD（领域驱动设计）**：以业务领域为核心，通过领域模型、聚合根、领域服务等概念，确保业务逻辑的完整性和一致性
- **Clean Architecture（整洁架构）**：通过分层架构和依赖倒置原则，实现业务逻辑与技术实现的解耦，提高系统的可维护性和可扩展性

### 1.2 核心价值

1. **多租户隔离**: 确保不同租户数据完全隔离，支持企业级数据安全
2. **组织架构管理**: 支持租户内复杂组织架构，满足大型企业需求
3. **灵活的用户管理**: 支持用户多组织归属，适应复杂组织关系
4. **细粒度权限控制**: 基于角色和组织的双重权限控制
5. **完整审计追踪**: 通过事件溯源实现完整的业务操作追踪
6. **自动化流程**: 简化租户申请和用户管理流程，提升管理效率
7. **安全可靠**: 确保数据安全和操作审计，符合企业安全标准
8. **用户租户管理**: 支持用户租户变更和记录追踪，便于组织架构调整

**架构价值**：
9. **业务驱动设计**: 通过DDD确保业务逻辑的完整性和一致性，业务变更时系统架构能够快速响应
10. **技术解耦**: 通过Clean Architecture实现业务逻辑与技术实现的解耦，提高系统的可维护性和可扩展性
11. **领域内聚**: 每个领域模块高度内聚，职责清晰，便于团队协作和功能扩展
12. **依赖倒置**: 通过依赖倒置原则，高层模块不依赖低层模块，抽象不依赖具体实现

### 1.3 系统特性

- **多租户架构**: 支持多租户数据隔离和管理
- **组织架构管理**: 支持租户内组织架构建立和管理
- **多组织用户归属**: 支持用户多组织归属和主要组织设置
- **角色权限管理**: 基于角色的访问控制（RBAC）
- **组织权限管理**: 基于组织的权限控制（OBAC）
- **权限继承机制**: 支持组织权限继承和覆盖
- **事件溯源**: 完整的业务操作事件记录和状态重建
- **申请审核流程**: 完整的申请和审核机制
- **审计日志**: 完整的操作审计和合规性支持
- **高可用性**: 支持高并发和故障恢复
- **可扩展性**: 支持水平扩展和功能扩展
- **多数据库适配**: 支持多种数据库和ORM，默认PostgreSQL+MikroORM，可扩展MongoDB等
- **配置管理**: 统一的配置管理系统，支持多环境、多租户配置

**架构特性**：
- **领域驱动设计**: 基于业务领域进行系统设计，确保业务逻辑的完整性和一致性
- **分层架构**: 清晰的层次结构，每层职责明确，依赖关系清晰
- **模块化设计**: 每个业务模块独立，包含完整的四层架构
- **依赖倒置**: 通过接口和抽象实现依赖倒置，提高系统的灵活性
- **事件驱动**: 通过领域事件实现模块间的松耦合通信
- **聚合根设计**: 通过聚合根确保业务一致性和数据完整性
- **请求追踪**: 每个HTTP请求具有唯一ID，支持全链路追踪
- **租户上下文**: 自动识别和缓存租户ID，支持多租户隔离
- **多数据库适配**: 支持多种数据库和ORM，默认PostgreSQL+MikroORM，可扩展MongoDB等
- **配置管理**: 统一的配置管理系统，支持多环境、多租户配置

---

##  业务需求分析

### 2.1 业务场景分析

#### 2.1.1 租户管理场景

**核心业务场景**：
- 系统初始化时自动创建默认系统租户
- 用户申请创建新租户组织
- 租户信息管理和配置
- 租户管理员更换
- 租户域名管理

**关键业务规则**：
- 只有默认系统租户用户才能申请创建租户
- 租户代码和名称必须全局唯一
- 每个租户有且只能有一个管理员
- 默认系统租户不能被删除或停用

#### 2.1.2 用户管理场景

**核心业务场景**：
- 用户注册和激活
- 用户个人信息管理
- 用户状态管理
- 用户租户变更
- 密码管理

**关键业务规则**：
- 邮箱地址必须全局唯一
- 用户只能归属一个租户
- 租户管理员不能申请租户变更
- 密码必须符合安全要求

#### 2.1.3 权限管理场景

**核心业务场景**：
- 角色定义和管理
- 权限分配和验证
- 用户角色管理
- 权限策略管理

**关键业务规则**：
- 系统管理员拥有所有权限
- 租户管理员拥有本租户所有权限
- 权限基于角色分配
- 权限变更立即生效

#### 2.1.4 组织管理场景

**核心业务场景**：
- 租户建立和管理自己的组织架构
- 组织层级关系管理
- 用户组织归属管理
- 组织权限配置
- 组织数据隔离

**关键业务规则**：
- 每个租户可以建立自己的组织架构
- 组织架构支持多层级父子关系
- 用户必须至少归属一个组织
- 用户可以同时归属多个组织
- 权限管理支持基于组织的权限控制
- 组织间数据默认隔离

### 2.2 用户角色定义

#### 2.2.1 系统管理员 (System Administrator)
- **职责**: 拥有系统最高权限，负责整个系统的管理和维护
- **权限**: 审核租户申请、管理所有租户和用户、监控系统运行状态
- **特点**: 全局权限，不受租户限制

#### 2.2.2 租户管理员 (Tenant Administrator)
- **职责**: 特定租户的管理员，负责该租户内部的管理工作
- **权限**: 管理本租户用户、分配用户角色、管理租户配置
- **特点**: 租户级权限，仅限本租户

#### 2.2.3 组织管理员 (Organization Administrator)
- **职责**: 特定组织的管理员，负责该组织内部的管理工作
- **权限**: 管理本组织用户、配置组织权限、管理组织数据
- **特点**: 组织级权限，仅限本组织及子组织

#### 2.2.4 普通用户 (Regular User)
- **职责**: 系统的基础用户，使用系统提供的业务功能
- **权限**: 使用系统功能、管理个人信息、申请租户变更
- **特点**: 基础权限，受角色、租户和组织限制

---

## 🏗️ 领域划分设计

### 3.1 领域划分原则

基于**DDD核心原则**进行领域划分，确保业务逻辑的完整性和系统架构的合理性：

1. **业务内聚性**: 相关业务功能聚集在同一领域，确保领域内功能的高度内聚
2. **职责单一性**: 每个领域有明确的职责边界，避免职责混淆和功能重复
3. **低耦合高内聚**: 领域间依赖最小化，领域内功能高度内聚
4. **业务变化一致性**: 同一领域内的业务变化频率相近，便于统一管理和维护
5. **团队组织边界**: 便于团队协作和职责分工，支持敏捷开发模式
6. **聚合根设计**: 每个领域都有明确的聚合根，确保业务一致性和数据完整性
7. **领域事件驱动**: 通过领域事件实现领域间的松耦合通信
8. **边界上下文**: 明确定义领域边界，避免领域间的概念混淆

### 3.2 核心领域划分

#### 3.2.1 租户领域 (Tenants Domain)

**领域职责**：
- 租户生命周期管理
- 租户申请和审核流程
- 租户配置和域名管理
- 租户状态管理
- 租户事件溯源

**子领域划分**：
- **management**: 租户的 CRUD 操作、状态管理
- **billing**: 租户计费、套餐管理、支付处理
- **settings**: 租户配置、个性化设置
- **applications**: 租户申请管理 ⭐ 新增
- **tenant-change**: 租户变更管理 ⭐ 新增

**核心概念**：
- **聚合根**: Tenant、TenantApplication、TenantDomainChangeApplication
- **实体**: TenantConfig、TenantDomain
- **值对象**: TenantId、TenantCode、TenantName、TenantStatus
- **领域服务**: TenantDomainService、TenantApplicationDomainService
- **领域事件**: TenantCreatedEvent、TenantRenamedEvent、TenantStatusChangedEvent、TenantApplicationSubmittedEvent、TenantApplicationReviewedEvent、TenantDomainChangedEvent
- **事件溯源**: EventSourcedTenant、TenantEventStore、TenantSnapshotManager

**业务规则**：
- 租户代码和名称必须全局唯一
- 每个租户有且只能有一个管理员
- 默认系统租户不能被删除或停用
- 租户创建必须通过申请审核流程
- 所有租户操作都通过事件记录
- 支持租户状态历史追踪

#### 3.2.2 用户领域 (Users Domain)

**领域职责**：
- 用户基本信息管理
- 用户档案管理
- 用户偏好设置
- 用户事件溯源

**子领域划分**：
- **management**: 用户的 CRUD 操作、状态管理
- **profiles**: 用户档案、个人信息
- **preferences**: 用户偏好设置、个性化配置
- **registration**: 用户注册、账户创建 ⭐ 新增
- **tenant-change**: 用户租户变更管理 ⭐ 新增

**核心概念**：
- **聚合根**: User
- **实体**: UserProfile、UserSettings、UserPreferences
- **值对象**: UserId、Email、Username、Nickname、UserStatus
- **领域服务**: UserDomainService、UserProfileDomainService
- **领域事件**: UserCreatedEvent、UserProfileUpdatedEvent、UserPreferencesChangedEvent、UserStatusChangedEvent
- **事件溯源**: EventSourcedUser、UserEventStore、UserSnapshotManager

**业务规则**：
- 邮箱地址必须全局唯一
- 昵称必须全局唯一
- 用户只能归属一个租户
- 用户必须至少归属一个组织
- 用户可以同时归属多个组织
- 主要组织必须从归属组织中选择
- 所有用户操作都通过事件记录
- 支持用户状态历史追踪

#### 3.2.3 认证领域 (Authentication Domain)

**领域职责**：
- 用户身份验证
- 登录流程管理
- 会话管理
- 多因子认证
- 密码管理
- 认证事件溯源

**子领域划分**：
- **login**: 登录流程、认证策略
- **password**: 密码管理、重置、验证
- **mfa**: 多因子认证、OTP、生物识别
- **sessions**: 会话管理、令牌管理

**核心概念**：
- **聚合根**: LoginSession、MfaDevice、PasswordReset
- **实体**: LoginAttempt、SecurityPolicy、MfaToken
- **值对象**: SessionId、TokenId、LoginStatus、MfaType
- **领域服务**: AuthenticationDomainService、SessionDomainService、MfaDomainService
- **领域事件**: UserLoggedInEvent、UserLoggedOutEvent、SessionCreatedEvent、SessionExpiredEvent、MfaEnabledEvent、PasswordChangedEvent
- **事件溯源**: EventSourcedSession、AuthenticationEventStore、AuthenticationSnapshotManager

**业务规则**：
- 支持多种认证方式（用户名/密码、邮箱/密码、手机号/验证码）
- 会话超时自动失效
- 支持多因子认证
- 密码必须符合安全要求
- 异常登录行为监控
- 所有认证操作都通过事件记录
- 支持安全事件历史追踪

#### 3.2.4 授权领域 (Authorization Domain)

**领域职责**：
- 权限控制管理
- 角色管理
- 访问策略管理
- CASL权限规则管理
- 基于组织的访问控制（OBAC）
- 授权事件溯源

**子领域划分**：
- **permissions**: 权限定义、权限管理
- **roles**: 角色管理、角色分配
- **policies**: 访问策略、策略引擎
- **casl**: CASL 权限库集成
- **obac**: 基于组织的访问控制

**核心概念**：
- **聚合根**: Role、Permission、OrganizationPermission、CaslRule
- **实体**: UserRole、RolePermission、PermissionPolicy、CaslAbility
- **值对象**: RoleId、RoleName、RoleCode、PermissionId、PermissionName、CaslAction、CaslSubject
- **领域服务**: RoleDomainService、PermissionDomainService、AuthorizationDomainService、CaslPermissionDomainService
- **领域事件**: RoleCreatedEvent、PermissionAssignedEvent、UserRoleChangedEvent、CaslRuleUpdatedEvent、OrganizationPermissionChangedEvent
- **事件溯源**: EventSourcedRole、EventSourcedPermission、PermissionEventStore、PermissionSnapshotManager

**业务规则**：
- 系统管理员拥有所有权限
- 租户管理员拥有本租户所有权限
- 组织管理员拥有本组织及子组织权限
- 权限基于角色和组织分配
- 用户权限 = 角色权限 + 所有组织权限的并集
- 权限变更立即生效
- 组织权限可以继承父组织权限
- 使用CASL声明式权限规则
- 支持复杂的权限逻辑组合
- 所有权限操作都通过事件记录
- 支持权限变更历史追踪

#### 3.2.5 租户变更领域 (Tenant Change Domain)

**领域职责**：
- 用户租户变更申请管理
- 租户变更审核流程
- 租户变更历史记录
- 租户管理员更换
- 租户变更事件溯源

**子领域划分**：
- **applications**: 租户变更申请管理
- **approval**: 租户变更审核流程
- **history**: 租户变更历史记录

**核心概念**：
- **聚合根**: UserTenantChangeApplication、UserTenantChangeRecord
- **实体**: TenantChangeRequest、TenantChangeApproval
- **值对象**: ApplicationId、ApplicationStatus、TenantChangeType
- **领域服务**: UserTenantChangeDomainService、TenantChangeApprovalDomainService
- **领域事件**: UserTenantChangeRequestedEvent、UserTenantChangedEvent、TenantChangeApplicationSubmittedEvent、TenantChangeApplicationReviewedEvent、TenantAdminChangedEvent
- **事件溯源**: EventSourcedUserTenantChange、TenantChangeEventStore、TenantChangeSnapshotManager

**业务规则**：
- 租户管理员不能申请租户变更
- 用户不能同时归属多个租户
- 有未处理申请时不能提交新申请
- 租户变更必须通过审核流程
- 所有租户变更操作都通过事件记录
- 支持完整的变更历史追踪



#### 3.2.6 申请审核领域 (Application Review Domain)

**领域职责**：
- 统一申请管理
- 审核流程协调
- 审核规则管理
- 审核历史记录
- 申请审核事件溯源

**子领域划分**：
- **management**: 申请管理、流程协调
- **rules**: 审核规则管理
- **history**: 审核历史记录

**核心概念**：
- **聚合根**: Application、ReviewProcess
- **实体**: ReviewTask、ReviewRule、ReviewHistory
- **值对象**: ApplicationType、ReviewStatus、ReviewResult
- **领域服务**: ApplicationReviewDomainService、ReviewProcessDomainService
- **领域事件**: ApplicationSubmittedEvent、ApplicationReviewedEvent、ReviewProcessCompletedEvent、ReviewTaskAssignedEvent、ReviewTaskCompletedEvent、ReviewRuleUpdatedEvent
- **事件溯源**: EventSourcedApplication、EventSourcedReviewProcess、ApplicationEventStore、ApplicationSnapshotManager

**业务规则**：
- 申请必须通过审核流程
- 审核操作必须记录
- 审核拒绝必须提供原因
- 审核结果必须通知申请人
- 所有申请审核操作都通过事件记录
- 支持完整的审核流程追踪

#### 3.2.7 审计领域 (Audit Domain)

**领域职责**：
- 操作日志记录
- 安全事件监控
- 审计报告生成
- 合规性检查
- 事件溯源管理

**子领域划分**：
- **logging**: 审计日志记录
- **compliance**: 合规性检查
- **reporting**: 审计报告生成

**核心概念**：
- **聚合根**: OperationLog、SecurityEvent、AuditReport
- **实体**: LogEntry、EventRule、ComplianceCheck
- **值对象**: LogId、EventType、SeverityLevel
- **领域服务**: AuditDomainService、MonitoringDomainService、ComplianceDomainService
- **领域事件**: OperationLoggedEvent、SecurityEventDetectedEvent、ComplianceViolationEvent、AuditReportGeneratedEvent、EventReplayCompletedEvent
- **事件溯源**: EventSourcedOperationLog、EventSourcedSecurityEvent、AuditEventStore、AuditSnapshotManager

**业务规则**：
- 所有操作必须记录日志
- 日志不可篡改
- 安全事件实时监控
- 定期生成审计报告
- 所有审计监控操作都通过事件记录
- 支持完整的事件溯源和重放

#### 3.2.8 组织领域 (Organizations Domain)

**领域职责**：
- 组织架构管理
- 组织层级关系管理
- 用户组织归属管理
- 组织权限配置
- 组织数据隔离
- 组织事件溯源

**子领域划分**：
- **management**: 组织管理、CRUD操作
- **hierarchy**: 组织层级关系管理
- **structure**: 组织结构管理
- **user-assignment**: 用户组织分配管理 ⭐ 新增
- **permissions**: 组织权限管理 ⭐ 新增

**核心概念**：
- **聚合根**: Organization、UserOrganization
- **实体**: OrganizationConfig、OrganizationPermission
- **值对象**: OrganizationId、OrganizationCode、OrganizationName、OrganizationStatus
- **领域服务**: OrganizationDomainService、UserOrganizationDomainService、OrganizationPermissionDomainService
- **领域事件**: OrganizationCreatedEvent、OrganizationRenamedEvent、UserOrganizationChangedEvent、OrganizationPermissionChangedEvent、OrganizationHierarchyChangedEvent、UserOrganizationRoleChangedEvent
- **事件溯源**: EventSourcedOrganization、EventSourcedUserOrganization、OrganizationEventStore、OrganizationSnapshotManager
- **缓存服务**: OrganizationCacheService、OrganizationHierarchyCacheService、UserOrganizationCacheService

**业务规则**：
- 组织名称在租户内必须唯一
- 组织代码在租户内必须唯一
- 组织可以设置父组织，形成树形结构
- 用户必须至少归属一个组织
- 用户可以同时归属多个组织
- 组织权限可以继承父组织权限
- 组织间数据默认隔离
- 所有组织操作都通过事件记录
- 支持组织架构变更历史追踪

### 3.3 共享内核领域

#### 3.3.1 系统配置领域 (System Configuration Domain)

**领域职责**：
- 系统参数配置
- 租户默认配置
- 功能开关管理
- 环境配置管理

#### 3.3.2 通知通信领域 (Notification & Communication Domain)

**领域职责**：
- 邮件通知
- 系统消息
- 通知模板管理
- 通知历史记录

**子领域划分**：
- **email**: 邮件通知
- **sms**: 短信通知
- **push**: 推送通知

### 3.4 领域间关系

#### 3.4.1 依赖关系
```
租户领域 ← 用户领域
租户领域 ← 租户变更领域
租户领域 ← 组织领域
用户领域 ← 租户变更领域
用户领域 ← 组织领域
认证领域 ← 用户领域
授权领域 ← 用户领域
授权领域 ← 组织领域
申请审核领域 ← 租户领域
申请审核领域 ← 租户变更领域
审计领域 ← 所有其他领域
通知领域 ← 所有其他领域
```

#### 3.4.2 集成方式
- **事件驱动**: 通过领域事件进行松耦合通信
- **接口契约**: 定义清晰的领域接口
- **共享值对象**: 使用共享的值对象进行数据交换
- **防腐层**: 隔离外部系统依赖

### 3.5 领域边界重新划分总结

#### 3.5.1 重新划分的优势

**单一职责原则**：
- **Users领域**: 专注于用户信息管理，职责更加纯粹
- **Authentication领域**: 专注于身份验证，支持多种认证方式
- **Authorization领域**: 专注于权限控制，集成CASL和OBAC

**高内聚低耦合**：
- 每个领域职责明确，内部高内聚
- 领域间通过接口和事件协作，低耦合
- 便于独立开发、测试和部署

**可扩展性**：
- 认证领域可以支持多种认证方式（OAuth、SAML、LDAP等）
- 授权领域可以集成不同的权限框架（RBAC、ABAC、PBAC等）
- 用户领域可以专注于业务逻辑和数据模型设计

**技术选型灵活性**：
- 认证领域可以选择不同的认证库和策略
- 授权领域可以集成CASL、RBAC、ABAC等不同权限模型
- 用户领域可以专注于DDD建模和业务规则

#### 3.5.2 子领域划分策略

**领域命名规范**：
- **领域名称**: 使用复数形式，如 `tenants`、`users`、`organizations`
- **子领域名称**: 使用名词，如 `management`、`billing`、`authentication`
- **文件命名**: 使用 kebab-case，如 `tenant-management.service.ts`

**子领域职责边界**：
- **management**: 核心的CRUD操作和状态管理
- **profiles**: 用户档案和个性化信息
- **preferences**: 用户偏好和配置设置
- **billing**: 计费和支付相关功能
- **settings**: 配置和个性化设置
- **applications**: 申请流程管理
- **tenant-change**: 租户变更管理
- **registration**: 用户注册和账户创建
- **user-assignment**: 用户组织分配
- **permissions**: 权限管理
- **hierarchy**: 层级关系管理
- **structure**: 结构管理
- **logging**: 日志记录
- **compliance**: 合规检查
- **reporting**: 报告生成
- **rules**: 规则管理
- **history**: 历史记录
- **approval**: 审核流程
- **email**: 邮件通知
- **sms**: 短信通知
- **push**: 推送通知

#### 3.5.3 实施建议

**分阶段实施**：
1. **第一阶段**: 创建新的领域结构，保持向后兼容
2. **第二阶段**: 逐步迁移现有功能到新领域
3. **第三阶段**: 完善领域间接口和事件通信
4. **第四阶段**: 优化和重构，移除旧代码

**接口设计**：
- 定义清晰的领域间接口
- 使用领域事件进行松耦合通信
- 实现防腐层隔离外部依赖

**测试策略**：
- 为每个领域编写独立的单元测试
- 编写领域间的集成测试
- 实现端到端的业务流程测试



---

## 🏗️ 架构设计

### 4.1 整体架构

#### 4.1.1 分层架构 (Layered Architecture)

基于**Clean Architecture（整洁架构）**的分层设计，确保业务逻辑与技术实现的解耦：

1. **Domain Layer (领域层)**
   - 纯业务逻辑，无外部依赖
   - 包含实体、值对象、领域服务、领域事件
   - 定义业务规则和约束
   - 实现DDD核心概念：聚合根、领域服务、领域事件

2. **Application Layer (应用层)**
   - 业务用例协调
   - 包含应用服务、Use Cases（用例）、DTO、接口、校验器
   - 协调领域对象完成业务用例
   - 实现用例编排和业务流程控制
   - **Use Cases**: 定义具体的业务用例，每个用例代表一个完整的业务流程

3. **Infrastructure Layer (基础设施层)**
   - 技术实现细节
   - 包含ORM实体、仓储实现、外部服务集成
   - 提供技术实现支持
   - 实现数据持久化、外部服务调用

4. **Presentation Layer (表现层)**
   - 用户界面和API
   - 包含控制器、表现层DTO、校验器
   - 处理HTTP请求和响应
   - 实现用户交互和数据展示

#### 4.1.2 模块化设计 (Modular Design)

基于**DDD和Clean Architecture**的模块化设计原则：

- 每个业务模块独立，包含完整的四层架构
- 模块间通过接口通信，降低耦合
- 共享层提供通用功能
- 每个模块都有明确的边界和职责
- 支持模块的独立开发、测试和部署

#### 4.1.3 依赖倒置 (Dependency Inversion)

遵循**Clean Architecture**的依赖倒置原则：

- 高层模块不依赖低层模块
- 抽象不依赖具体实现
- 通过依赖注入实现解耦
- 领域层定义接口，基础设施层实现接口
- 确保业务逻辑的独立性和可测试性

### 4.2 技术架构

#### 4.2.1 框架选型
- **NestJS**: 企业级Node.js框架，支持TypeScript
- **Fastify**: 高性能HTTP平台，替代Express
- **TypeScript**: 强类型JavaScript超集

#### 4.2.2 架构模式
- **CQRS**: 命令查询职责分离
- **Event Sourcing**: 事件溯源（所有领域模块实现）
- **Repository Pattern**: 仓储模式（领域层定义接口，基础设施层实现）
- **Factory Pattern**: 工厂模式（聚合根创建和重建）
- **Observer Pattern**: 观察者模式（事件驱动）
- **Aggregate Pattern**: 聚合模式（DDD核心模式）
- **Domain Service Pattern**: 领域服务模式（跨聚合业务逻辑）
- **Value Object Pattern**: 值对象模式（不可变数据对象）
- **Use Case Pattern**: 用例模式（应用层业务用例封装）

#### 4.2.2 数据库与缓存
- **PostgreSQL**: 关系型数据库，支持JSON和复杂查询
- **MikroORM**: TypeScript优先的ORM，支持DDD
- **MongoDB**: 文档型数据库（未来扩展）
- **Redis**: 分布式缓存和会话存储
- **Node-Cache**: 内存缓存
- **Cache-Manager**: 缓存管理器

#### 4.2.3 数据库适配架构
- **数据库抽象层**: 统一的数据库操作接口
- **MikroORM适配器**: 基于MikroORM的多数据库适配
- **连接池管理**: 数据库连接池配置和管理
- **事务管理**: 跨数据库的事务支持
- **迁移管理**: 数据库结构迁移和版本控制
- **数据库驱动**: PostgreSQL驱动 + MongoDB驱动

#### 4.2.4 认证与安全
- **JWT**: JSON Web Token认证
- **bcrypt**: 密码加密
- **Helmet**: 安全中间件
- **CASL**: 声明式权限管理库

#### 4.2.5 监控与追踪
- **OpenTelemetry**: 分布式追踪和指标收集
- **Jaeger**: 分布式追踪系统
- **Prometheus**: 指标监控和告警
- **Grafana**: 监控数据可视化
- **AsyncLocalStorage**: Node.js异步上下文传播
- **UUID**: 唯一标识符生成

#### 4.2.6 日志管理
- **Pino**: 高性能Node.js日志库
- **结构化日志**: JSON格式日志输出
- **日志级别**: error, warn, info, debug, trace
- **日志轮转**: 自动日志文件轮转
- **日志压缩**: 历史日志压缩存储
- **日志查询**: 高性能日志查询和过滤

#### 4.2.7 配置管理
- **ConfigService**: NestJS配置服务
- **环境变量**: 支持.env文件和环境变量
- **配置验证**: Joi配置验证
- **热重载**: 支持配置热重载
- **配置加密**: 敏感配置加密存储
- **配置缓存**: 配置信息缓存机制

### 4.3 项目结构

```
apps/api/src/
├── main.ts                          # 应用入口
├── app.module.ts                    # 根模块
├── app.controller.ts                # 根控制器
├── app.service.ts                   # 根服务
│
├── shared/                          # 共享层
│   ├── domain/                      # 共享领域
│   │   ├── entities/                # 共享实体
│   │   │   └── base.entity.ts      # 基础实体
│   │   ├── value-objects/           # 值对象
│   │   ├── events/                  # 领域事件
│   │   │   ├── base.event.ts       # 基础事件
│   │   │   └── domain-event.ts     # 领域事件基类
│   │   ├── event-sourcing/          # 事件溯源
│   │   │   ├── event-sourced-aggregate.ts
│   │   │   ├── event-store.interface.ts
│   │   │   ├── event-handler.interface.ts
│   │   │   └── snapshot-manager.interface.ts
│   │   └── exceptions/              # 领域异常
│   │
│   ├── infrastructure/              # 共享基础设施
│   │   ├── database/                # 数据库配置
│   │   │   ├── config/             # 数据库配置
│   │   │   │   ├── postgresql.config.ts
│   │   │   │   ├── mongodb.config.ts
│   │   │   │   └── database.config.ts
│   │   │   ├── adapters/           # MikroORM数据库适配器
│   │   │   │   ├── base/           # 基础适配器
│   │   │   │   │   ├── mikroorm-adapter.interface.ts
│   │   │   │   │   ├── connection-manager.interface.ts
│   │   │   │   │   └── transaction-manager.interface.ts
│   │   │   │   ├── postgresql/     # PostgreSQL + MikroORM适配器
│   │   │   │   │   ├── postgresql-mikroorm-adapter.ts
│   │   │   │   │   ├── postgresql-connection-manager.ts
│   │   │   │   │   └── postgresql-transaction-manager.ts
│   │   │   │   └── mongodb/        # MongoDB + MikroORM适配器
│   │   │   │       ├── mongodb-mikroorm-adapter.ts
│   │   │   │       ├── mongodb-connection-manager.ts
│   │   │   │       └── mongodb-transaction-manager.ts
│   │   │   ├── migrations/         # MikroORM迁移
│   │   │   │   ├── postgresql/     # PostgreSQL迁移
│   │   │   │   └── mongodb/        # MongoDB迁移
│   │   │   ├── seeders/            # 数据种子
│   │   │   └── factories/          # 数据库工厂
│   │   │       ├── mikroorm-factory.ts
│   │   │       └── connection-factory.ts
│   │   │
│   │   ├── config/                 # 配置管理
│   │   │   ├── config.module.ts    # 配置模块
│   │   │   ├── config.service.ts   # 配置服务
│   │   │   ├── config.validator.ts # 配置验证器
│   │   │   ├── config.encryption.ts # 配置加密
│   │   │   ├── config.cache.ts     # 配置缓存
│   │   │   ├── schemas/            # 配置模式
│   │   │   │   ├── app.config.schema.ts
│   │   │   │   ├── database.config.schema.ts
│   │   │   │   ├── redis.config.schema.ts
│   │   │   │   ├── jwt.config.schema.ts
│   │   │   │   └── event-sourcing.config.schema.ts
│   │   │   └── loaders/            # 配置加载器
│   │   │       ├── env.config.loader.ts
│   │   │       ├── file.config.loader.ts
│   │   │       └── remote.config.loader.ts
│   │
│   ├── logging/                 # 日志配置
│   │   ├── pino-logger.service.ts
│   │   ├── pino-logger.module.ts
│   │   ├── pino-logger.interceptor.ts
│   │   ├── pino-logger.middleware.ts
│   │   ├── pino-logger.config.ts
│   │   ├── pino-logger.transport.ts
│   │   └── pino-logger.formatter.ts
│   ├── auth/                    # 认证配置
│   ├── cache/                   # 缓存配置
│   │   ├── redis-cache.service.ts
│   │   │   ├── redis-cache.service.ts
│   │   │   ├── memory-cache.service.ts
│   │   │   ├── cache-manager.service.ts
│   │   │   ├── cache-key.factory.ts
│   │   │   └── cache-invalidation.service.ts
│   │   └── event-sourcing/          # 事件溯源实现
│   │       ├── postgres-event-store.ts
│   │       ├── redis-event-cache.ts
│   │       ├── event-publisher.ts
│   │       ├── event-handler-registry.ts
│   │       └── snapshot-manager.ts
│   │
│   ├── application/                 # 共享应用服务
│   │   ├── interfaces/              # 应用接口
│   │   ├── dto/                     # 共享DTO
│   │   └── validators/              # 共享校验器
│   │
│   └── presentation/                # 共享表现层
│       ├── decorators/              # 自定义装饰器
│       ├── guards/                  # 守卫
│       ├── interceptors/            # 拦截器
│       ├── filters/                 # 异常过滤器
│       ├── middlewares/             # 中间件
│       │   ├── request-tracing.middleware.ts
│       │   ├── tenant-context.middleware.ts
│       │   └── correlation.middleware.ts
│       └── context/               # 请求上下文管理
│           ├── request-context.service.ts
│           ├── tenant-context.service.ts
│           └── correlation.service.ts
│
├── modules/                         # 业务模块
│   ├── tenants/                     # 租户领域
│   │   ├── management/              # 租户管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── billing/                 # 租户计费子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── settings/                # 租户设置子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── applications/            # 租户申请子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── tenant-change/           # 租户变更子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── tenants.module.ts
│   │
│   ├── users/                       # 用户领域
│   │   ├── management/              # 用户管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── profiles/                # 用户档案子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── preferences/             # 用户偏好子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── registration/            # 用户注册子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── tenant-change/           # 用户租户变更子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── users.module.ts
│   │
│   ├── authentication/              # 认证领域
│   │   ├── login/                   # 登录子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── password/                # 密码管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── mfa/                     # 多因子认证子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── sessions/                # 会话管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── authentication.module.ts
│   │
│   ├── authorization/               # 授权领域
│   │   ├── permissions/             # 权限管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── roles/                   # 角色管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── policies/                # 策略管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── casl/                    # CASL集成子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── obac/                    # 基于组织的访问控制子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── authorization.module.ts
│   │
│   ├── organizations/               # 组织领域
│   │   ├── management/              # 组织管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── hierarchy/               # 组织层级子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── structure/               # 组织结构子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── user-assignment/         # 用户分配子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── permissions/             # 组织权限子领域 ⭐ 新增
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── organizations.module.ts
│   │
│   ├── tenant-change/               # 租户变更领域
│   │   ├── applications/            # 租户变更申请子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── approval/                # 租户变更审核子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── history/                 # 租户变更历史子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── tenant-change.module.ts
│   │
│   ├── application-review/          # 申请审核领域
│   │   ├── management/              # 申请管理子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── rules/                   # 审核规则子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── history/                 # 审核历史子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── application-review.module.ts
│   │
│   ├── events/                      # 事件领域
│   │   ├── sourcing/                # 事件溯源子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── publishing/              # 事件发布子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── replay/                  # 事件重放子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── events.module.ts
│   │
│   ├── audit/                       # 审计领域
│   │   ├── logging/                 # 审计日志子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── compliance/              # 合规审计子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   ├── reporting/               # 审计报告子领域
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   └── audit.module.ts
│   │
│   └── notifications/               # 通知领域
│       ├── email/                   # 邮件通知子领域
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── presentation/
│       ├── sms/                     # 短信通知子领域
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── presentation/
│       ├── push/                    # 推送通知子领域
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── presentation/
│       └── notifications.module.ts
```

### 4.4 事件溯源架构 (Event Sourcing Architecture)

#### 4.4.1 事件溯源概述
系统采用事件溯源模式，所有领域事件都会被持久化存储，用于状态重建、审计追踪和业务分析。

**核心原则**：
- 所有业务操作都通过事件表示
- 事件是不可变的，一旦创建就不能修改
- 聚合状态通过重放事件重建
- 支持事件版本管理和兼容性

#### 4.4.2 事件存储设计
**事件存储结构**：
```sql
-- 事件表
CREATE TABLE events (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  correlation_id UUID,
  causation_id UUID
);

-- 快照表
CREATE TABLE snapshots (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_version INTEGER NOT NULL,
  aggregate_state JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- 事件订阅表
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY,
  subscriber_name VARCHAR(100) NOT NULL,
  last_processed_event_id UUID,
  last_processed_position BIGINT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### 4.4.3 事件溯源组件

**核心组件**：
- **EventStore**: 事件存储接口和实现
- **EventSourcedAggregate**: 事件溯源聚合根基类
- **EventPublisher**: 事件发布器
- **EventHandler**: 事件处理器
- **SnapshotManager**: 快照管理器
- **EventReplayTool**: 事件重放工具

**事件处理流程**：
1. 聚合根执行业务操作
2. 生成领域事件
3. 事件存储到EventStore
4. 发布事件到事件总线
5. 事件处理器处理事件
6. 定期创建快照优化性能

### 4.5 缓存架构设计 (Caching Architecture)

#### 4.5.1 缓存层次结构
系统采用多级缓存架构，从应用层到数据层提供全面的缓存支持。

**缓存层次**：
1. **应用层缓存**: 内存缓存，最快响应
2. **分布式缓存**: Redis集群，跨实例共享
3. **数据库缓存**: 查询结果缓存，减少数据库压力
4. **CDN缓存**: 静态资源缓存，提升前端性能

#### 4.5.2 缓存策略设计

**缓存分类**：
- **权限缓存**: 用户权限、角色权限、组织权限
- **组织缓存**: 组织架构、层级关系、用户归属
- **会话缓存**: 用户会话、认证信息、访问令牌
- **事件缓存**: 领域事件、聚合快照、事件订阅
- **配置缓存**: 系统配置、租户配置、功能开关

**缓存策略**：
- **TTL策略**: 基于时间的过期策略
- **LRU策略**: 最近最少使用淘汰策略
- **写穿透策略**: 写操作同时更新缓存和数据库
- **写回策略**: 写操作先更新缓存，异步更新数据库
- **失效策略**: 数据变更时主动失效相关缓存

#### 4.5.3 缓存实现方案

**权限缓存实现**：
```typescript
// 用户权限缓存键设计
const userPermissionKey = `user:permissions:${userId}:${tenantId}`
const userRoleKey = `user:roles:${userId}:${tenantId}`
const userOrganizationKey = `user:organizations:${userId}:${tenantId}`

// 组织权限缓存键设计
const organizationPermissionKey = `org:permissions:${organizationId}`
const organizationHierarchyKey = `org:hierarchy:${tenantId}`

// CASL权限能力缓存
const userAbilityKey = `user:ability:${userId}:${tenantId}`
```

**缓存更新策略**：
- **权限变更**: 角色分配、组织权限变更时失效用户权限缓存
- **组织变更**: 组织架构变更时失效相关组织缓存
- **用户变更**: 用户信息变更时失效用户相关缓存
- **租户变更**: 租户配置变更时失效租户相关缓存

**缓存一致性保证**：
- **事件驱动**: 通过领域事件触发缓存失效
- **分布式锁**: 防止缓存击穿和雪崩
- **版本控制**: 缓存版本号确保数据一致性
- **异步更新**: 非关键路径使用异步缓存更新

---

## 🏗️ 核心实体设计

### 5.1 租户管理领域实体

#### 5.1.1 租户实体 (Tenant)
**聚合根，代表系统中的租户组织**

**核心属性**：
- `id: TenantId` - 租户唯一标识
- `code: TenantCode` - 租户代码（全局唯一）
- `name: TenantName` - 租户名称（全局唯一）
- `domain: TenantDomain` - 租户域名
- `status: TenantStatus` - 租户状态（激活/停用）
- `adminId: UserId` - 租户管理员ID
- `config: TenantConfig` - 租户配置信息
- `createdAt: Date` - 创建时间
- `updatedAt: Date` - 更新时间

**业务规则**：
- 租户代码必须全局唯一
- 租户名称必须全局唯一
- 每个租户有且只能有一个管理员
- 默认系统租户不能被删除或停用

#### 5.1.2 租户申请实体 (TenantApplication)
**聚合根，管理租户创建申请流程**

**核心属性**：
- `id: ApplicationId` - 申请唯一标识
- `applicantId: UserId` - 申请人ID
- `tenantName: TenantName` - 申请租户名称
- `tenantCode: TenantCode` - 申请租户代码
- `description: string` - 申请描述
- `status: ApplicationStatus` - 申请状态
- `reviewerId: UserId` - 审核人ID
- `reviewComment: string` - 审核意见
- `reviewedAt: Date` - 审核时间
- `createdAt: Date` - 申请时间

### 5.2 用户管理领域实体

#### 5.2.1 用户实体 (User)
**聚合根，代表系统中的用户**

**核心属性**：
- `id: UserId` - 用户唯一标识
- `email: Email` - 邮箱地址（全局唯一）
- `username: Username` - 用户名
- `nickname: Nickname` - 昵称（全局唯一）
- `password: Password` - 加密密码
- `firstName: string` - 名
- `lastName: string`

---

## 🏗️ DDD与Clean Architecture实施指南

### 7.1 DDD实施原则

#### 7.1.1 领域建模原则
- **以业务为中心**: 所有设计决策都基于业务需求和业务规则
- **统一语言**: 使用业务术语进行沟通和建模，确保开发团队和业务团队语言一致
- **边界上下文**: 明确定义每个领域的边界，避免概念混淆
- **聚合根设计**: 每个聚合都有明确的聚合根，确保业务一致性

#### 7.1.2 领域对象设计
- **实体 (Entity)**: 有唯一标识的对象，可以改变状态
- **值对象 (Value Object)**: 不可变的对象，通过属性值判断相等性
- **聚合根 (Aggregate Root)**: 聚合的入口点，确保业务一致性
- **领域服务 (Domain Service)**: 处理跨聚合的业务逻辑
- **领域事件 (Domain Event)**: 表示领域内发生的重要事件

#### 7.1.3 领域事件设计
- **事件命名**: 使用过去时态，表示已发生的事实
- **事件数据**: 包含事件发生时的完整上下文信息
- **事件发布**: 由聚合根发布，确保事件的一致性
- **事件处理**: 通过事件处理器实现领域间的松耦合通信

### 7.2 Clean Architecture实施原则

#### 7.2.1 分层架构原则
- **依赖方向**: 依赖关系从外向内，内层不依赖外层
- **接口隔离**: 每层通过接口与相邻层交互
- **单一职责**: 每层只负责自己的职责，不越界
- **开闭原则**: 对扩展开放，对修改关闭
- **Use Cases封装**: 应用层通过Use Cases封装业务用例，确保业务逻辑的完整性

#### 7.2.2 依赖倒置原则
- **抽象依赖**: 高层模块依赖抽象，不依赖具体实现
- **接口定义**: 在领域层定义接口，在基础设施层实现
- **依赖注入**: 通过依赖注入容器管理依赖关系
- **测试友好**: 通过抽象接口便于单元测试

#### 7.2.3 模块化设计原则
- **模块边界**: 每个模块有明确的边界和职责
- **模块通信**: 通过接口和事件进行模块间通信
- **模块独立**: 每个模块可以独立开发、测试和部署
- **共享内核**: 通过共享内核提供通用功能

### 7.3 开发实践指南

#### 7.3.1 代码组织
```
modules/tenant-management/
├── domain/                    # 领域层
│   ├── entities/             # 实体
│   ├── value-objects/        # 值对象
│   ├── aggregates/           # 聚合根
│   ├── services/             # 领域服务
│   ├── events/               # 领域事件
│   ├── repositories/         # 仓储接口
│   └── exceptions/           # 领域异常
├── application/              # 应用层
│   ├── services/             # 应用服务
│   ├── use-cases/            # 业务用例
│   │   ├── commands/         # 命令用例
│   │   │   ├── create-tenant.command.ts
│   │   │   ├── register-user.command.ts
│   │   │   └── assign-role.command.ts
│   │   ├── queries/          # 查询用例
│   │   │   ├── get-user-profile.query.ts
│   │   │   ├── get-user-permissions.query.ts
│   │   │   └── get-organization-tree.query.ts
│   │   └── handlers/         # 用例处理器
│   │       ├── create-tenant.handler.ts
│   │       ├── register-user.handler.ts
│   │       └── assign-role.handler.ts
│   ├── dto/                  # 数据传输对象
│   ├── interfaces/           # 应用接口
│   └── validators/           # 应用校验器
├── infrastructure/           # 基础设施层
│   ├── entities/             # ORM实体
│   ├── repositories/         # 仓储实现
│   ├── external/             # 外部服务
│   └── config/               # 配置
└── presentation/             # 表现层
    ├── controllers/          # 控制器
    ├── dto/                  # 表现层DTO
    ├── validators/           # 表现层校验器
    └── guards/               # 守卫
```

#### 7.3.2 命名规范
- **聚合根**: 使用业务术语，如 `Tenant`, `User`, `Organization`
- **实体**: 使用业务概念，如 `TenantConfig`, `UserProfile`
- **值对象**: 使用描述性名称，如 `TenantId`, `Email`, `Password`
- **领域服务**: 以 `DomainService` 结尾，如 `TenantDomainService`
- **应用服务**: 以 `Service` 结尾，如 `TenantApplicationService`
- **仓储接口**: 以 `Repository` 结尾，如 `TenantRepository`
- **Use Cases**: 以 `UseCase` 结尾，如 `CreateTenantUseCase`, `GetUserProfileUseCase`
- **Commands**: 以 `Command` 结尾，如 `CreateTenantCommand`, `AssignRoleCommand`
- **Queries**: 以 `Query` 结尾，如 `GetUserProfileQuery`, `GetUserPermissionsQuery`
- **Handlers**: 以 `Handler` 结尾，如 `CreateTenantHandler`, `GetUserProfileHandler`

#### 7.3.3 测试策略
- **单元测试**: 测试领域对象和领域服务
- **集成测试**: 测试应用服务和仓储实现
- **端到端测试**: 测试完整的业务流程
- **测试数据**: 使用工厂模式创建测试数据
- **Use Cases测试**: 测试业务用例的完整性和一致性
- **命令查询测试**: 分别测试命令和查询用例
- **异常测试**: 测试Use Cases的异常处理逻辑

### 7.4 架构优势

#### 7.4.1 业务优势
- **业务响应性**: 业务变更时系统能够快速响应
- **业务一致性**: 通过聚合根确保业务规则的一致性
- **业务可理解性**: 代码结构反映业务结构，便于理解和维护
- **业务可扩展性**: 新业务功能可以独立开发和部署

#### 7.4.2 技术优势
- **技术独立性**: 业务逻辑与技术实现解耦
- **可测试性**: 通过依赖倒置便于单元测试
- **可维护性**: 清晰的层次结构便于维护和重构
- **可扩展性**: 模块化设计支持水平扩展

#### 7.4.3 团队优势
- **团队协作**: 基于领域边界进行团队分工
- **知识共享**: 统一语言促进团队沟通
- **并行开发**: 模块化设计支持并行开发
- **质量保证**: 清晰的架构便于代码审查和质量控制

### 7.5 Use Cases设计指南

#### 7.5.1 Use Cases概述
Use Cases是应用层的核心组件，负责封装具体的业务用例，协调领域对象完成业务操作。

**Use Cases的特点**：
- **单一职责**: 每个Use Case只负责一个具体的业务用例
- **业务完整性**: 确保业务用例的完整性和一致性
- **协调作用**: 协调多个领域对象完成复杂业务操作
- **事务边界**: 定义业务操作的事务边界
- **输入输出**: 明确的输入参数和输出结果

#### 7.5.2 Use Cases分类

**命令用例 (Commands)**：
- 修改系统状态的业务操作
- 返回操作结果，不返回数据
- 例如：创建租户、注册用户、分配角色

**查询用例 (Queries)**：
- 查询系统数据的业务操作
- 返回查询结果，不修改状态
- 例如：获取用户信息、查询权限、获取组织架构

#### 7.5.3 Use Cases设计模式

**Command Pattern**：
```typescript
// 命令接口
interface ICommand {
  execute(): Promise<CommandResult>;
}

// 命令处理器接口
interface ICommandHandler<T extends ICommand> {
  handle(command: T): Promise<CommandResult>;
}

// 具体命令
class CreateTenantCommand implements ICommand {
  constructor(
    public readonly tenantName: string,
    public readonly tenantCode: string,
    public readonly adminId: string
  ) {}
}

// 命令处理器
class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  async handle(command: CreateTenantCommand): Promise<CommandResult> {
    // 业务逻辑实现
  }
}
```

**Query Pattern**：
```typescript
// 查询接口
interface IQuery<TResult> {
  execute(): Promise<TResult>;
}

// 查询处理器接口
interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

// 具体查询
class GetUserProfileQuery implements IQuery<UserProfileDto> {
  constructor(public readonly userId: string) {}
}

// 查询处理器
class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery, UserProfileDto> {
  async handle(query: GetUserProfileQuery): Promise<UserProfileDto> {
    // 查询逻辑实现
  }
}
```

#### 7.5.4 Use Cases实现原则

**依赖注入**：
- Use Cases通过依赖注入获取领域服务和仓储
- 确保Use Cases的可测试性和可维护性

**事务管理**：
- 每个Use Case定义明确的事务边界
- 确保业务操作的一致性和原子性

**异常处理**：
- 统一的异常处理机制
- 将领域异常转换为应用层异常

**验证逻辑**：
- 输入参数的业务规则验证
- 确保数据的有效性和一致性

#### 7.5.5 Use Cases示例

**创建租户用例**：
```typescript
@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantResult> {
    // 1. 验证输入参数
    await this.validateCommand(command);

    // 2. 检查业务规则
    await this.checkBusinessRules(command);

    // 3. 创建租户聚合根
    const tenant = Tenant.create(
      new TenantId(command.tenantId),
      new TenantName(command.tenantName),
      new TenantCode(command.tenantCode),
      new UserId(command.adminId)
    );

    // 4. 保存租户
    await this.tenantRepository.save(tenant);

    // 5. 发布领域事件
    await this.eventBus.publish(new TenantCreatedEvent(tenant));

    // 6. 返回结果
    return new CreateTenantResult(tenant.id.value);
  }

  private async validateCommand(command: CreateTenantCommand): Promise<void> {
    // 验证逻辑
  }

  private async checkBusinessRules(command: CreateTenantCommand): Promise<void> {
    // 业务规则检查
  }
}
```

**获取用户权限用例**：
```typescript
@Injectable()
export class GetUserPermissionsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly permissionService: IPermissionService,
    private readonly cacheService: ICacheService
  ) {}

  async execute(query: GetUserPermissionsQuery): Promise<UserPermissionsDto> {
    // 1. 尝试从缓存获取
    const cacheKey = `user:permissions:${query.userId}:${query.tenantId}`;
    let permissions = await this.cacheService.get(cacheKey);

    if (!permissions) {
      // 2. 获取用户信息
      const user = await this.userRepository.findById(new UserId(query.userId));
      if (!user) {
        throw new UserNotFoundException(query.userId);
      }

      // 3. 计算用户权限
      permissions = await this.permissionService.calculateUserPermissions(user);

      // 4. 缓存结果
      await this.cacheService.set(cacheKey, permissions, 300);
    }

    // 5. 返回权限信息
    return UserPermissionsDto.fromDomain(permissions);
  }
}
```

#### 7.5.6 Use Cases测试策略

**单元测试**：
- 测试Use Case的业务逻辑
- 模拟依赖的服务和仓储
- 验证输入输出和异常处理

**集成测试**：
- 测试Use Case与领域层的集成
- 验证事务边界和事件发布
- 测试缓存和性能优化

**端到端测试**：
- 测试完整的业务流程
- 验证Use Case在真实环境中的表现
- 测试性能和并发处理

### 4.6 请求追踪与租户上下文架构 (Request Tracing & Tenant Context Architecture)

#### 4.6.1 请求追踪架构
系统实现完整的请求追踪机制，确保每个HTTP请求都有唯一的标识符，支持全链路追踪和问题排查。

**核心组件**：
- **RequestId生成器**: 生成全局唯一的请求ID
- **请求上下文**: 存储请求相关的上下文信息
- **追踪中间件**: 自动注入请求ID和上下文信息
- **日志关联**: 所有日志都关联到请求ID
- **性能监控**: 基于请求ID的性能数据收集

**请求ID格式**：
```typescript
// 请求ID格式：{timestamp}-{random}-{instance}
// 示例：20241201143022-abc123def456-instance-01
const requestId = `${timestamp}-${randomString}-${instanceId}`;
```

#### 4.6.2 租户上下文管理
系统自动识别和管理租户上下文，确保多租户数据隔离和性能优化。

**租户识别策略**：
- **域名识别**: 通过请求域名识别租户
- **子域名识别**: 通过子域名识别租户
- **路径识别**: 通过URL路径识别租户
- **Header识别**: 通过自定义Header识别租户
- **Token识别**: 通过JWT Token识别租户

**租户上下文缓存**：
- **内存缓存**: 租户信息的内存缓存
- **Redis缓存**: 租户信息的分布式缓存
- **缓存策略**: TTL + 变更失效策略
- **缓存键设计**: `tenant:context:${tenantId}`

#### 4.6.3 上下文传播机制
请求上下文信息在整个请求生命周期中自动传播。

**上下文信息**：
```typescript
interface RequestContext {
  requestId: string;           // 请求唯一ID
  tenantId: string;           // 租户ID
  userId: string;             // 用户ID
  correlationId: string;      // 关联ID（用于跨服务追踪）
  timestamp: Date;            // 请求时间戳
  userAgent: string;          // 用户代理
  ipAddress: string;          // IP地址
  sessionId: string;          // 会话ID
}
```

**上下文传播**：
- **HTTP Header**: 通过自定义Header传播
- **AsyncLocalStorage**: Node.js异步上下文传播
- **事件传播**: 领域事件包含上下文信息
- **日志传播**: 所有日志自动包含上下文信息

### 6.8 请求追踪与租户上下文管理流程

#### 6.8.1 请求追踪流程
1. **请求接收**
   - 生成唯一请求ID
   - 创建请求上下文
   - 记录请求开始时间

2. **上下文注入**
   - 将请求ID注入到请求上下文
   - 将上下文信息传播到所有组件
   - 设置AsyncLocalStorage

3. **业务处理**
   - 所有业务操作都关联请求ID
   - 领域事件包含请求上下文
   - 日志记录包含请求ID

4. **响应返回**
   - 记录请求结束时间
   - 计算请求处理时间
   - 清理请求上下文

#### 6.8.2 租户上下文识别流程
1. **租户识别**
   - 解析请求域名/子域名
   - 检查自定义Header
   - 解析JWT Token
   - 确定租户ID

2. **租户验证**
   - 验证租户是否存在
   - 检查租户状态
   - 验证租户权限

3. **上下文缓存**
   - 查询租户信息缓存
   - 缓存未命中时从数据库加载
   - 更新租户信息缓存
   - 设置缓存TTL

4. **上下文传播**
   - 将租户ID注入请求上下文
   - 传播到所有业务组件
   - 确保多租户数据隔离

#### 6.8.3 跨服务追踪流程
1. **关联ID生成**
   - 为每个请求生成关联ID
   - 关联ID在跨服务调用中保持不变
   - 支持分布式追踪

2. **服务间传播**
   - HTTP Header传播关联ID
   - 消息队列传播关联ID
   - 事件总线传播关联ID

3. **追踪数据收集**
   - 收集各服务的处理时间
   - 记录服务间的调用关系
   - 生成完整的调用链路

4. **性能分析**
   - 分析请求处理瓶颈
   - 识别慢查询和性能问题
   - 生成性能报告

### 7.6 请求追踪与租户上下文实现指南

#### 7.6.1 请求追踪中间件实现
```typescript
@Injectable()
export class RequestTracingMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly logger: PinoLogger
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 1. 生成请求ID
    const requestId = this.generateRequestId();
    
    // 2. 创建请求上下文
    const context: RequestContext = {
      requestId,
      tenantId: null,
      userId: null,
      correlationId: req.headers['x-correlation-id'] as string || requestId,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      sessionId: req.session?.id
    };

    // 3. 设置AsyncLocalStorage
    this.requestContextService.setContext(context);

    // 4. 注入请求ID到响应头
    res.setHeader('x-request-id', requestId);

    // 5. 记录请求开始日志
    this.logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip
    });

    // 6. 记录请求结束
    res.on('finish', () => {
      const duration = Date.now() - context.timestamp.getTime();
      this.logger.info('Request finished', {
        requestId,
        statusCode: res.statusCode,
        duration
      });
    });

    next();
  }

  private generateRequestId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const random = Math.random().toString(36).substring(2, 15);
    const instanceId = process.env.INSTANCE_ID || 'instance-01';
    return `${timestamp}-${random}-${instanceId}`;
  }
}
```

#### 7.6.2 租户上下文中间件实现
```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantRepository: ITenantRepository,
    private readonly cacheService: ICacheService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 识别租户
      const tenantId = await this.identifyTenant(req);
      
      if (tenantId) {
        // 2. 获取租户上下文
        const tenantContext = await this.getTenantContext(tenantId);
        
        // 3. 更新请求上下文
        this.tenantContextService.setTenantContext(tenantContext);
        
        // 4. 注入租户信息到请求对象
        req.tenant = tenantContext;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  private async identifyTenant(req: Request): Promise<string | null> {
    // 1. 从域名识别
    const hostname = req.hostname;
    const tenantFromDomain = await this.identifyTenantFromDomain(hostname);
    if (tenantFromDomain) return tenantFromDomain;

    // 2. 从Header识别
    const tenantFromHeader = req.headers['x-tenant-id'] as string;
    if (tenantFromHeader) return tenantFromHeader;

    // 3. 从JWT Token识别
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const tenantFromToken = await this.identifyTenantFromToken(token);
      if (tenantFromToken) return tenantFromToken;
    }

    return null;
  }

  private async getTenantContext(tenantId: string): Promise<TenantContext> {
    // 1. 尝试从缓存获取
    const cacheKey = `tenant:context:${tenantId}`;
    let tenantContext = await this.cacheService.get(cacheKey);

    if (!tenantContext) {
      // 2. 从数据库加载
      const tenant = await this.tenantRepository.findById(new TenantId(tenantId));
      if (!tenant) {
        throw new TenantNotFoundException(tenantId);
      }

      // 3. 创建租户上下文
      tenantContext = {
        tenantId: tenant.id.value,
        tenantCode: tenant.code.value,
        tenantName: tenant.name.value,
        status: tenant.status.value,
        adminId: tenant.adminId.value,
        config: tenant.config
      };

      // 4. 缓存租户上下文
      await this.cacheService.set(cacheKey, tenantContext, 3600); // 1小时TTL
    }

    return tenantContext;
  }
}
```

#### 7.6.3 请求上下文服务实现
```typescript
@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  setContext(context: RequestContext): void {
    this.asyncLocalStorage.enterWith(context);
  }

  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }

  getTenantId(): string | undefined {
    return this.getContext()?.tenantId;
  }

  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  getCorrelationId(): string | undefined {
    return this.getContext()?.correlationId;
  }

  // 用于日志记录
  getLogContext(): Record<string, any> {
    const context = this.getContext();
    if (!context) return {};

    return {
      requestId: context.requestId,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId: context.correlationId,
      timestamp: context.timestamp.toISOString()
    };
  }
}
```

#### 7.6.4 领域事件中的上下文传播
```typescript
// 基础事件类
export abstract class BaseDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly requestId?: string;
  public readonly tenantId?: string;
  public readonly correlationId?: string;

  constructor() {
    this.eventId = generateEventId();
    this.occurredOn = new Date();
    
    // 从请求上下文获取追踪信息
    const context = this.getRequestContext();
    if (context) {
      this.requestId = context.requestId;
      this.tenantId = context.tenantId;
      this.correlationId = context.correlationId;
    }
  }

  private getRequestContext(): RequestContext | undefined {
    // 通过依赖注入获取RequestContextService
    // 这里简化处理，实际应该通过DI容器获取
    return undefined;
  }
}

// 具体事件类
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenant: Tenant
  ) {
    super();
  }
}
```

#### 7.6.5 日志记录中的上下文传播
```typescript
// 自定义日志拦截器
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly logger: PinoLogger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const logContext = this.requestContextService.getLogContext();

    // 为所有日志添加上下文信息
    this.logger.setContext(logContext);

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.info('Request completed successfully', {
            ...logContext,
            responseData: data
          });
        },
        error: (error) => {
          this.logger.error('Request failed', {
            ...logContext,
            error: error.message,
            stack: error.stack
          });
        }
      })
    );
  }
}
```

#### 7.6.6 性能监控集成
```typescript
// 性能监控装饰器
export function MonitorPerformance(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const requestId = this.requestContextService?.getRequestId();
      const tenantId = this.requestContextService?.getTenantId();

      try {
        const result = await originalMethod.apply(this, args);
        
        // 记录性能指标
        const duration = Date.now() - startTime;
        this.metricsService.recordOperationDuration(operation, duration, {
          requestId,
          tenantId,
          success: true
        });

        return result;
      } catch (error) {
        // 记录错误指标
        const duration = Date.now() - startTime;
        this.metricsService.recordOperationDuration(operation, duration, {
          requestId,
          tenantId,
          success: false,
          error: error.message
        });

        throw error;
      }
    };

    return descriptor;
  };
}
```

#### 7.6.7 配置和注册
```typescript
// app.module.ts
@Module({
  imports: [
    // 其他模块...
  ],
  providers: [
    RequestContextService,
    TenantContextService,
    CorrelationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TenantContextGuard,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestTracingMiddleware, TenantContextMiddleware)
      .forRoutes('*');
  }
}
```

### 4.7 MikroORM多数据库适配架构 (MikroORM Multi-Database Architecture)

#### 4.7.1 架构概述
系统基于MikroORM实现多数据库适配，支持PostgreSQL和MongoDB，通过统一的接口和配置实现数据库的灵活切换。

**核心特性**：
- **统一ORM**: 所有数据库操作都基于MikroORM
- **数据库抽象**: 通过接口抽象不同数据库的差异
- **配置驱动**: 通过配置文件切换数据库类型
- **迁移管理**: 统一的数据库迁移和版本控制
- **事务支持**: 跨数据库的事务管理

#### 4.7.2 数据库适配器设计

**基础适配器接口**：
```typescript
interface IMikroOrmAdapter {
  // 数据库连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // 实体管理器
  getEntityManager(): EntityManager;
  
  // 事务管理
  beginTransaction(): Promise<EntityManager>;
  commitTransaction(em: EntityManager): Promise<void>;
  rollbackTransaction(em: EntityManager): Promise<void>;
  
  // 迁移管理
  runMigrations(): Promise<void>;
  createMigration(): Promise<void>;
  
  // 数据库信息
  getDatabaseName(): string;
  getDatabaseType(): DatabaseType;
}
```

**PostgreSQL适配器**：
```typescript
import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';

@Injectable()
export class PostgresqlMikroOrmAdapter implements IMikroOrmAdapter {
  private mikroOrm: MikroORM;
  
  constructor(
    private readonly config: PostgresqlConfig,
    private readonly logger: PinoLogger
  ) {}
  
  async connect(): Promise<void> {
    this.mikroOrm = await MikroORM.init({
      type: 'postgresql',
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      dbName: this.config.database,
      entities: this.config.entities,
      entitiesTs: this.config.entitiesTs,
      migrations: this.config.migrations,
      debug: this.config.debug || false,
      highlighter: new SqlHighlighter(),
      metadataProvider: TsMorphMetadataProvider,
      extensions: [Migrator, EntityGenerator, SeedManager],
      // PostgreSQL特定配置
      pool: {
        min: this.config.pool.min,
        max: this.config.pool.max,
        acquireTimeoutMillis: this.config.pool.acquireTimeout,
        createTimeoutMillis: this.config.pool.createTimeout,
        destroyTimeoutMillis: this.config.pool.destroyTimeout,
        idleTimeoutMillis: this.config.pool.idleTimeout,
        reapIntervalMillis: this.config.pool.reapInterval,
      }
    });
  }
  
  getEntityManager(): EntityManager {
    return this.mikroOrm.em;
  }
  
  async beginTransaction(): Promise<EntityManager> {
    return await this.mikroOrm.em.begin();
  }
  
  async commitTransaction(em: EntityManager): Promise<void> {
    await em.commit();
  }
  
  async rollbackTransaction(em: EntityManager): Promise<void> {
    await em.rollback();
  }
  
  async runMigrations(): Promise<void> {
    await this.mikroOrm.migrator.up();
  }
  
  async createMigration(): Promise<void> {
    await this.mikroOrm.migrator.createMigration();
  }
  
  getDatabaseName(): string {
    return this.config.database;
  }
  
  getDatabaseType(): DatabaseType {
    return DatabaseType.POSTGRESQL;
  }
}
```

**MongoDB适配器**：
```typescript
import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';

@Injectable()
export class MongodbMikroOrmAdapter implements IMikroOrmAdapter {
  private mikroOrm: MikroORM;
  
  constructor(
    private readonly config: MongodbConfig,
    private readonly logger: PinoLogger
  ) {}
  
  async connect(): Promise<void> {
    this.mikroOrm = await MikroORM.init({
      type: 'mongo',
      clientUrl: this.config.url,
      dbName: this.config.database,
      entities: this.config.entities,
      entitiesTs: this.config.entitiesTs,
      migrations: this.config.migrations,
      debug: this.config.debug || false,
      highlighter: new SqlHighlighter(),
      metadataProvider: TsMorphMetadataProvider,
      extensions: [Migrator, EntityGenerator, SeedManager],
      // MongoDB特定配置
      pool: {
        min: this.config.pool.min,
        max: this.config.pool.max,
        acquireTimeoutMillis: this.config.pool.acquireTimeout,
      },
      // MongoDB连接选项
      options: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        maxPoolSize: this.config.pool.max,
        minPoolSize: this.config.pool.min,
      }
    });
  }
  
  getEntityManager(): EntityManager {
    return this.mikroOrm.em;
  }
  
  async beginTransaction(): Promise<EntityManager> {
    // MongoDB 4.0+ 支持事务
    return await this.mikroOrm.em.begin();
  }
  
  async commitTransaction(em: EntityManager): Promise<void> {
    await em.commit();
  }
  
  async rollbackTransaction(em: EntityManager): Promise<void> {
    await em.rollback();
  }
  
  async runMigrations(): Promise<void> {
    await this.mikroOrm.migrator.up();
  }
  
  async createMigration(): Promise<void> {
    await this.mikroOrm.migrator.createMigration();
  }
  
  getDatabaseName(): string {
    return this.config.database;
  }
  
  getDatabaseType(): DatabaseType {
    return DatabaseType.MONGODB;
  }
}
```

#### 4.7.3 数据库工厂模式

**数据库工厂**：
```typescript
@Injectable()
export class MikroOrmFactory {
  constructor(
    private readonly postgresqlConfig: PostgresqlConfig,
    private readonly mongodbConfig: MongodbConfig,
    private readonly logger: PinoLogger
  ) {}
  
  createAdapter(databaseType: DatabaseType): IMikroOrmAdapter {
    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        return new PostgresqlMikroOrmAdapter(this.postgresqlConfig, this.logger);
      
      case DatabaseType.MONGODB:
        return new MongodbMikroOrmAdapter(this.mongodbConfig, this.logger);
      
      default:
        throw new UnsupportedDatabaseTypeError(databaseType);
    }
  }
  
  createConnectionManager(databaseType: DatabaseType): IConnectionManager {
    const adapter = this.createAdapter(databaseType);
    return new MikroOrmConnectionManager(adapter);
  }
}
```

#### 4.7.4 配置管理

**数据库配置接口**：
```typescript
interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  entities: string[];
  migrations: string[];
  pool: {
    min: number;
    max: number;
    acquireTimeout: number;
    createTimeout: number;
    destroyTimeout: number;
    idleTimeout: number;
    reapInterval: number;
  };
}

interface PostgresqlConfig extends DatabaseConfig {
  type: DatabaseType.POSTGRESQL;
  ssl?: boolean;
  schema?: string;
  entitiesTs?: string[];
  debug?: boolean;
}

interface MongodbConfig extends DatabaseConfig {
  type: DatabaseType.MONGODB;
  url: string;
  entitiesTs?: string[];
  debug?: boolean;
  options?: {
    useUnifiedTopology: boolean;
    useNewUrlParser: boolean;
    maxPoolSize: number;
    minPoolSize: number;
  };
}
```

**配置加载**：
```typescript
@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}
  
  getPostgresqlConfig(): PostgresqlConfig {
    return {
      type: DatabaseType.POSTGRESQL,
      host: this.configService.get('database.postgresql.host'),
      port: this.configService.get('database.postgresql.port'),
      user: this.configService.get('database.postgresql.user'),
      password: this.configService.get('database.postgresql.password'),
      database: this.configService.get('database.postgresql.database'),
      entities: this.configService.get('database.postgresql.entities'),
      entitiesTs: this.configService.get('database.postgresql.entitiesTs'),
      migrations: this.configService.get('database.postgresql.migrations'),
      pool: this.configService.get('database.postgresql.pool'),
      ssl: this.configService.get('database.postgresql.ssl'),
      schema: this.configService.get('database.postgresql.schema'),
      debug: this.configService.get('database.postgresql.debug'),
    };
  }
  
  getMongodbConfig(): MongodbConfig {
    return {
      type: DatabaseType.MONGODB,
      url: this.configService.get('database.mongodb.url'),
      database: this.configService.get('database.mongodb.database'),
      entities: this.configService.get('database.mongodb.entities'),
      entitiesTs: this.configService.get('database.mongodb.entitiesTs'),
      migrations: this.configService.get('database.mongodb.migrations'),
      pool: this.configService.get('database.mongodb.pool'),
      options: this.configService.get('database.mongodb.options'),
      debug: this.configService.get('database.mongodb.debug'),
    };
  }
  
  getCurrentDatabaseType(): DatabaseType {
    return this.configService.get('database.current') as DatabaseType;
  }
}
```

#### 4.7.5 仓储实现适配

**基础仓储实现**：
```typescript
@Injectable()
export class BaseRepository<T extends AnyEntity> {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly entityClass: EntityClass<T>
  ) {}
  
  async findById(id: string): Promise<T | null> {
    return await this.entityManager.findOne(this.entityClass, { id } as any);
  }
  
  async save(entity: T): Promise<T> {
    await this.entityManager.persistAndFlush(entity);
    return entity;
  }
  
  async delete(entity: T): Promise<void> {
    await this.entityManager.removeAndFlush(entity);
  }
  
  async findOne(criteria: any): Promise<T | null> {
    return await this.entityManager.findOne(this.entityClass, criteria);
  }
  
  async find(criteria: any): Promise<T[]> {
    return await this.entityManager.find(this.entityClass, criteria);
  }
  
  async count(criteria: any): Promise<number> {
    return await this.entityManager.count(this.entityClass, criteria);
  }
}
```

**租户仓储实现**：
```typescript
@Injectable()
export class TenantRepository extends BaseRepository<TenantEntity> implements ITenantRepository {
  constructor(
    @Inject('DATABASE_ADAPTER') private readonly databaseAdapter: IMikroOrmAdapter
  ) {
    super(databaseAdapter.getEntityManager(), TenantEntity);
  }
  
  async findByCode(code: TenantCode): Promise<TenantEntity | null> {
    return await this.findOne({ code: code.value });
  }
  
  async findByName(name: TenantName): Promise<TenantEntity | null> {
    return await this.findOne({ name: name.value });
  }
  
  async findByDomain(domain: string): Promise<TenantEntity | null> {
    return await this.findOne({ domain });
  }
  
  async findActiveTenants(): Promise<TenantEntity[]> {
    return await this.find({ status: TenantStatus.ACTIVE });
  }
}
```

#### 4.7.6 模块配置

**数据库模块**：
```typescript
@Module({
  imports: [],
  providers: [
    DatabaseConfigService,
    MikroOrmFactory,
    {
      provide: 'DATABASE_ADAPTER',
      useFactory: (factory: MikroOrmFactory, config: DatabaseConfigService) => {
        const databaseType = config.getCurrentDatabaseType();
        return factory.createAdapter(databaseType);
      },
      inject: [MikroOrmFactory, DatabaseConfigService],
    },
    {
      provide: 'CONNECTION_MANAGER',
      useFactory: (factory: MikroOrmFactory, config: DatabaseConfigService) => {
        const databaseType = config.getCurrentDatabaseType();
        return factory.createConnectionManager(databaseType);
      },
      inject: [MikroOrmFactory, DatabaseConfigService],
    },
    // 仓储提供者
    {
      provide: ITenantRepository,
      useClass: TenantRepository,
    },
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
    // 其他仓储...
  ],
  exports: [
    'DATABASE_ADAPTER',
    'CONNECTION_MANAGER',
    ITenantRepository,
    IUserRepository,
    // 其他仓储...
  ],
})
export class DatabaseModule {}
```

#### 4.7.7 环境配置示例

**开发环境配置**：
```yaml
# config/database.yaml
database:
  current: postgresql  # 或 mongodb
  
  postgresql:
    host: localhost
    port: 5432
    user: postgres
    password: password
    database: iam_dev
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: true
    ssl: false
    schema: public
    pool:
      min: 2
      max: 10
      acquireTimeout: 30000
      createTimeout: 30000
      destroyTimeout: 5000
      idleTimeout: 30000
      reapInterval: 1000
  
  mongodb:
    url: mongodb://localhost:27017
    database: iam_dev
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: true
    pool:
      min: 2
      max: 10
      acquireTimeout: 30000
    options:
      useUnifiedTopology: true
      useNewUrlParser: true
      maxPoolSize: 10
      minPoolSize: 2
```

**生产环境配置**：
```yaml
# config/database.yaml
database:
  current: postgresql
  
  postgresql:
    host: ${POSTGRES_HOST}
    port: ${POSTGRES_PORT}
    user: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
    database: ${POSTGRES_DB}
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: false
    ssl: true
    schema: public
    pool:
      min: 5
      max: 20
      acquireTimeout: 60000
      createTimeout: 60000
      destroyTimeout: 10000
      idleTimeout: 60000
      reapInterval: 2000
  
  mongodb:
    url: ${MONGO_URL}
    database: ${MONGO_DB}
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: false
    pool:
      min: 5
      max: 20
      acquireTimeout: 60000
    options:
      useUnifiedTopology: true
      useNewUrlParser: true
      maxPoolSize: 20
      minPoolSize: 5
```

**TypeScript配置文件示例**：
```typescript
// mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  dbName: process.env.POSTGRES_DB || 'iam_system',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: ['dist/migrations/*.js'],
  debug: process.env.NODE_ENV === 'development',
  highlighter: new SqlHighlighter(),
  metadataProvider: TsMorphMetadataProvider,
  extensions: [Migrator, EntityGenerator, SeedManager],
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
  },
  ssl: process.env.NODE_ENV === 'production',
});
```
  
  postgresql:
    host: localhost
    port: 5432
    user: postgres
    password: password
    database: iam_system
    entities: ['dist/**/*.entity.js']
    migrations: ['dist/migrations/*.js']
    pool:
      min: 2
      max: 10
      acquireTimeout: 30000
      createTimeout: 30000
      destroyTimeout: 5000
      idleTimeout: 30000
      reapInterval: 1000
    ssl: false
    schema: public
  
  mongodb:
    url: mongodb://localhost:27017
    database: iam_system
    entities: ['dist/**/*.entity.js']
    migrations: ['dist/migrations/*.js']
    pool:
      min: 2
      max: 10
      acquireTimeout: 30000
    options:
      useUnifiedTopology: true
      useNewUrlParser: true
      maxPoolSize: 10
      minPoolSize: 2
```

#### 4.7.8 迁移管理

**PostgreSQL迁移示例**：
```typescript
// migrations/PostgreSqlMigration20241201.ts
import { Migration } from '@mikro-orm/migrations';

export class PostgreSqlMigration20241201 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) UNIQUE NOT NULL,
        domain VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        admin_id UUID NOT NULL,
        config JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE tenants;');
  }
}
```

**MongoDB迁移示例**：
```typescript
// migrations/MongoDbMigration20241201.ts
import { Migration } from '@mikro-orm/migrations';

export class MongoDbMigration20241201 extends Migration {
  async up(): Promise<void> {
    await this.getCollection('tenants').createIndex(
      { code: 1 },
      { unique: true }
    );
    
    await this.getCollection('tenants').createIndex(
      { name: 1 },
      { unique: true }
    );
  }

  async down(): Promise<void> {
    await this.getCollection('tenants').dropIndex('code_1');
    await this.getCollection('tenants').dropIndex('name_1');
  }
}
```

### 6.9 数据库适配管理流程

#### 6.9.1 数据库连接管理流程
1. **配置加载**
   - 读取数据库配置文件
   - 验证配置参数有效性
   - 确定当前数据库类型

2. **适配器创建**
   - 根据数据库类型创建对应适配器
   - 初始化MikroORM实例
   - 配置连接池参数

3. **连接建立**
   - 建立数据库连接
   - 验证连接状态
   - 记录连接信息

4. **连接监控**
   - 监控连接池状态
   - 检测连接异常
   - 自动重连机制

#### 6.9.2 数据库迁移流程
1. **迁移检测**
   - 检查数据库版本
   - 识别待执行的迁移
   - 验证迁移文件完整性

2. **迁移执行**
   - 按顺序执行迁移文件
   - 记录迁移执行日志
   - 更新数据库版本

3. **迁移回滚**
   - 支持迁移回滚操作
   - 验证回滚安全性
   - 记录回滚日志

4. **迁移验证**
   - 验证迁移执行结果
   - 检查数据完整性
   - 生成迁移报告

#### 6.9.3 数据库切换流程
1. **切换准备**
   - 备份当前数据库
   - 验证目标数据库配置
   - 准备数据迁移脚本

2. **数据迁移**
   - 执行数据导出
   - 转换数据格式
   - 导入目标数据库

3. **配置更新**
   - 更新应用配置
   - 重启应用服务
   - 验证服务状态

4. **切换验证**
   - 验证数据完整性
   - 测试应用功能
   - 监控系统性能

#### 6.9.4 事务管理流程
1. **事务开始**
   - 创建事务上下文
   - 分配事务ID
   - 记录事务开始时间

2. **事务执行**
   - 执行数据库操作
   - 记录操作日志
   - 监控事务状态

3. **事务提交**
   - 验证事务一致性
   - 提交事务变更
   - 释放事务资源

4. **事务回滚**
   - 检测事务异常
   - 回滚事务变更
   - 记录回滚日志
```

### 4.8 配置管理架构 (Configuration Management Architecture)

#### 4.8.1 配置管理概述
系统采用统一的配置管理架构，支持多环境、多租户、多数据库的配置管理，确保配置的安全性、一致性和可维护性。

**核心特性**：
- **分层配置**: 系统级、租户级、环境级配置分层管理
- **配置验证**: 强类型配置验证和模式检查
- **配置加密**: 敏感配置信息加密存储
- **热重载**: 支持配置变更热重载
- **配置缓存**: 高性能配置缓存机制
- **配置审计**: 配置变更审计和版本控制

#### 4.8.2 配置层次结构

**配置层次**：
1. **系统级配置**: 应用基础配置，如端口、日志级别等
2. **环境级配置**: 开发、测试、生产环境特定配置
3. **租户级配置**: 租户特定的业务配置
4. **模块级配置**: 各业务模块的专用配置
5. **运行时配置**: 动态配置和功能开关

**配置优先级**：
```
环境变量 > 租户配置 > 环境配置 > 系统配置 > 默认配置
```

#### 4.8.3 配置管理组件设计

**配置服务接口**：
```typescript
interface IConfigurationService {
  // 基础配置获取
  get<T>(key: string, defaultValue?: T): T;
  getOrThrow<T>(key: string): T;
  
  // 配置验证
  validate(): Promise<ValidationResult>;
  
  // 配置重载
  reload(): Promise<void>;
  
  // 配置监听
  watch(key: string, callback: (value: any) => void): void;
  
  // 配置加密
  encrypt(value: string): string;
  decrypt(value: string): string;
  
  // 租户配置
  getTenantConfig(tenantId: string, key: string): any;
  setTenantConfig(tenantId: string, key: string, value: any): Promise<void>;
}
```

**配置验证器**：
```typescript
@Injectable()
export class ConfigurationValidator {
  private readonly schemas = new Map<string, Joi.ObjectSchema>();

  constructor() {
    this.registerSchemas();
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const [name, schema] of this.schemas) {
      try {
        await schema.validateAsync(config[name]);
      } catch (error) {
        errors.push({
          section: name,
          message: error.message,
          details: error.details
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private registerSchemas(): void {
    // 应用配置模式
    this.schemas.set('app', Joi.object({
      port: Joi.number().port().default(3000),
      host: Joi.string().hostname().default('localhost'),
      environment: Joi.string().valid('development', 'test', 'production').required(),
      logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
      cors: Joi.object({
        enabled: Joi.boolean().default(true),
        origins: Joi.array().items(Joi.string()).default(['*'])
      })
    }));

    // 数据库配置模式
    this.schemas.set('database', Joi.object({
      current: Joi.string().valid('postgresql', 'mongodb').required(),
      postgresql: Joi.object({
        host: Joi.string().required(),
        port: Joi.number().port().default(5432),
        user: Joi.string().required(),
        password: Joi.string().required(),
        database: Joi.string().required(),
        entities: Joi.array().items(Joi.string()).default(['dist/**/*.entity.js']),
        entitiesTs: Joi.array().items(Joi.string()).default(['src/**/*.entity.ts']),
        migrations: Joi.array().items(Joi.string()).default(['dist/migrations/*.js']),
        debug: Joi.boolean().default(false),
        ssl: Joi.boolean().default(false),
        pool: Joi.object({
          min: Joi.number().min(1).default(2),
          max: Joi.number().min(1).default(10),
          acquireTimeout: Joi.number().default(30000)
        })
      }),
      mongodb: Joi.object({
        url: Joi.string().uri().required(),
        database: Joi.string().required(),
        entities: Joi.array().items(Joi.string()).default(['dist/**/*.entity.js']),
        entitiesTs: Joi.array().items(Joi.string()).default(['src/**/*.entity.ts']),
        migrations: Joi.array().items(Joi.string()).default(['dist/migrations/*.js']),
        debug: Joi.boolean().default(false),
        options: Joi.object({
          useUnifiedTopology: Joi.boolean().default(true),
          useNewUrlParser: Joi.boolean().default(true)
        })
      })
    }));

    // Redis配置模式
    this.schemas.set('redis', Joi.object({
      host: Joi.string().required(),
      port: Joi.number().port().default(6379),
      password: Joi.string().optional(),
      db: Joi.number().min(0).default(0),
      keyPrefix: Joi.string().default('iam:'),
      ttl: Joi.number().min(1).default(3600)
    }));

    // JWT配置模式
    this.schemas.set('jwt', Joi.object({
      secret: Joi.string().min(32).required(),
      expiresIn: Joi.string().default('24h'),
      refreshExpiresIn: Joi.string().default('7d'),
      issuer: Joi.string().required(),
      audience: Joi.string().required()
    }));

    // Event Sourcing配置模式
    this.schemas.set('eventSourcing', Joi.object({
      enabled: Joi.boolean().default(true),
      snapshotInterval: Joi.number().min(1).default(100),
      eventRetentionDays: Joi.number().min(1).default(365),
      maxEventSize: Joi.number().min(1024).default(1024 * 1024), // 1MB
      compression: Joi.object({
        enabled: Joi.boolean().default(true),
        algorithm: Joi.string().valid('gzip', 'lz4').default('gzip')
      })
    }));
  }
}
```

**配置加密服务**：
```typescript
@Injectable()
export class ConfigurationEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.CONFIG_ENCRYPTION_KEY || '', 'hex');
    if (this.key.length !== 32) {
      throw new Error('CONFIG_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('config', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('config', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  isEncrypted(value: string): boolean {
    return value.includes(':') && value.split(':').length === 3;
  }
}
```

**配置缓存服务**：
```typescript
@Injectable()
export class ConfigurationCacheService {
  private readonly cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 300000; // 5分钟

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
```

#### 4.8.4 配置加载器设计

**环境变量配置加载器**：
```typescript
@Injectable()
export class EnvironmentConfigLoader {
  load(): Record<string, any> {
    const config: Record<string, any> = {};

    // 应用配置
    config.app = {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || 'localhost',
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    };

    // 数据库配置
    config.database = {
      current: process.env.DATABASE_TYPE || 'postgresql',
      postgresql: {
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        ssl: process.env.POSTGRES_SSL === 'true'
      },
      mongodb: {
        url: process.env.MONGO_URL,
        database: process.env.MONGO_DB
      }
    };

    // Redis配置
    config.redis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    };

    // JWT配置
    config.jwt = {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'iam-system',
      audience: process.env.JWT_AUDIENCE || 'iam-users'
    };

    return config;
  }
}
```

**文件配置加载器**：
```typescript
@Injectable()
export class FileConfigLoader {
  constructor(
    private readonly encryptionService: ConfigurationEncryptionService
  ) {}

  async load(configPath: string): Promise<Record<string, any>> {
    const config = await this.loadConfigFile(configPath);
    return this.decryptSensitiveValues(config);
  }

  private async loadConfigFile(path: string): Promise<Record<string, any>> {
    const ext = path.split('.').pop();
    
    switch (ext) {
      case 'json':
        return JSON.parse(await fs.readFile(path, 'utf8'));
      case 'yaml':
      case 'yml':
        return yaml.load(await fs.readFile(path, 'utf8'));
      case 'js':
        return require(path);
      default:
        throw new Error(`Unsupported config file format: ${ext}`);
    }
  }

  private decryptSensitiveValues(config: any): any {
    if (typeof config === 'string' && this.encryptionService.isEncrypted(config)) {
      return this.encryptionService.decrypt(config);
    }

    if (Array.isArray(config)) {
      return config.map(item => this.decryptSensitiveValues(item));
    }

    if (typeof config === 'object' && config !== null) {
      const decrypted: any = {};
      for (const [key, value] of Object.entries(config)) {
        decrypted[key] = this.decryptSensitiveValues(value);
      }
      return decrypted;
    }

    return config;
  }
}
```

#### 4.8.5 租户配置管理

**租户配置服务**：
```typescript
@Injectable()
export class TenantConfigurationService {
  constructor(
    private readonly configService: IConfigurationService,
    private readonly cacheService: ICacheService
  ) {}

  async getTenantConfig(tenantId: string, key: string): Promise<any> {
    const cacheKey = `tenant:config:${tenantId}:${key}`;
    
    // 尝试从缓存获取
    let config = await this.cacheService.get(cacheKey);
    if (config) return config;

    // 从数据库加载
    config = await this.loadTenantConfigFromDatabase(tenantId, key);
    
    // 缓存配置
    await this.cacheService.set(cacheKey, config, 300); // 5分钟TTL
    
    return config;
  }

  async setTenantConfig(tenantId: string, key: string, value: any): Promise<void> {
    // 保存到数据库
    await this.saveTenantConfigToDatabase(tenantId, key, value);
    
    // 清除缓存
    const cacheKey = `tenant:config:${tenantId}:${key}`;
    await this.cacheService.delete(cacheKey);
    
    // 发布配置变更事件
    await this.publishConfigChangeEvent(tenantId, key, value);
  }

  async getTenantConfigs(tenantId: string): Promise<Record<string, any>> {
    const configs = await this.loadAllTenantConfigsFromDatabase(tenantId);
    return configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, any>);
  }

  private async loadTenantConfigFromDatabase(tenantId: string, key: string): Promise<any> {
    // 从数据库加载租户配置
    // 这里需要实现具体的数据库查询逻辑
    return null;
  }

  private async saveTenantConfigToDatabase(tenantId: string, key: string, value: any): Promise<void> {
    // 保存租户配置到数据库
    // 这里需要实现具体的数据库保存逻辑
  }

  private async publishConfigChangeEvent(tenantId: string, key: string, value: any): Promise<void> {
    // 发布配置变更事件
    // 这里需要实现事件发布逻辑
  }
}
```

#### 4.8.6 配置模块配置

**配置模块**：
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          app: {
            port: parseInt(process.env.PORT || '3000'),
            host: process.env.HOST || 'localhost',
            environment: process.env.NODE_ENV || 'development',
            logLevel: process.env.LOG_LEVEL || 'info'
          },
          database: {
            current: process.env.DATABASE_TYPE || 'postgresql',
            postgresql: {
              host: process.env.POSTGRES_HOST,
              port: parseInt(process.env.POSTGRES_PORT || '5432'),
              user: process.env.POSTGRES_USER,
              password: process.env.POSTGRES_PASSWORD,
              database: process.env.POSTGRES_DB,
              ssl: process.env.POSTGRES_SSL === 'true'
            },
            mongodb: {
              url: process.env.MONGO_URL,
              database: process.env.MONGO_DB
            }
          },
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0')
          },
          jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: process.env.JWT_ISSUER || 'iam-system',
            audience: process.env.JWT_AUDIENCE || 'iam-users'
          },
          eventSourcing: {
            enabled: process.env.EVENT_SOURCING_ENABLED !== 'false',
            snapshotInterval: parseInt(process.env.SNAPSHOT_INTERVAL || '100'),
            eventRetentionDays: parseInt(process.env.EVENT_RETENTION_DAYS || '365'),
            maxEventSize: parseInt(process.env.MAX_EVENT_SIZE || '1048576')
          }
        })
      ],
      validationSchema: Joi.object({
        app: Joi.object({
          port: Joi.number().port().default(3000),
          host: Joi.string().hostname().default('localhost'),
          environment: Joi.string().valid('development', 'test', 'production').required(),
          logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
        }),
        database: Joi.object({
          current: Joi.string().valid('postgresql', 'mongodb').required(),
          postgresql: Joi.object({
            host: Joi.string().required(),
            port: Joi.number().port().default(5432),
            user: Joi.string().required(),
            password: Joi.string().required(),
            database: Joi.string().required()
          }),
          mongodb: Joi.object({
            url: Joi.string().uri().required(),
            database: Joi.string().required()
          })
        }),
        redis: Joi.object({
          host: Joi.string().required(),
          port: Joi.number().port().default(6379),
          password: Joi.string().optional(),
          db: Joi.number().min(0).default(0)
        }),
        jwt: Joi.object({
          secret: Joi.string().min(32).required(),
          expiresIn: Joi.string().default('24h'),
          issuer: Joi.string().required(),
          audience: Joi.string().required()
        }),
        eventSourcing: Joi.object({
          enabled: Joi.boolean().default(true),
          snapshotInterval: Joi.number().min(1).default(100),
          eventRetentionDays: Joi.number().min(1).default(365),
          maxEventSize: Joi.number().min(1024).default(1048576)
        })
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false
      }
    })
  ],
  providers: [
    ConfigurationService,
    ConfigurationValidator,
    ConfigurationEncryptionService,
    ConfigurationCacheService,
    TenantConfigurationService,
    EnvironmentConfigLoader,
    FileConfigLoader
  ],
  exports: [
    ConfigurationService,
    ConfigurationValidator,
    ConfigurationEncryptionService,
    ConfigurationCacheService,
    TenantConfigurationService
  ]
})
export class ConfigurationModule {}
```

#### 4.8.7 环境配置示例

**开发环境配置**：
```yaml
# config/development.yaml
app:
  port: 3000
  host: localhost
  environment: development
  logLevel: debug
  cors:
    enabled: true
    origins: ['http://localhost:3000', 'http://localhost:3001']

database:
  current: postgresql
  postgresql:
    host: localhost
    port: 5432
    user: postgres
    password: password
    database: iam_dev
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: true
    ssl: false
    pool:
      min: 2
      max: 10
      acquireTimeout: 30000
  mongodb:
    url: mongodb://localhost:27017
    database: iam_dev
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: true

redis:
  host: localhost
  port: 6379
  password: null
  db: 0
  keyPrefix: 'iam:dev:'
  ttl: 3600

jwt:
  secret: your-super-secret-jwt-key-for-development-only
  expiresIn: 24h
  refreshExpiresIn: 7d
  issuer: iam-system
  audience: iam-users

eventSourcing:
  enabled: true
  snapshotInterval: 50
  eventRetentionDays: 30
  maxEventSize: 1048576
  compression:
    enabled: true
    algorithm: gzip

logging:
  level: debug
  format: pretty
  destination: console

security:
  bcryptRounds: 10
  sessionTimeout: 3600
  maxLoginAttempts: 5
  lockoutDuration: 900
```

**生产环境配置**：
```yaml
# config/production.yaml
app:
  port: 3000
  host: 0.0.0.0
  environment: production
  logLevel: info
  cors:
    enabled: true
    origins: ['https://your-domain.com']

database:
  current: postgresql
  postgresql:
    host: ${POSTGRES_HOST}
    port: ${POSTGRES_PORT}
    user: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
    database: ${POSTGRES_DB}
    entities: ['dist/**/*.entity.js']
    entitiesTs: ['src/**/*.entity.ts']
    migrations: ['dist/migrations/*.js']
    debug: false
    ssl: true
    pool:
      min: 5
      max: 20
      acquireTimeout: 60000

redis:
  host: ${REDIS_HOST}
  port: ${REDIS_PORT}
  password: ${REDIS_PASSWORD}
  db: 0
  keyPrefix: 'iam:prod:'
  ttl: 1800

jwt:
  secret: ${JWT_SECRET}
  expiresIn: 1h
  refreshExpiresIn: 7d
  issuer: iam-system
  audience: iam-users

eventSourcing:
  enabled: true
  snapshotInterval: 100
  eventRetentionDays: 365
  maxEventSize: 2097152
  compression:
    enabled: true
    algorithm: lz4

logging:
  level: info
  format: json
  destination: file
  file: /var/log/iam-system/app.log

security:
  bcryptRounds: 12
  sessionTimeout: 1800
  maxLoginAttempts: 3
  lockoutDuration: 1800
```

#### 4.8.8 配置管理流程

**配置加载流程**：
1. **环境检测**: 检测当前运行环境
2. **配置加载**: 按优先级加载配置文件
3. **配置验证**: 验证配置的完整性和正确性
4. **配置解密**: 解密敏感配置信息
5. **配置缓存**: 缓存配置信息
6. **配置应用**: 将配置应用到各个模块

**配置更新流程**：
1. **配置变更**: 检测配置变更
2. **配置验证**: 验证新配置的有效性
3. **配置备份**: 备份当前配置
4. **配置应用**: 应用新配置
5. **配置通知**: 通知相关模块配置变更
6. **配置审计**: 记录配置变更日志

**租户配置管理流程**：
1. **配置继承**: 租户配置继承系统默认配置
2. **配置覆盖**: 租户特定配置覆盖默认配置
3. **配置验证**: 验证租户配置的有效性
4. **配置缓存**: 缓存租户配置信息
5. **配置同步**: 同步租户配置到所有实例
6. **配置审计**: 记录租户配置变更

### 6.10 配置管理流程

#### 6.10.1 配置加载流程
1. **环境检测**
   - 检测NODE_ENV环境变量
   - 确定当前运行环境（development/test/production）
   - 加载对应环境的配置文件

2. **配置加载**
   - 按优先级加载配置源
   - 环境变量 > 租户配置 > 环境配置 > 系统配置 > 默认配置
   - 合并配置信息

3. **配置验证**
   - 使用Joi验证配置模式
   - 检查必需配置项
   - 验证配置值类型和范围

4. **配置解密**
   - 识别加密的配置项
   - 使用配置加密服务解密
   - 验证解密结果

5. **配置缓存**
   - 将配置信息缓存到内存
   - 设置缓存TTL
   - 记录缓存状态

6. **配置应用**
   - 将配置应用到各个模块
   - 初始化相关服务
   - 记录配置应用状态

#### 6.10.2 配置更新流程
1. **配置变更检测**
   - 监控配置文件变更
   - 检测环境变量变更
   - 接收配置更新通知

2. **配置验证**
   - 验证新配置的有效性
   - 检查配置依赖关系
   - 验证配置兼容性

3. **配置备份**
   - 备份当前配置
   - 记录配置变更历史
   - 保存配置快照

4. **配置应用**
   - 应用新配置到内存
   - 更新配置缓存
   - 通知相关模块

5. **配置通知**
   - 发布配置变更事件
   - 通知订阅的模块
   - 触发配置重载

6. **配置审计**
   - 记录配置变更日志
   - 生成配置审计报告
   - 保存配置版本信息

#### 6.10.3 租户配置管理流程
1. **配置继承**
   - 租户配置继承系统默认配置
   - 应用租户特定配置
   - 合并配置层次

2. **配置覆盖**
   - 租户特定配置覆盖默认配置
   - 验证配置覆盖规则
   - 应用配置优先级

3. **配置验证**
   - 验证租户配置的有效性
   - 检查租户权限
   - 验证配置约束

4. **配置缓存**
   - 缓存租户配置信息
   - 设置缓存键前缀
   - 管理缓存过期

5. **配置同步**
   - 同步租户配置到所有实例
   - 处理配置冲突
   - 确保配置一致性

6. **配置审计**
   - 记录租户配置变更
   - 生成租户配置报告
   - 保存配置历史

#### 6.10.4 配置安全管理流程
1. **敏感配置识别**
   - 识别敏感配置项
   - 标记需要加密的配置
   - 设置配置安全级别

2. **配置加密**
   - 使用AES-256-GCM加密算法
   - 生成加密密钥
   - 加密敏感配置值

3. **配置存储**
   - 安全存储加密配置
   - 设置访问权限
   - 备份加密密钥

4. **配置访问控制**
   - 控制配置访问权限
   - 记录配置访问日志
   - 监控异常访问

5. **配置审计**
   - 审计配置访问记录
   - 监控配置变更
   - 生成安全报告

### 4.9 Pino日志架构设计 (Pino Logging Architecture)

#### 4.9.1 Pino日志概述
系统采用Pino作为核心日志库，替代NestJS内置Logger，提供高性能、结构化的日志记录能力，支持多环境、多租户的日志管理需求。

**核心特性**：
- **高性能**: Pino是Node.js中最快的日志库之一
- **结构化日志**: JSON格式输出，便于日志分析和处理
- **低内存占用**: 最小化内存使用，适合高并发场景
- **可扩展性**: 支持多种传输方式和格式化
- **多租户支持**: 支持租户级别的日志隔离
- **请求追踪**: 集成请求ID和租户上下文

#### 4.9.2 Pino日志组件设计

**Pino日志服务**：
```typescript
/**
 * @class PinoLoggerService
 * @description Pino日志服务，提供高性能日志记录
 */
@Injectable()
export class PinoLoggerService {
  private readonly logger: pino.Logger;
  private readonly requestContextService: RequestContextService;

  constructor(
    private readonly configService: ConfigService,
    requestContextService: RequestContextService
  ) {
    this.requestContextService = requestContextService;
    this.logger = this.createLogger();
  }

  private createLogger(): pino.Logger {
    const config = this.configService.get('logging');
    
    const pinoConfig: pino.LoggerOptions = {
      level: config.level || 'info',
      name: 'iam-system',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          // 添加请求上下文信息
          const context = this.requestContextService.getLogContext();
          return { ...object, ...context };
        }
      },
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err
      },
      transport: config.transport ? {
        target: config.transport.target,
        options: config.transport.options
      } : undefined
    };

    return pino(pinoConfig);
  }

  // 基础日志方法
  trace(message: string, ...args: any[]): void {
    this.logger.trace(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.logger.error(error || message, ...args);
  }

  fatal(message: string, error?: Error, ...args: any[]): void {
    this.logger.fatal(error || message, ...args);
  }

  // 业务日志方法
  logUserAction(userId: string, action: string, details?: any): void {
    this.info('User action', {
      userId,
      action,
      details,
      type: 'user_action'
    });
  }

  logTenantAction(tenantId: string, action: string, details?: any): void {
    this.info('Tenant action', {
      tenantId,
      action,
      details,
      type: 'tenant_action'
    });
  }

  logSecurityEvent(event: string, details?: any): void {
    this.warn('Security event', {
      event,
      details,
      type: 'security_event'
    });
  }

  logPerformance(operation: string, duration: number, details?: any): void {
    this.info('Performance metric', {
      operation,
      duration,
      details,
      type: 'performance'
    });
  }

  // 获取子日志器
  child(bindings: pino.Bindings): pino.Logger {
    return this.logger.child(bindings);
  }
}
```

**Pino日志中间件**：
```typescript
/**
 * @class PinoLoggingMiddleware
 * @description Pino日志中间件，记录HTTP请求日志
 */
@Injectable()
export class PinoLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly requestContextService: RequestContextService
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.requestContextService.getRequestId();
    const tenantId = this.requestContextService.getTenantId();

    // 记录请求开始
    this.logger.info('HTTP request started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId,
      tenantId
    });

    // 监听响应完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.logger.info('HTTP request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        requestId,
        tenantId,
        contentLength: res.get('Content-Length')
      });
    });

    // 监听响应错误
    res.on('error', (error) => {
      this.logger.error('HTTP response error', error, {
        method: req.method,
        url: req.url,
        requestId,
        tenantId
      });
    });

    next();
  }
}
```

**Pino日志拦截器**：
```typescript
/**
 * @class PinoLoggingInterceptor
 * @description Pino日志拦截器，记录方法调用日志
 */
@Injectable()
export class PinoLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly requestContextService: RequestContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const requestId = this.requestContextService.getRequestId();
    const tenantId = this.requestContextService.getTenantId();

    const startTime = Date.now();

    this.logger.debug('Method call started', {
      className,
      methodName,
      method,
      url,
      requestId,
      tenantId
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.debug('Method call completed', {
            className,
            methodName,
            method,
            url,
            duration,
            requestId,
            tenantId,
            success: true
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error('Method call failed', error, {
            className,
            methodName,
            method,
            url,
            duration,
            requestId,
            tenantId,
            success: false
          });
        }
      })
    );
  }
}
```

**Pino日志配置**：
```typescript
/**
 * @class PinoLoggerConfig
 * @description Pino日志配置管理
 */
@Injectable()
export class PinoLoggerConfig {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): PinoLoggerConfig {
    const config = this.configService.get('logging');
    
    return {
      level: config.level || 'info',
      name: config.name || 'iam-system',
      timestamp: config.timestamp !== false,
      prettyPrint: config.prettyPrint || false,
      destination: config.destination || 1, // stdout
      transport: this.getTransportConfig(config),
      formatters: this.getFormatters(),
      serializers: this.getSerializers(),
      base: this.getBaseConfig()
    };
  }

  private getTransportConfig(config: any): any {
    if (!config.transport) return undefined;

    switch (config.transport.type) {
      case 'file':
        return {
          target: 'pino/file',
          options: {
            destination: config.transport.file,
            mkdir: true
          }
        };
      
      case 'rotating-file':
        return {
          target: 'pino/file',
          options: {
            destination: config.transport.file,
            mkdir: true
          }
        };
      
      case 'pretty':
        return {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        };
      
      default:
        return undefined;
    }
  }

  private getFormatters(): any {
    return {
      level: (label: string) => ({ level: label }),
      log: (object: any) => {
        // 添加时间戳和进程信息
        return {
          ...object,
          timestamp: new Date().toISOString(),
          pid: process.pid,
          hostname: require('os').hostname()
        };
      }
    };
  }

  private getSerializers(): any {
    return {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err
    };
  }

  private getBaseConfig(): any {
    return {
      pid: process.pid,
      hostname: require('os').hostname()
    };
  }
}
```

**Pino日志传输器**：
```typescript
/**
 * @class PinoLoggerTransport
 * @description Pino日志传输器，支持多种输出方式
 */
@Injectable()
export class PinoLoggerTransport {
  constructor(private readonly configService: ConfigService) {}

  createFileTransport(filePath: string): pino.TransportTargetOptions {
    return {
      target: 'pino/file',
      options: {
        destination: filePath,
        mkdir: true
      }
    };
  }

  createRotatingFileTransport(config: any): pino.TransportTargetOptions {
    return {
      target: 'pino/file',
      options: {
        destination: config.file,
        mkdir: true
      }
    };
  }

  createPrettyTransport(): pino.TransportTargetOptions {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: '{msg} {req.method} {req.url} {responseTime}ms'
      }
    };
  }

  createElasticsearchTransport(config: any): pino.TransportTargetOptions {
    return {
      target: 'pino-elasticsearch',
      options: {
        node: config.node,
        index: config.index,
        'es-version': config.version || 7,
        flushBytes: config.flushBytes || 1000
      }
    };
  }

  createDatadogTransport(config: any): pino.TransportTargetOptions {
    return {
      target: 'pino-datadog',
      options: {
        apiKey: config.apiKey,
        service: config.service,
        ddsource: config.source || 'nodejs',
        ddtags: config.tags || ''
      }
    };
  }
}
```

**Pino日志格式化器**：
```typescript
/**
 * @class PinoLoggerFormatter
 * @description Pino日志格式化器，自定义日志格式
 */
@Injectable()
export class PinoLoggerFormatter {
  formatError(error: Error): any {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code
    };
  }

  formatRequest(req: Request): any {
    return {
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
  }

  formatResponse(res: Response): any {
    return {
      statusCode: res.statusCode,
      headers: this.sanitizeHeaders(res.getHeaders()),
      contentLength: res.get('Content-Length')
    };
  }

  formatUserContext(user: any): any {
    return {
      userId: user?.id,
      email: user?.email,
      username: user?.username,
      tenantId: user?.tenantId,
      roles: user?.roles
    };
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
```

#### 4.9.3 Pino日志模块配置

**Pino日志模块**：
```typescript
/**
 * @class PinoLoggerModule
 * @description Pino日志模块配置
 */
@Module({
  imports: [ConfigModule],
  providers: [
    PinoLoggerService,
    PinoLoggerConfig,
    PinoLoggerTransport,
    PinoLoggerFormatter,
    {
      provide: 'PINO_LOGGER',
      useFactory: (config: PinoLoggerConfig) => {
        const pinoConfig = config.getConfig();
        return pino(pinoConfig);
      },
      inject: [PinoLoggerConfig]
    }
  ],
  exports: [
    PinoLoggerService,
    PinoLoggerConfig,
    PinoLoggerTransport,
    PinoLoggerFormatter
  ]
})
export class PinoLoggerModule {}
```

#### 4.9.4 日志配置示例

**开发环境日志配置**：
```yaml
# config/development.yaml
logging:
  level: debug
  name: iam-system-dev
  timestamp: true
  prettyPrint: true
  destination: console
  transport:
    type: pretty
    options:
      colorize: true
      translateTime: 'SYS:standard'
      ignore: 'pid,hostname'
  file:
    enabled: false
  elasticsearch:
    enabled: false
  datadog:
    enabled: false
```

**生产环境日志配置**：
```yaml
# config/production.yaml
logging:
  level: info
  name: iam-system-prod
  timestamp: true
  prettyPrint: false
  destination: file
  transport:
    type: rotating-file
    file: /var/log/iam-system/app.log
    options:
      size: '10m'
      interval: '1d'
      compress: true
      maxFiles: 30
  file:
    enabled: true
    path: /var/log/iam-system
    maxSize: 10m
    maxFiles: 30
    compress: true
  elasticsearch:
    enabled: true
    node: ${ELASTICSEARCH_URL}
    index: iam-system-logs
    version: 7
    flushBytes: 1000
  datadog:
    enabled: true
    apiKey: ${DATADOG_API_KEY}
    service: iam-system
    source: nodejs
    tags: 'env:production,service:iam'
```

#### 4.9.5 日志管理流程

**日志记录流程**：
1. **日志初始化**
   - 加载日志配置
   - 创建Pino日志实例
   - 配置传输器和格式化器
   - 设置日志级别和输出目标

2. **请求日志记录**
   - 生成请求ID
   - 记录请求开始信息
   - 添加请求上下文（租户ID、用户ID等）
   - 记录请求参数和头信息

3. **业务日志记录**
   - 记录业务操作日志
   - 添加操作类型和详情
   - 记录性能指标
   - 记录安全事件

4. **响应日志记录**
   - 记录响应状态码
   - 计算请求处理时间
   - 记录响应大小
   - 记录错误信息（如有）

#### 6.11.2 日志输出流程
1. **日志格式化**
   - 应用结构化格式
   - 添加时间戳和元数据
   - 脱敏敏感信息
   - 统一日志格式

2. **日志传输**
   - 根据环境选择输出方式
   - 开发环境：控制台输出
   - 生产环境：文件或外部服务
   - 支持多种传输目标

3. **日志轮转**
   - 监控日志文件大小
   - 自动创建新日志文件
   - 压缩历史日志文件
   - 清理过期日志文件

4. **日志聚合**
   - 收集多实例日志
   - 统一日志格式
   - 建立日志索引
   - 支持分布式查询

#### 6.11.3 日志查询流程
1. **日志收集**
   - 从多个来源收集日志
   - 统一日志格式和结构
   - 建立日志索引
   - 支持实时和批量收集

2. **日志过滤**
   - 按时间范围过滤
   - 按日志级别过滤
   - 按租户ID过滤
   - 按用户ID过滤
   - 按操作类型过滤

3. **日志搜索**
   - 全文搜索日志内容
   - 结构化字段搜索
   - 支持复杂查询条件
   - 高性能搜索优化

4. **日志分析**
   - 统计分析日志数据
   - 识别异常模式
   - 生成性能报告
   - 安全事件分析

#### 6.11.4 日志监控流程
1. **日志监控**
   - 实时监控日志流
   - 检测异常模式
   - 监控系统性能
   - 监控安全事件

2. **告警规则**
   - 设置告警阈值
   - 定义告警规则
   - 配置告警级别
   - 设置告警通知

3. **告警触发**
   - 检测告警条件
   - 触发告警事件
   - 发送告警通知
   - 记录告警历史

4. **告警处理**
   - 确认告警事件
   - 分析告警原因
   - 执行处理措施
   - 关闭告警事件