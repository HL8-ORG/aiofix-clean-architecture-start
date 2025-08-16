import { NotificationTemplate } from '../entities/notification-template.entity';
import { TemplateId } from '../value-objects/template-id';
import { TemplateType, TemplateTypeEnum } from '../value-objects/template-type';
import { TemplateLanguage, TemplateLanguageEnum } from '../value-objects/template-language';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

/**
 * @interface INotificationTemplateRepository
 * @description
 * 通知模板仓储接口，定义通知模板的数据访问契约。
 * 
 * 主要功能与职责：
 * 1. 提供通知模板的CRUD操作
 * 2. 支持按条件查询和搜索模板
 * 3. 提供模板统计和分析功能
 * 4. 支持模板版本管理和状态跟踪
 * 
 * 业务规则：
 * - 模板ID必须唯一
 * - 同一租户下的模板名称必须唯一
 * - 模板查询必须支持多租户隔离
 * - 模板状态变更必须记录审计信息
 */
export interface INotificationTemplateRepository {
  /**
   * @method save
   * @description 保存通知模板
   * @param template 通知模板
   * @returns Promise<NotificationTemplate>
   */
  save(template: NotificationTemplate): Promise<NotificationTemplate>;

  /**
   * @method findById
   * @description 根据ID查找模板
   * @param id 模板ID
   * @returns Promise<NotificationTemplate | null>
   */
  findById(id: TemplateId): Promise<NotificationTemplate | null>;

  /**
   * @method findByName
   * @description 根据名称查找模板
   * @param name 模板名称
   * @param tenantId 租户ID（可选）
   * @returns Promise<NotificationTemplate | null>
   */
  findByName(name: string, tenantId?: TenantId): Promise<NotificationTemplate | null>;

  /**
   * @method findByType
   * @description 根据类型查找模板
   * @param type 模板类型
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
   */
  findByType(
    type: TemplateType,
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * @method findByLanguage
   * @description 根据语言查找模板
   * @param language 模板语言
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
   */
  findByLanguage(
    language: TemplateLanguage,
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * @method findByCreator
   * @description 根据创建者查找模板
   * @param createdBy 创建者ID
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
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
  ): Promise<NotificationTemplate[]>;

  /**
   * @method findActiveTemplates
   * @description 查找激活状态的模板
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
   */
  findActiveTemplates(
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * @method findDefaultTemplates
   * @description 查找默认模板
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
   */
  findDefaultTemplates(
    tenantId?: TenantId,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * @method searchTemplates
   * @description 搜索模板
   * @param searchTerm 搜索关键词
   * @param tenantId 租户ID（可选）
   * @param options 查询选项
   * @returns Promise<NotificationTemplate[]>
   */
  searchTemplates(
    searchTerm: string,
    tenantId?: TenantId,
    options?: {
      type?: TemplateType;
      language?: TemplateLanguage;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<NotificationTemplate[]>;

  /**
   * @method getTemplateStats
   * @description 获取模板统计信息
   * @param tenantId 租户ID（可选）
   * @returns Promise<TemplateStats>
   */
  getTemplateStats(tenantId?: TenantId): Promise<TemplateStats>;

  /**
   * @method delete
   * @description 删除模板
   * @param id 模板ID
   * @returns Promise<void>
   */
  delete(id: TemplateId): Promise<void>;

  /**
   * @method exists
   * @description 检查模板是否存在
   * @param id 模板ID
   * @returns Promise<boolean>
   */
  exists(id: TemplateId): Promise<boolean>;

  /**
   * @method existsByName
   * @description 检查模板名称是否存在
   * @param name 模板名称
   * @param tenantId 租户ID（可选）
   * @param excludeId 排除的模板ID（可选）
   * @returns Promise<boolean>
   */
  existsByName(name: string, tenantId?: TenantId, excludeId?: TemplateId): Promise<boolean>;
}

/**
 * @interface TemplateStats
 * @description 模板统计信息接口
 */
export interface TemplateStats {
  totalTemplates: number;                    // 总模板数
  activeTemplates: number;                   // 激活模板数
  draftTemplates: number;                    // 草稿模板数
  archivedTemplates: number;                 // 归档模板数
  defaultTemplates: number;                  // 默认模板数
  byType: Record<TemplateTypeEnum, number>;  // 按类型统计
  byLanguage: Record<TemplateLanguageEnum, number>; // 按语言统计
  byCreator: Record<string, number>;         // 按创建者统计
  recentTemplates: number;                   // 最近创建的模板数
  averageVariables: number;                  // 平均变量数
}
