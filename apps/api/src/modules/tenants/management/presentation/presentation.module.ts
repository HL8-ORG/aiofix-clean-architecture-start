/**
 * @file presentation.module.ts
 * @description 租户管理表现层模块
 */

import { Module } from '@nestjs/common';
import { TenantController } from './controllers/tenant.controller';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';

/**
 * @class TenantManagementPresentationModule
 * @description 租户管理表现层模块，负责注册租户控制器和相关组件
 * 
 * 核心职责：
 * 1. 注册租户管理相关的控制器
 * 2. 提供表现层依赖的服务
 * 3. 配置表现层的中间件和拦截器
 * 4. 管理租户API的路由和文档
 */
@Module({
  controllers: [
    TenantController,
  ],
  providers: [
    PinoLoggerService,
  ],
  exports: [
    TenantController,
  ],
})
export class TenantManagementPresentationModule { }
