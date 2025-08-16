/**
 * @file index.ts
 * @description 通知发送管理子领域事件索引文件
 *
 * 导出所有领域事件，提供统一的访问入口
 */

export { NotificationSendingStartedEvent } from './notification-sending-started.event';
export { NotificationSendingCompletedEvent } from './notification-sending-completed.event';
export { NotificationSendingFailedEvent } from './notification-sending-failed.event';
