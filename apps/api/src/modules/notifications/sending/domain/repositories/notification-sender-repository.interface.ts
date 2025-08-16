import { NotificationSender } from '../entities/notification-sender.entity';
import { SenderId } from '../value-objects/sender-id';
import { SenderType, SenderTypeEnum } from '../value-objects/sender-type';
import { SenderStatus, SenderStatusEnum } from '../value-objects/sender-status';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @interface INotificationSenderRepository
 * @description
 * 通知发送者仓储接口，定义通知发送者的数据访问契约。
 * 
 * 主要功能与职责：
 * 1. 提供通知发送者的CRUD操作
 * 2. 支持按条件查询和搜索发送者
 * 3. 提供发送者统计和分析功能
 * 4. 支持发送者状态管理和监控
 * 
 * 业务规则：
 * - 发送者ID必须唯一
 * - 同一租户下的发送者名称必须唯一
 * - 发送者查询必须支持多租户隔离
 * - 发送者状态变更必须记录审计信息
 */
export interface INotificationSenderRepository {
  /**
   * @method save
   * @description 保存通知发送者
   * @param sender 通知发送者
   * @returns Promise<NotificationSender>
   */
  save(sender: NotificationSender): Promise<NotificationSender>;

  /**
   * @method findById
   * @description 根据ID查找发送者
   * @param id 发送者ID
   * @returns Promise<NotificationSender | null>
   */
  findById(id: SenderId): Promise<NotificationSender | null>;

  /**
   * @method findByName
   * @description 根据名称查找发送者
   * @param name 发送者名称
   * @param tenantId 租户ID（可选）
   * @returns Promise<NotificationSender | null>
   */
  findByName(name: string, tenantId?: TenantId): Promise<NotificationSender | null>;

  /**
   * @method findByType
   * @description 根据类型查找发送者
   * @param type 发送者类型
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  findByType(
    type: SenderType,
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method findByStatus
   * @description 根据状态查找发送者
   * @param status 发送者状态
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  findByStatus(
    status: SenderStatus,
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method findActiveSenders
   * @description 查找激活状态的发送者
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  findActiveSenders(
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method findDefaultSenders
   * @description 查找默认发送者
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  findDefaultSenders(
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method findByCreator
   * @description 根据创建者查找发送者
   * @param createdBy 创建者ID
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  findByCreator(
    createdBy: UserId,
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method searchSenders
   * @description 搜索发送者
   * @param searchTerm 搜索关键词
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationSender[]>
   */
  searchSenders(
    searchTerm: string,
    tenantId?: TenantId,
    options?: {
      type?: SenderType;
      status?: SenderStatus;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationSender[]>;

  /**
   * @method getSenderStats
   * @description 获取发送者统计信息
   * @param tenantId 租户ID（可选）
   * @returns Promise<SenderStats>
   */
  getSenderStats(tenantId?: TenantId): Promise<SenderStats>;

  /**
   * @method findBestSenderForType
   * @description 查找指定类型的最佳发送者
   * @param type 发送者类型
   * @param tenantId 租户ID（可选）
   * @returns Promise<NotificationSender | null>
   */
  findBestSenderForType(type: SenderType, tenantId?: TenantId): Promise<NotificationSender | null>;

  /**
   * @method updateSenderStats
   * @description 更新发送者统计信息
   * @param senderId 发送者ID
   * @param stats 统计信息
   * @returns Promise<void>
   */
  updateSenderStats(
    senderId: SenderId,
    stats: {
      successCount?: number;
      failureCount?: number;
      totalCount?: number;
      averageResponseTime?: number;
      lastUsedAt?: Date;
    }
  ): Promise<void>;

  /**
   * @method delete
   * @description 删除发送者
   * @param id 发送者ID
   * @returns Promise<void>
   */
  delete(id: SenderId): Promise<void>;

  /**
   * @method exists
   * @description 检查发送者是否存在
   * @param id 发送者ID
   * @returns Promise<boolean>
   */
  exists(id: SenderId): Promise<boolean>;

  /**
   * @method existsByName
   * @description 检查发送者名称是否存在
   * @param name 发送者名称
   * @param tenantId 租户ID（可选）
   * @param excludeId 排除的发送者ID（可选）
   * @returns Promise<boolean>
   */
  existsByName(name: string, tenantId?: TenantId, excludeId?: SenderId): Promise<boolean>;
}

/**
 * @interface SenderStats
 * @description 发送者统计信息接口
 */
export interface SenderStats {
  totalSenders: number;                    // 总发送者数
  activeSenders: number;                   // 激活发送者数
  inactiveSenders: number;                 // 非激活发送者数
  maintenanceSenders: number;              // 维护中发送者数
  errorSenders: number;                    // 错误状态发送者数
  suspendedSenders: number;                // 暂停发送者数
  testingSenders: number;                  // 测试中发送者数
  defaultSenders: number;                  // 默认发送者数
  byType: Record<SenderTypeEnum, number>;  // 按类型统计
  byStatus: Record<SenderStatusEnum, number>; // 按状态统计
  byCreator: Record<string, number>;       // 按创建者统计
  recentSenders: number;                   // 最近创建的发送者数
  highPerformanceSenders: number;          // 高性能发送者数
  lowPerformanceSenders: number;           // 低性能发送者数
  averageSuccessRate: number;              // 平均成功率
  averageResponseTime: number;             // 平均响应时间
}
