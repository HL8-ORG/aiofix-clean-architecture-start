/**
 * @file event-sourcing.module.ts
 * @description 事件溯源模块
 * 
 * 该模块整合了所有事件溯源相关的服务，包括：
 * - 事件存储
 * - 事件发布器
 * - 事件处理器注册表
 * - 快照管理器
 * - 事件重放工具
 * 
 * 遵循DDD和Clean Architecture原则，提供统一的事件溯源功能。
 */

import { Module, Global } from '@nestjs/common';

/**
 * @class EventSourcingModule
 * @description 事件溯源模块
 * 
 * 提供统一的事件溯源功能，包括：
 * - 事件存储管理
 * - 事件发布和订阅
 * - 事件处理器管理
 * - 快照管理
 * - 事件重放
 * - 事件版本控制
 */
@Global()
@Module({
  imports: [
    // TODO: 导入事件溯源相关依赖
  ],
  providers: [
    // TODO: 添加事件溯源相关服务
    // PostgresEventStore,
    // RedisEventCache,
    // EventPublisher,
    // EventHandlerRegistry,
    // SnapshotManager,
    // EventReplayTool,
  ],
  exports: [
    // TODO: 导出事件溯源相关服务
    // IEventStore,
    // IEventPublisher,
    // IEventHandlerRegistry,
    // ISnapshotManager,
  ],
})
export class EventSourcingModule { }
