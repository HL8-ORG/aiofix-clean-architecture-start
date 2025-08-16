/**
 * @file presentation.module.ts
 * @description 用户管理表现层模块
 */

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserApplicationService } from '../application/services/user-application.service';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';

/**
 * @class UserManagementPresentationModule
 * @description 用户管理表现层模块，负责注册控制器和相关组件
 * 
 * 核心职责：
 * 1. 注册用户管理相关的控制器
 * 2. 提供表现层依赖的服务
 * 3. 配置表现层的中间件和拦截器
 * 4. 管理表现层的路由和API文档
 */
@Module({
  controllers: [
    UserController,
  ],
  providers: [
    UserApplicationService,
    PinoLoggerService,
  ],
  exports: [
    UserController,
  ],
})
export class UserManagementPresentationModule { }
