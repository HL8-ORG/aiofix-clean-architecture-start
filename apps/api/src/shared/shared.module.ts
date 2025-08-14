/**
 * @file shared.module.ts
 * @description 共享模块主入口
 * 
 * 该模块整合了所有共享组件，包括：
 * - 共享领域层组件
 * - 共享基础设施层组件
 * - 共享应用层组件
 * - 共享表现层组件
 * 
 * 遵循DDD和Clean Architecture原则，提供跨模块的通用功能。
 */

import { Module, Global } from '@nestjs/common';

// 导入共享基础设施层模块
import { ConfigurationModule } from './infrastructure/config/configuration.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { ContextModule } from './infrastructure/context/context.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EventSourcingModule } from './infrastructure/event-sourcing/event-sourcing.module';

// 导入共享应用层模块
import { SharedApplicationModule } from './application/shared-application.module';

// 导入共享表现层模块
import { SharedPresentationModule } from './presentation/shared-presentation.module';

/**
 * @class SharedModule
 * @description 共享模块
 * 
 * 提供跨模块的通用功能，包括：
 * - 配置管理
 * - 日志系统
 * - 缓存管理
 * - 上下文管理
 * - 数据库适配
 * - 事件溯源
 * - 通用应用服务
 * - 通用表现层组件
 */
@Global()
@Module({
  imports: [
    // 基础设施层模块
    ConfigurationModule,
    LoggingModule,
    CacheModule,
    ContextModule,
    DatabaseModule,
    EventSourcingModule,

    // 应用层模块
    SharedApplicationModule,

    // 表现层模块
    SharedPresentationModule,
  ],
  exports: [
    // 导出基础设施层服务
    ConfigurationModule,
    LoggingModule,
    CacheModule,
    ContextModule,
    DatabaseModule,
    EventSourcingModule,

    // 导出应用层服务
    SharedApplicationModule,

    // 导出表现层组件
    SharedPresentationModule,
  ],
})
export class SharedModule { }
