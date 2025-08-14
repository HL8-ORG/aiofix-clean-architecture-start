#!/bin/bash

# IAM系统项目状态检查脚本

echo "🔍 IAM系统项目状态检查..."

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

# 检查目录是否存在
check_directory() {
    local dir=$1
    local name=$2
    if [ -d "$dir" ]; then
        print_message $GREEN "✅ $name: 存在"
        return 0
    else
        print_message $RED "❌ $name: 不存在"
        return 1
    fi
}

# 检查文件是否存在
check_file() {
    local file=$1
    local name=$2
    if [ -f "$file" ]; then
        print_message $GREEN "✅ $name: 存在"
        return 0
    else
        print_message $RED "❌ $name: 不存在"
        return 1
    fi
}

# 检查命令是否存在
check_command() {
    local cmd=$1
    local name=$2
    if command -v $cmd &> /dev/null; then
        print_message $GREEN "✅ $name: 已安装"
        return 0
    else
        print_message $RED "❌ $name: 未安装"
        return 1
    fi
}

print_message $BLUE "📋 检查基础工具..."
check_command "node" "Node.js"
check_command "pnpm" "pnpm"
check_command "git" "Git"

print_message $BLUE "📁 检查项目结构..."
check_directory "apps/api" "API项目目录"
check_directory "libs/pino-nestjs" "Pino日志库目录"
check_directory "docs" "文档目录"
check_directory "scripts" "脚本目录"

print_message $BLUE "📦 检查依赖安装..."
check_directory "node_modules" "根目录依赖"
check_directory "apps/api/node_modules" "API项目依赖"
check_directory "libs/pino-nestjs/node_modules" "Pino库依赖"

print_message $BLUE "🔧 检查构建状态..."
check_directory "apps/api/dist" "API构建目录"
check_file "apps/api/dist/main.js" "API主文件"

print_message $BLUE "📄 检查配置文件..."
check_file "package.json" "根目录package.json"
check_file "apps/api/package.json" "API项目package.json"
check_file "pnpm-workspace.yaml" "pnpm工作区配置"
check_file "turbo.json" "Turbo配置"

print_message $BLUE "🧪 检查测试状态..."
if [ -d "apps/api" ]; then
    cd apps/api
    if pnpm test --passWithNoTests &> /dev/null; then
        print_message $GREEN "✅ API测试: 通过"
    else
        print_message $RED "❌ API测试: 失败"
    fi
    cd ../..
fi

print_message $BLUE "🔨 检查构建状态..."
if [ -d "apps/api" ]; then
    cd apps/api
    if pnpm run build &> /dev/null; then
        print_message $GREEN "✅ API构建: 成功"
    else
        print_message $RED "❌ API构建: 失败"
    fi
    cd ../..
fi

print_message $BLUE "📊 项目状态总结..."
echo ""
print_message $GREEN "🎉 项目初始化完成！"
print_message $BLUE "📝 下一步操作："
print_message $YELLOW "  1. 运行 'pnpm start:dev' 启动开发服务器"
print_message $YELLOW "  2. 运行 'pnpm api:dev' 直接启动API服务"
print_message $YELLOW "  3. 访问 http://localhost:3000 验证服务"
print_message $YELLOW "  4. 开始按照 development-todo-list.md 进行开发"
