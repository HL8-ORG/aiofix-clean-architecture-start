import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { RequestContextService } from './services/request-context.service';
import { RequestContextMiddleware } from './middleware/request-context.middleware';

/**
 * @module ContextModule
 * @description
 * 上下文管理模块，提供基于nestjs-cls的请求上下文管理功能。
 * 
 * 主要功能包括：
 * 1. 配置CLS模块
 * 2. 提供请求上下文服务
 * 3. 提供请求上下文中间件
 * 4. 支持全局上下文管理
 * 
 * 设计原则：
 * - 全局可用：通过全局模块使上下文在整个应用中可用
 * - 自动管理：基于CLS自动管理上下文生命周期
 * - 类型安全：完整的TypeScript类型支持
 * - 性能优化：最小化对应用性能的影响
 */
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // 基础上下文设置，详细设置由中间件处理
          cls.set('requestId', req.headers['x-request-id'] || 'default');
          cls.set('tenantId', req.headers['x-tenant-id']);
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [
    RequestContextService,
    RequestContextMiddleware,
  ],
  exports: [
    RequestContextService,
    RequestContextMiddleware,
  ],
})
export class ContextModule { }
