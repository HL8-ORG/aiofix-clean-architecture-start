import { Notification } from '../entities/notification.entity';
import { NotificationId } from '../value-objects/notification-id';
import { NotificationStatus, NotificationStatusEnum } from '../value-objects/notification-status';
import { NotificationType, NotificationTypeEnum } from '../value-objects/notification-type';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @interface INotificationRepository
 * @description
 * 通知仓储接口，定义通知实体的数据访问契约。
 * 
 * 主要功能与职责：
 * 1. 定义通知实体的基本CRUD操作
 * 2. 提供按条件查询通知的方法
 * 3. 支持通知状态管理和统计查询
 * 4. 支持分页和排序查询
 * 5. 提供批量操作和性能优化方法
 * 
 * 业务规则：
 * - 通知ID必须唯一
 * - 支持按接收者、租户、状态等条件查询
 * - 支持通知历史记录查询
 * - 支持通知统计和分析
 */
export interface INotificationRepository {
  /**
   * @method save
   * @description 保存通知实体
   * @param notification 通知实体
   * @returns Promise<void>
   */
  save(notification: Notification): Promise<void>;

  /**
   * @method findById
   * @description 根据ID查找通知
   * @param id 通知ID
   * @returns Promise<Notification | null>
   */
  findById(id: NotificationId): Promise<Notification | null>;

  /**
   * @method findByRecipientId
   * @description 根据接收者ID查找通知
   * @param recipientId 接收者ID
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findByRecipientId(
    recipientId: UserId,
    options?: {
      status?: NotificationStatus;
      type?: NotificationType;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Notification[]>;

  /**
   * @method findByTenantId
   * @description 根据租户ID查找通知
   * @param tenantId 租户ID
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findByTenantId(
    tenantId: TenantId,
    options?: {
      status?: NotificationStatus;
      type?: NotificationType;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Notification[]>;

  /**
   * @method findByStatus
   * @description 根据状态查找通知
   * @param status 通知状态
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findByStatus(
    status: NotificationStatus,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Notification[]>;

  /**
   * @method findByType
   * @description 根据类型查找通知
   * @param type 通知类型
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findByType(
    type: NotificationType,
    options?: {
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Notification[]>;

  /**
   * @method findPendingNotifications
   * @description 查找待发送的通知
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findPendingNotifications(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Notification[]>;

  /**
   * @method findFailedNotifications
   * @description 查找发送失败的通知
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findFailedNotifications(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Notification[]>;

  /**
   * @method findUnreadNotifications
   * @description 查找未读通知
   * @param recipientId 接收者ID
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findUnreadNotifications(
    recipientId: UserId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Notification[]>;

  /**
   * @method findAll
   * @description 查找所有通知
   * @param options 查询选项
   * @returns Promise<Notification[]>
   */
  findAll(options?: {
    status?: NotificationStatus;
    type?: NotificationType;
    recipientId?: UserId;
    tenantId?: TenantId;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Notification[]>;

  /**
   * @method count
   * @description 统计通知数量
   * @param filter 过滤条件
   * @returns Promise<number>
   */
  count(filter?: {
    status?: NotificationStatus;
    type?: NotificationType;
    recipientId?: UserId;
    tenantId?: TenantId;
  }): Promise<number>;

  /**
   * @method countByRecipientId
   * @description 统计接收者的通知数量
   * @param recipientId 接收者ID
   * @param filter 过滤条件
   * @returns Promise<number>
   */
  countByRecipientId(
    recipientId: UserId,
    filter?: {
      status?: NotificationStatus;
      type?: NotificationType;
    }
  ): Promise<number>;

  /**
   * @method countByTenantId
   * @description 统计租户的通知数量
   * @param tenantId 租户ID
   * @param filter 过滤条件
   * @returns Promise<number>
   */
  countByTenantId(
    tenantId: TenantId,
    filter?: {
      status?: NotificationStatus;
      type?: NotificationType;
    }
  ): Promise<number>;

  /**
   * @method delete
   * @description 删除通知
   * @param id 通知ID
   * @returns Promise<void>
   */
  delete(id: NotificationId): Promise<void>;

  /**
   * @method deleteByRecipientId
   * @description 删除接收者的所有通知
   * @param recipientId 接收者ID
   * @returns Promise<void>
   */
  deleteByRecipientId(recipientId: UserId): Promise<void>;

  /**
   * @method deleteByTenantId
   * @description 删除租户的所有通知
   * @param tenantId 租户ID
   * @returns Promise<void>
   */
  deleteByTenantId(tenantId: TenantId): Promise<void>;

  /**
   * @method exists
   * @description 检查通知是否存在
   * @param id 通知ID
   * @returns Promise<boolean>
   */
  exists(id: NotificationId): Promise<boolean>;

  /**
   * @method markAllAsRead
   * @description 标记所有通知为已读
   * @param recipientId 接收者ID
   * @returns Promise<void>
   */
  markAllAsRead(recipientId: UserId): Promise<void>;

  /**
   * @method getNotificationStats
   * @description 获取通知统计信息
   * @param recipientId 接收者ID（可选）
   * @param tenantId 租户ID（可选）
   * @returns Promise<NotificationStats>
   */
  getNotificationStats(
    recipientId?: UserId,
    tenantId?: TenantId
  ): Promise<NotificationStats>;
}

/**
 * @interface NotificationStats
 * @description 通知统计信息接口
 */
export interface NotificationStats {
  total: number;                    // 总通知数
  pending: number;                  // 待发送数
  sent: number;                     // 已发送数
  delivered: number;                // 已送达数
  read: number;                     // 已读数
  failed: number;                   // 失败数
  cancelled: number;                // 已取消数
  expired: number;                  // 已过期数
  byType: Record<string, number>;   // 按类型统计
  byPriority: Record<string, number>; // 按优先级统计
  unreadCount: number;              // 未读数
  readRate: number;                 // 阅读率
  deliveryRate: number;             // 送达率
  failureRate: number;              // 失败率
}
