/**
 * @file presentation.module.ts
 * @description 认证表现层模块
 */

import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthApplicationService } from '../application/services/auth-application.service';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';

/**
 * @class AuthPresentationModule
 * @description 认证表现层模块，负责注册认证控制器和相关组件
 * 
 * 核心职责：
 * 1. 注册认证相关的控制器
 * 2. 提供表现层依赖的服务
 * 3. 配置认证相关的中间件和拦截器
 * 4. 管理认证API的路由和文档
 */
@Module({
  controllers: [
    AuthController,
  ],
  providers: [
    AuthApplicationService,
    PinoLoggerService,
  ],
  exports: [
    AuthController,
  ],
})
export class AuthPresentationModule { }
