#!/bin/bash

# IAM系统开发环境启动脚本

set -e

echo "🚀 启动IAM系统开发环境..."

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

# 检查必要的工具
print_message $BLUE "📋 检查必要的工具..."
check_command "pnpm"
check_command "node"

print_message $GREEN "✅ 工具检查完成"

# 检查依赖是否已安装
print_message $BLUE "🔍 检查依赖安装状态..."
if [ ! -d "node_modules" ]; then
    print_message $YELLOW "⚠️  依赖未安装，正在运行安装脚本..."
    ./scripts/install-dependencies.sh
fi

if [ ! -d "apps/api/node_modules" ]; then
    print_message $YELLOW "⚠️  API项目依赖未安装，正在安装..."
    cd apps/api && pnpm install && cd ../..
fi

print_message $GREEN "✅ 依赖检查完成"

# 检查构建状态
print_message $BLUE "🔍 检查构建状态..."
if [ ! -d "apps/api/dist" ] || [ ! -f "apps/api/dist/main.js" ]; then
    print_message $YELLOW "⚠️  项目未构建，正在构建..."
    cd apps/api && pnpm run build && cd ../..
fi

print_message $GREEN "✅ 构建检查完成"

# 启动开发服务器
print_message $BLUE "🚀 启动开发服务器..."
print_message $YELLOW "📝 服务将在以下地址启动："
print_message $YELLOW "  - API服务: http://localhost:3000"
print_message $YELLOW "  - API文档: http://localhost:3000/api"
print_message $YELLOW ""
print_message $YELLOW "按 Ctrl+C 停止服务"

cd apps/api
pnpm run start:dev
