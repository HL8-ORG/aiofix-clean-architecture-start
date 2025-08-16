根据Cursor的官方文档和最佳实践，除了 `rules/` 目录外，`.cursor/` 目录下还有其他约定的目录。让我详细介绍一下：

## �� `.cursor/` 目录的约定结构

### 1. **核心约定目录**

```
.cursor/
├── rules/          # ✅ 官方约定 - AI规则配置
├── settings/       # ✅ 官方约定 - 项目设置
├── snippets/       # ✅ 官方约定 - 代码片段
├── templates/      # ✅ 官方约定 - 代码模板
└── prompts/        # ✅ 官方约定 - 自定义提示词
```

### 2. **各目录的详细说明**

#### 🎯 **rules/** (已使用)
```bash
.cursor/rules/
├── remarks.mdc
├── development-todo-execution-rule.mdc
├── infrastructure-layer-development-rule.mdc
└── ...
```
- **作用**: 定义AI行为规则和代码规范
- **文件格式**: `.mdc` (Markdown with YAML frontmatter)
- **状态**: ✅ 您的项目已在使用

#### ⚙️ **settings/** (可选)
```bash
.cursor/settings/
├── project.json        # 项目特定设置
├── ai-config.json      # AI配置
├── editor-settings.json # 编辑器设置
└── workspace.json      # 工作区设置
```
- **作用**: 存储项目特定的Cursor设置
- **文件格式**: `.json`
- **示例内容**:
```json
{
  "ai": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 4000
  },
  "editor": {
    "formatOnSave": true,
    "tabSize": 2
  }
}
```

#### 📝 **snippets/** (可选)
```bash
.cursor/snippets/
├── nestjs/
│   ├── controller.json
│   ├── service.json
│   └── module.json
├── typescript/
│   ├── interface.json
│   ├── class.json
│   └── function.json
└── testing/
    ├── unit-test.json
    └── integration-test.json
```
- **作用**: 定义可重用的代码片段
- **文件格式**: `.json`
- **示例内容**:
```json
{
  "NestJS Controller": {
    "prefix": "nest-controller",
    "body": [
      "import { Controller, Get, Post, Body, Param } from '@nestjs/common';",
      "",
      "@Controller('${1:resource}')",
      "export class ${2:Name}Controller {",
      "  constructor(private readonly ${3:service}: ${4:Service}) {}",
      "",
      "  @Get()",
      "  findAll() {",
      "    return this.${3:service}.findAll();",
      "  }",
      "",
      "  @Post()",
      "  create(@Body() createDto: Create${2:Name}Dto) {",
      "    return this.${3:service}.create(createDto);",
      "  }",
      "}"
    ],
    "description": "Create a new NestJS controller"
  }
}
```

#### �� **templates/** (可选)
```bash
.cursor/templates/
├── module-template/
│   ├── module.ts.template
│   ├── controller.ts.template
│   ├── service.ts.template
│   └── dto.ts.template
├── domain-template/
│   ├── entity.ts.template
│   ├── repository.ts.template
│   └── service.ts.template
└── test-template/
    ├── unit-test.ts.template
    └── integration-test.ts.template
```
- **作用**: 定义代码生成模板
- **文件格式**: `.template` 或 `.md`
- **示例内容**:
```typescript
// module.ts.template
import { Module } from '@nestjs/common';
import { ${EntityName}Controller } from './${entityName}.controller';
import { ${EntityName}Service } from './${entityName}.service';

@Module({
  controllers: [${EntityName}Controller],
  providers: [${EntityName}Service],
  exports: [${EntityName}Service],
})
export class ${EntityName}Module {}
```

#### �� **prompts/** (可选)
```bash
.cursor/prompts/
├── code-review.md
├── bug-fix.md
├── feature-development.md
├── refactoring.md
└── documentation.md
```
- **作用**: 存储自定义的AI提示词模板
- **文件格式**: `.md`
- **示例内容**:
```markdown
# Code Review Prompt

请对以下代码进行全面的代码审查：

## 审查要点
1. 代码质量和可读性
2. 性能优化机会
3. 安全性考虑
4. 测试覆盖
5. 架构一致性

## 代码
```typescript
${code}
```

请提供详细的审查报告和改进建议。
```

### 3. **在您的项目中的应用建议**

基于您的IAM系统项目，我建议添加以下目录：

#### 🎯 **添加snippets目录**
```bash
.cursor/snippets/
├── ddd/
│   ├── aggregate.json
│   ├── entity.json
│   ├── value-object.json
│   └── domain-service.json
├── nestjs/
│   ├── controller.json
│   ├── service.json
│   ├── module.json
│   └── dto.json
├── mikroorm/
│   ├── entity.json
│   ├── repository.json
│   └── mapper.json
└── testing/
    ├── unit-test.json
    ├── integration-test.json
    └── e2e-test.json
```

#### �� **添加templates目录**
```bash
.cursor/templates/
├── domain-layer/
│   ├── aggregate.template
│   ├── entity.template
│   ├── value-object.template
│   └── domain-service.template
├── application-layer/
│   ├── command.template
│   ├── query.template
│   ├── handler.template
│   └── dto.template
├── infrastructure-layer/
│   ├── entity.template
│   ├── repository.template
│   └── mapper.template
└── presentation-layer/
    ├── controller.template
    └── guard.template
```

#### 💬 **添加prompts目录**
```bash
.cursor/prompts/
├── ddd-development.md
├── clean-architecture.md
├── nestjs-best-practices.md
├── mikroorm-usage.md
└── testing-strategies.md
```

### 4. **创建示例**

让我为您创建一个snippets示例：

Ran tool
让我检查一下当前目录结构：

Ran tool
## 📋 总结

### ✅ **官方约定的目录**

1. **`rules/`** - AI规则配置 (您已在使用)
2. **`settings/`** - 项目设置 (可选)
3. **`snippets/`** - 代码片段 (可选)
4. **`templates/`** - 代码模板 (可选)
5. **`prompts/`** - 自定义提示词 (可选)

### 🎯 **建议为您的项目添加**

基于您的IAM系统项目特点，建议添加：

1. **`snippets/`** - 用于DDD、NestJS、MikroORM的代码片段
2. **`templates/`** - 用于Clean Architecture各层的代码模板
3. **`prompts/`** - 用于特定开发场景的提示词模板

### �� **使用建议**

- **保持官方目录名**: 不要改变目录名称
- **按需添加**: 根据项目需要逐步添加目录
- **团队共享**: 这些配置可以提交到版本控制，团队共享
- **定期维护**: 随着项目发展更新配置

这些目录都是Cursor官方支持的，可以显著提升开发效率和代码质量！