import { Injectable } from '@nestjs/common';
import { NotificationHistory } from '../entities/notification-history.entity';
import type { INotificationRepository, NotificationStats } from '../repositories/notification-repository.interface';
import { NotificationId } from '../value-objects/notification-id';
import { NotificationStatus, NotificationStatusEnum } from '../value-objects/notification-status';
import { NotificationType, NotificationTypeEnum } from '../value-objects/notification-type';
import { NotificationPriority, NotificationPriorityEnum } from '../value-objects/notification-priority';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @class NotificationHistoryDomainService
 * @description
 * 通知历史领域服务，处理通知历史相关的业务逻辑。
 * 
 * 主要功能与职责：
 * 1. 处理通知历史记录的查询和分析
 * 2. 提供通知统计和报表功能
 * 3. 处理通知历史数据的清理和归档
 * 4. 支持通知历史的批量操作
 * 5. 提供通知历史相关的业务规则验证
 * 
 * 业务规则：
 * - 通知历史记录必须保持完整性和一致性
 * - 统计查询必须考虑数据权限和隐私保护
 * - 历史数据清理必须遵循数据保留策略
 * - 批量操作必须保证事务一致性
 * 
 * @injectable
 */
@Injectable()
export class NotificationHistoryDomainService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly logger: PinoLoggerService
  ) { }

  /**
   * @method getNotificationHistory
   * @description 获取通知历史记录
   * @param recipientId 接收者ID
   * @param options 查询选项
   * @returns Promise<NotificationHistory[]>
   */
  async getNotificationHistory(
    recipientId: UserId,
    options?: {
      status?: NotificationStatus;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationHistory[]> {
    this.logger.info('Getting notification history', LogContext.BUSINESS, {
      recipientId: recipientId.value,
      options
    });

    // 这里可以添加业务规则验证
    // 例如：检查用户是否有权限查看历史记录
    // 例如：验证时间范围是否合理

    return await this.notificationRepository.findByRecipientId(recipientId, {
      status: options?.status,
      type: options?.type,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      orderBy: options?.orderBy || 'createdAt',
      orderDirection: options?.orderDirection || 'DESC'
    });
  }

  /**
   * @method getNotificationStats
   * @description 获取通知统计信息
   * @param recipientId 接收者ID（可选）
   * @param tenantId 租户ID（可选）
   * @returns Promise<NotificationStats>
   */
  async getNotificationStats(
    recipientId?: UserId,
    tenantId?: TenantId
  ): Promise<NotificationStats> {
    this.logger.info('Getting notification stats', LogContext.BUSINESS, {
      recipientId: recipientId?.value,
      tenantId: tenantId?.value
    });

    return await this.notificationRepository.getNotificationStats(recipientId, tenantId);
  }

  /**
   * @method getUnreadNotificationCount
   * @description 获取未读通知数量
   * @param recipientId 接收者ID
   * @returns Promise<number>
   */
  async getUnreadNotificationCount(recipientId: UserId): Promise<number> {
    this.logger.info('Getting unread notification count', LogContext.BUSINESS, {
      recipientId: recipientId.value
    });

    const stats = await this.notificationRepository.getNotificationStats(recipientId);
    return stats.unreadCount;
  }

  /**
   * @method markAllNotificationsAsRead
   * @description 标记所有通知为已读
   * @param recipientId 接收者ID
   * @returns Promise<void>
   */
  async markAllNotificationsAsRead(recipientId: UserId): Promise<void> {
    this.logger.info('Marking all notifications as read', LogContext.BUSINESS, {
      recipientId: recipientId.value
    });

    await this.notificationRepository.markAllAsRead(recipientId);
  }

  /**
   * @method getNotificationTrends
   * @description 获取通知趋势分析
   * @param recipientId 接收者ID（可选）
   * @param tenantId 租户ID（可选）
   * @param days 分析天数
   * @returns Promise<NotificationTrends>
   */
  async getNotificationTrends(
    recipientId?: UserId,
    tenantId?: TenantId,
    days: number = 30
  ): Promise<NotificationTrends> {
    this.logger.info('Getting notification trends', LogContext.BUSINESS, {
      recipientId: recipientId?.value,
      tenantId: tenantId?.value,
      days
    });

    // 这里可以实现更复杂的趋势分析逻辑
    // 例如：按天统计通知数量、类型分布、状态变化等
    const stats = await this.notificationRepository.getNotificationStats(recipientId, tenantId);

    return {
      totalNotifications: stats.total,
      readRate: stats.readRate,
      deliveryRate: stats.deliveryRate,
      failureRate: stats.failureRate,
      typeDistribution: stats.byType,
      priorityDistribution: stats.byPriority,
      analysisPeriod: days
    };
  }

  /**
   * @method cleanupOldNotifications
   * @description 清理旧的通知记录
   * @param retentionDays 保留天数
   * @param tenantId 租户ID（可选）
   * @returns Promise<number> 清理的记录数
   */
  async cleanupOldNotifications(
    retentionDays: number = 365,
    tenantId?: TenantId
  ): Promise<number> {
    this.logger.info('Cleaning up old notifications', LogContext.BUSINESS, {
      retentionDays,
      tenantId: tenantId?.value
    });

    // 这里可以实现数据清理逻辑
    // 例如：删除超过保留期限的通知记录
    // 例如：归档重要的通知记录

    // 暂时返回0，实际实现时需要根据具体需求开发
    return 0;
  }

  /**
   * @method getNotificationSummary
   * @description 获取通知摘要信息
   * @param recipientId 接收者ID
   * @returns Promise<NotificationSummary>
   */
  async getNotificationSummary(recipientId: UserId): Promise<NotificationSummary> {
    this.logger.info('Getting notification summary', LogContext.BUSINESS, {
      recipientId: recipientId.value
    });

    const stats = await this.notificationRepository.getNotificationStats(recipientId);
    const unreadNotifications = await this.notificationRepository.findUnreadNotifications(recipientId, {
      limit: 5,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });

    return {
      totalCount: stats.total,
      unreadCount: stats.unreadCount,
      readRate: stats.readRate,
      recentUnread: unreadNotifications.map(n => ({
        id: n.id.value,
        title: n.title,
        type: n.type.value,
        priority: n.priority.value,
        createdAt: n.createdAt
      }))
    };
  }

  /**
   * @method validateNotificationAccess
   * @description 验证通知访问权限
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns Promise<boolean>
   */
  async validateNotificationAccess(
    notificationId: NotificationId,
    userId: UserId
  ): Promise<boolean> {
    this.logger.info('Validating notification access', LogContext.BUSINESS, {
      notificationId: notificationId.value,
      userId: userId.value
    });

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      return false;
    }

    // 检查用户是否有权限访问该通知
    return notification.recipientId.equals(userId);
  }
}

/**
 * @interface NotificationTrends
 * @description 通知趋势分析接口
 */
export interface NotificationTrends {
  totalNotifications: number;           // 总通知数
  readRate: number;                     // 阅读率
  deliveryRate: number;                 // 送达率
  failureRate: number;                  // 失败率
  typeDistribution: Record<string, number>; // 类型分布
  priorityDistribution: Record<string, number>; // 优先级分布
  analysisPeriod: number;               // 分析周期（天）
}

/**
 * @interface NotificationSummary
 * @description 通知摘要信息接口
 */
export interface NotificationSummary {
  totalCount: number;                   // 总通知数
  unreadCount: number;                  // 未读数
  readRate: number;                     // 阅读率
  recentUnread: Array<{                 // 最近未读通知
    id: string;
    title: string;
    type: string;
    priority: string;
    createdAt: Date;
  }>;
}
