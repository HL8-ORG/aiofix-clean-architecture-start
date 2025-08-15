/**
 * @file index.ts
 * @description 租户管理领域事件索引文件
 * 
 * 导出所有租户相关的领域事件，方便统一导入和管理
 */

export { TenantCreatedEvent } from './tenant-created.event';
export { TenantRenamedEvent } from './tenant-renamed.event';
export { TenantStatusChangedEvent } from './tenant-status-changed.event';
export { TenantAdminChangedEvent } from './tenant-admin-changed.event';

// 事件类型常量
export const TENANT_EVENT_TYPES = {
  TENANT_CREATED: 'TenantCreated',
  TENANT_RENAMED: 'TenantRenamed',
  TENANT_STATUS_CHANGED: 'TenantStatusChanged',
  TENANT_ADMIN_CHANGED: 'TenantAdminChanged',
} as const;

// 事件类型类型
export type TenantEventType = typeof TENANT_EVENT_TYPES[keyof typeof TENANT_EVENT_TYPES];
