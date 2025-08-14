#!/bin/bash

# IAM系统依赖安装脚本
# 自动解决MikroORM版本兼容性问题

set -e

echo "🚀 开始安装IAM系统依赖..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "错误: $1 未安装，请先安装 $1"
        exit 1
    fi
}

# 获取包的最新版本
get_latest_version() {
    local package=$1
    pnpm view $package version 2>/dev/null || echo "not-found"
}

# 检查必要的工具
print_message $BLUE "📋 检查必要的工具..."
check_command "pnpm"
check_command "node"

print_message $GREEN "✅ 工具检查完成"

# 清理之前的安装
print_message $YELLOW "🧹 清理之前的安装..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
rm -rf packages/*/node_modules
rm -f pnpm-lock.yaml

print_message $GREEN "✅ 清理完成"

# 自动检查和修复MikroORM版本
print_message $BLUE "🔍 检查MikroORM版本兼容性..."

# 备份原始package.json
cp apps/api/package.json apps/api/package.json.backup

# 定义需要检查的MikroORM包
declare -A mikroorm_packages=(
    ["@mikro-orm/core"]=""
    ["@mikro-orm/nestjs"]=""
    ["@mikro-orm/postgresql"]=""
    ["@mikro-orm/migrations"]=""
    ["@mikro-orm/seeder"]=""
    ["@mikro-orm/entity-generator"]=""
    ["@mikro-orm/reflection"]=""
    ["@mikro-orm/sql-highlighter"]=""
)

# 定义需要检查的其他包
declare -A other_packages=(
    ["casl"]=""
    ["@casl/ability"]=""
)

# 获取每个包的最新版本
print_message $YELLOW "📦 获取MikroORM包的最新版本..."
for package in "${!mikroorm_packages[@]}"; do
    version=$(get_latest_version $package)
    if [ "$version" != "not-found" ]; then
        mikroorm_packages[$package]=$version
        print_message $GREEN "  ✅ $package: $version"
    else
        print_message $RED "  ❌ $package: 未找到"
    fi
done

print_message $YELLOW "📦 获取其他包的最新版本..."
for package in "${!other_packages[@]}"; do
    version=$(get_latest_version $package)
    if [ "$version" != "not-found" ]; then
        other_packages[$package]=$version
        print_message $GREEN "  ✅ $package: $version"
    else
        print_message $RED "  ❌ $package: 未找到"
    fi
done

# 更新package.json中的版本
print_message $BLUE "📝 更新package.json中的版本..."

# 使用sed更新每个包的版本
print_message $BLUE "  📝 更新MikroORM包版本..."
for package in "${!mikroorm_packages[@]}"; do
    version=${mikroorm_packages[$package]}
    if [ -n "$version" ]; then
        # 转义包名中的特殊字符
        escaped_package=$(echo $package | sed 's/[\/&]/\\&/g')
        # 更新版本
        sed -i "s/\"$escaped_package\": \"\^[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"$escaped_package\": \"^$version\"/g" apps/api/package.json
        print_message $GREEN "    ✅ 更新 $package 到版本 ^$version"
    fi
done

print_message $BLUE "  📝 更新其他包版本..."
for package in "${!other_packages[@]}"; do
    version=${other_packages[$package]}
    if [ -n "$version" ]; then
        # 转义包名中的特殊字符
        escaped_package=$(echo $package | sed 's/[\/&]/\\&/g')
        # 更新版本
        sed -i "s/\"$escaped_package\": \"\^[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"$escaped_package\": \"^$version\"/g" apps/api/package.json
        print_message $GREEN "    ✅ 更新 $package 到版本 ^$version"
    fi
done

print_message $GREEN "✅ 版本更新完成"

# 安装根目录依赖
print_message $BLUE "📦 安装根目录依赖..."
pnpm install

print_message $GREEN "✅ 根目录依赖安装完成"

# 安装API项目依赖
print_message $BLUE "📦 安装API项目依赖..."
cd apps/api
pnpm install

print_message $GREEN "✅ API项目依赖安装完成"

# 安装共享库依赖
print_message $BLUE "📦 安装共享库依赖..."
cd ../../libs/pino-nestjs
pnpm install

print_message $GREEN "✅ 共享库依赖安装完成"

# 回到根目录
cd ../..

# 验证安装
print_message $BLUE "🔍 验证安装..."

# 检查关键包是否安装成功
if [ -d "node_modules/@nestjs" ]; then
    print_message $GREEN "✅ NestJS 安装成功"
else
    print_message $RED "❌ NestJS 安装失败"
    exit 1
fi

if [ -d "apps/api/node_modules/@mikro-orm" ]; then
    print_message $GREEN "✅ MikroORM 安装成功"
else
    print_message $RED "❌ MikroORM 安装失败"
    exit 1
fi

if [ -d "apps/api/node_modules/pino" ]; then
    print_message $GREEN "✅ Pino 安装成功"
else
    print_message $RED "❌ Pino 安装失败"
    exit 1
fi

# 运行类型检查
print_message $BLUE "🔍 运行类型检查..."
cd apps/api
pnpm run build

print_message $GREEN "✅ 类型检查通过"

# 运行测试
print_message $BLUE "🧪 运行测试..."
pnpm test --passWithNoTests

print_message $GREEN "✅ 测试通过"

cd ../..

print_message $GREEN "🎉 所有依赖安装完成！"
print_message $BLUE "📝 下一步："
print_message $YELLOW "  1. 检查 apps/api/package.json 确认版本正确"
print_message $YELLOW "  2. 运行 pnpm dev 启动开发服务器"
print_message $YELLOW "  3. 访问 http://localhost:3000 验证服务"

# 显示安装的版本信息
print_message $BLUE "📊 安装的版本信息："
echo "NestJS: $(cd apps/api && pnpm list @nestjs/core --depth=0 | grep @nestjs/core)"
echo "MikroORM Core: $(cd apps/api && pnpm list @mikro-orm/core --depth=0 | grep @mikro-orm/core)"
echo "MikroORM NestJS: $(cd apps/api && pnpm list @mikro-orm/nestjs --depth=0 | grep @mikro-orm/nestjs)"
echo "Pino: $(cd apps/api && pnpm list pino --depth=0 | grep pino)"

# 显示修复的版本信息
print_message $BLUE "🔧 修复的MikroORM版本："
for package in "${!mikroorm_packages[@]}"; do
    version=${mikroorm_packages[$package]}
    if [ -n "$version" ]; then
        echo "  $package: ^$version"
    fi
done

print_message $BLUE "🔧 修复的其他包版本："
for package in "${!other_packages[@]}"; do
    version=${other_packages[$package]}
    if [ -n "$version" ]; then
        echo "  $package: ^$version"
    fi
done
