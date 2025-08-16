/**
 * @file shared-application.module.ts
 * @description 共享应用层模块
 * 
 * 该模块提供跨模块的通用应用服务，包括：
 * - 通用DTO
 * - 通用接口
 * - 通用校验器
 * - 通用应用服务
 * 
 * 遵循DDD和Clean Architecture原则，提供应用层的通用功能。
 */

import { Module } from '@nestjs/common';

// 导出所有CQRS基础设施
export * from './interfaces/command.interface';
export * from './interfaces/query.interface';
export * from './interfaces/command-handler.interface';
export * from './interfaces/query-handler.interface';
export * from './interfaces/command-bus.interface';
export * from './interfaces/query-bus.interface';

export * from './base/base-command';
export * from './base/base-query';

export * from './bus/command-bus';
export * from './bus/query-bus';

export * from './base/base-command-handler';
export * from './base/base-query-handler';

export * from './factories/application-module-factory';

/**
 * @module SharedApplicationModule
 * @description
 * 共享应用层模块，提供CQRS架构的基础设施和通用组件。
 * 
 * 主要原理与机制如下：
 * 1. 模块化设计：将CQRS基础设施组织为独立的模块，便于复用和维护。
 * 2. 依赖注入：通过NestJS的依赖注入系统管理CQRS组件的生命周期。
 * 3. 接口分离：提供清晰的接口定义，支持不同实现的替换。
 * 4. 类型安全：通过TypeScript提供完整的类型安全支持。
 * 
 * 功能与职责：
 * - 提供CQRS架构的基础接口和抽象类
 * - 实现命令和查询总线
 * - 导出所有CQRS相关组件
 * - 支持应用层的CQRS实现
 */
@Module({
  providers: [],
  exports: [],
})
export class SharedApplicationModule { }
