#!/bin/bash

# 生成子领域README文件的脚本

BASE_DIR="apps/api/src/modules"

# 定义子领域信息
declare -A SUBDOMAINS=(
    # 租户领域
    ["tenants/management"]="租户管理子领域 - 负责租户的核心业务逻辑，包括租户的创建、更新、删除、状态管理等基本操作"
    ["tenants/billing"]="租户计费子领域 - 负责租户的计费、套餐管理、支付处理等业务"
    ["tenants/settings"]="租户设置子领域 - 负责租户的配置管理、个性化设置等"
    ["tenants/applications"]="租户申请子领域 - 负责租户创建申请的流程管理"
    ["tenants/tenant-change"]="租户变更子领域 - 负责租户信息变更的管理"
    
    # 用户领域
    ["users/management"]="用户管理子领域 - 负责用户的核心业务逻辑，包括用户的创建、更新、删除、状态管理等"
    ["users/profiles"]="用户档案子领域 - 负责用户档案、个人信息的管理"
    ["users/preferences"]="用户偏好子领域 - 负责用户偏好设置、个性化配置的管理"
    ["users/registration"]="用户注册子领域 - 负责用户注册、账户创建的业务流程"
    ["users/tenant-change"]="用户租户变更子领域 - 负责用户租户变更的管理"
    
    # 认证领域
    ["authentication/login"]="登录子领域 - 负责用户登录流程、认证策略的管理"
    ["authentication/password"]="密码管理子领域 - 负责密码管理、重置、验证等业务"
    ["authentication/mfa"]="多因子认证子领域 - 负责多因子认证、OTP、生物识别等"
    ["authentication/sessions"]="会话管理子领域 - 负责会话管理、令牌管理等"
    
    # 授权领域
    ["authorization/permissions"]="权限管理子领域 - 负责权限定义、权限管理的核心业务"
    ["authorization/roles"]="角色管理子领域 - 负责角色管理、角色分配的业务逻辑"
    ["authorization/policies"]="策略管理子领域 - 负责访问策略、策略引擎的管理"
    ["authorization/casl"]="CASL集成子领域 - 负责CASL权限库的集成和管理"
    ["authorization/obac"]="基于组织的访问控制子领域 - 负责基于组织的权限控制"
    
    # 组织领域
    ["organizations/management"]="组织管理子领域 - 负责组织架构管理、CRUD操作"
    ["organizations/hierarchy"]="组织层级子领域 - 负责组织层级关系管理"
    ["organizations/structure"]="组织结构子领域 - 负责组织结构管理"
    ["organizations/user-assignment"]="用户分配子领域 - 负责用户组织分配管理"
    ["organizations/permissions"]="组织权限子领域 - 负责组织权限管理"
    
    # 租户变更领域
    ["tenant-change/applications"]="租户变更申请子领域 - 负责租户变更申请的管理"
    ["tenant-change/approval"]="租户变更审核子领域 - 负责租户变更审核流程"
    ["tenant-change/history"]="租户变更历史子领域 - 负责租户变更历史记录"
    
    # 申请审核领域
    ["application-review/management"]="申请管理子领域 - 负责申请管理、流程协调"
    ["application-review/rules"]="审核规则子领域 - 负责审核规则管理"
    ["application-review/history"]="审核历史子领域 - 负责审核历史记录"
    
    # 事件领域
    ["events/sourcing"]="事件溯源子领域 - 负责事件溯源的核心业务"
    ["events/publishing"]="事件发布子领域 - 负责事件发布的管理"
    ["events/replay"]="事件重放子领域 - 负责事件重放的业务逻辑"
    
    # 审计领域
    ["audit/logging"]="审计日志子领域 - 负责审计日志记录"
    ["audit/compliance"]="合规审计子领域 - 负责合规性检查"
    ["audit/reporting"]="审计报告子领域 - 负责审计报告生成"
    
    # 通知领域
    ["notifications/email"]="邮件通知子领域 - 负责邮件通知的管理"
    ["notifications/sms"]="短信通知子领域 - 负责短信通知的管理"
    ["notifications/push"]="推送通知子领域 - 负责推送通知的管理"
)

# 生成README文件的函数
generate_readme() {
    local subdomain_path=$1
    local description=$2
    
    local readme_file="$BASE_DIR/$subdomain_path/README.md"
    
    # 提取子领域名称
    local subdomain_name=$(echo "$subdomain_path" | sed 's/.*\///')
    local domain_name=$(echo "$subdomain_path" | sed 's/\/.*//')
    
    # 生成README内容
    cat > "$readme_file" << EOF
# ${subdomain_name^} 子领域 (${subdomain_name^} Subdomain)

## 概述

${description}

## 职责范围

- [TODO: 添加具体职责]

## 架构分层

### Domain Layer (领域层)
- **entities/**: 实体定义
- **value-objects/**: 值对象
- **aggregates/**: 聚合根
- **services/**: 领域服务
- **events/**: 领域事件
- **repositories/**: 仓储接口

### Application Layer (应用层)
- **services/**: 应用服务
- **use-cases/**: 业务用例
- **dto/**: 数据传输对象
- **interfaces/**: 应用接口

### Infrastructure Layer (基础设施层)
- **entities/**: ORM实体
- **repositories/**: 仓储实现
- **external/**: 外部服务集成

### Presentation Layer (表现层)
- **controllers/**: 控制器
- **dto/**: 请求/响应DTO
- **validators/**: 数据校验器

## 核心概念

### 聚合根
- [TODO: 添加聚合根]

### 实体
- [TODO: 添加实体]

### 值对象
- [TODO: 添加值对象]

### 领域服务
- [TODO: 添加领域服务]

### 领域事件
- [TODO: 添加领域事件]

## 业务规则

1. [TODO: 添加业务规则]

## 依赖关系

- [TODO: 添加依赖关系]

## 开发指南

1. 遵循DDD聚合设计原则
2. 确保业务规则在领域层实现
3. 使用领域事件进行状态变更通知
4. 实现完整的CRUD操作
5. 添加必要的业务验证逻辑
EOF

    echo "Generated README for $subdomain_path"
}

# 主执行逻辑
echo "开始生成子领域README文件..."

# 遍历所有子领域
for subdomain_path in "${!SUBDOMAINS[@]}"; do
    description="${SUBDOMAINS[$subdomain_path]}"
    generate_readme "$subdomain_path" "$description"
done

echo "所有子领域README文件生成完成！"
