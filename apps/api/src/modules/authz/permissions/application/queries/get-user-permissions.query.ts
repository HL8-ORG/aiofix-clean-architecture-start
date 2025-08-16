/**
 * @file get-user-permissions.query.ts
 * @description 获取用户权限查询
 * 
 * 该查询用于获取用户的所有权限信息，包括直接权限和通过角色继承的权限。
 * 遵循CQRS模式，通过查询总线处理权限查询操作。
 */

import { BaseQuery } from '@/shared/application/base/base-query';

/**
 * @interface GetUserPermissionsDto
 * @description 获取用户权限的数据传输对象
 */
export interface GetUserPermissionsDto {
  /** 用户ID */
  userId: string;
  /** 租户ID */
  tenantId?: string;
  /** 是否包含角色权限 */
  includeRolePermissions?: boolean;
  /** 是否包含过期权限 */
  includeExpired?: boolean;
  /** 权限类型过滤 */
  permissionType?: string;
  /** 资源类型过滤 */
  resourceType?: string;
  /** 查询者ID */
  queriedBy?: string;
}

/**
 * @interface UserPermissionsResult
 * @description 用户权限查询结果
 */
export interface UserPermissionsResult {
  /** 用户ID */
  userId: string;
  /** 直接权限列表 */
  directPermissions: PermissionInfo[];
  /** 角色权限列表 */
  rolePermissions: RolePermissionInfo[];
  /** 合并后的所有权限 */
  allPermissions: PermissionInfo[];
  /** 权限统计信息 */
  statistics: PermissionStatistics;
}

/**
 * @interface PermissionInfo
 * @description 权限信息
 */
export interface PermissionInfo {
  /** 权限ID */
  id: string;
  /** 权限名称 */
  name: string;
  /** 权限类型 */
  type: string;
  /** 权限描述 */
  description?: string;
  /** 权限代码 */
  code?: string;
  /** 资源类型 */
  resourceType?: string;
  /** 操作类型 */
  action?: string;
  /** 分配时间 */
  assignedAt: Date;
  /** 过期时间 */
  expiresAt?: Date;
  /** 分配来源 */
  source: 'direct' | 'role';
  /** 角色信息（当来源为role时） */
  roleInfo?: {
    id: string;
    name: string;
    code: string;
  };
}

/**
 * @interface RolePermissionInfo
 * @description 角色权限信息
 */
export interface RolePermissionInfo {
  /** 角色ID */
  roleId: string;
  /** 角色名称 */
  roleName: string;
  /** 角色代码 */
  roleCode: string;
  /** 角色描述 */
  roleDescription?: string;
  /** 角色权限列表 */
  permissions: PermissionInfo[];
}

/**
 * @interface PermissionStatistics
 * @description 权限统计信息
 */
export interface PermissionStatistics {
  /** 直接权限数量 */
  directPermissionCount: number;
  /** 角色权限数量 */
  rolePermissionCount: number;
  /** 总权限数量 */
  totalPermissionCount: number;
  /** 角色数量 */
  roleCount: number;
  /** 即将过期的权限数量 */
  expiringSoonCount: number;
  /** 已过期的权限数量 */
  expiredCount: number;
}

/**
 * @class GetUserPermissionsQuery
 * @description 获取用户权限查询类
 * 
 * 该查询封装了获取用户权限所需的所有信息，支持多种过滤条件和
 * 权限来源的区分，提供完整的用户权限视图。
 * 
 * 主要原理与机制如下：
 * 1. 继承BaseQuery基类，获得查询的基本属性和验证能力
 * 2. 支持直接权限和角色权限的分别查询
 * 3. 支持权限过滤和过期时间检查
 * 4. 支持多租户环境下的权限隔离
 * 5. 提供权限统计和缓存支持
 * 
 * @extends {BaseQuery<UserPermissionsResult>}
 */
export class GetUserPermissionsQuery extends BaseQuery<UserPermissionsResult> {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'GetUserPermissionsQuery';

  /**
   * @property userId
   * @description 用户ID
   */
  readonly userId: string;

  /**
   * @property includeRolePermissions
   * @description 是否包含角色权限
   */
  readonly includeRolePermissions: boolean;

  /**
   * @property includeExpired
   * @description 是否包含过期权限
   */
  readonly includeExpired: boolean;

  /**
   * @property permissionType
   * @description 权限类型过滤
   */
  readonly permissionType?: string;

  /**
   * @property resourceType
   * @description 资源类型过滤
   */
  readonly resourceType?: string;

  /**
   * @constructor
   * @description
   * 构造函数，初始化获取用户权限查询的所有属性
   * 
   * @param {GetUserPermissionsDto} dto - 获取用户权限的数据传输对象
   */
  constructor(dto: GetUserPermissionsDto) {
    super();
    this.userId = dto.userId;
    this.tenantId = dto.tenantId;
    this.includeRolePermissions = dto.includeRolePermissions ?? true;
    this.includeExpired = dto.includeExpired ?? false;
    this.permissionType = dto.permissionType;
    this.resourceType = dto.resourceType;
    this.userId = dto.queriedBy;
  }

  /**
   * @function validate
   * @description
   * 验证查询的有效性。该方法检查查询中所有必需字段的有效性，
   * 确保用户权限查询的数据完整性。
   * 
   * 验证规则：
   * 1. 用户ID不能为空
   * 2. 用户ID必须是有效的格式
   * 3. 权限类型和资源类型必须是有效的格式
   * 
   * @returns {boolean} 返回验证结果
   */
  validate(): boolean {
    if (!this.userId || this.userId.trim().length === 0) {
      return false;
    }

    if (this.permissionType && this.permissionType.trim().length === 0) {
      return false;
    }

    if (this.resourceType && this.resourceType.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * @function getCacheKey
   * @description
   * 生成查询缓存键。该方法根据查询参数生成唯一的缓存键，
   * 用于查询结果的缓存和失效管理。
   * 
   * 缓存键格式：
   * user-permissions:{userId}:{tenantId}:{includeRolePermissions}:{includeExpired}:{permissionType}:{resourceType}
   * 
   * @returns {string} 返回缓存键
   */
  getCacheKey(): string {
    const parts = [
      'user-permissions',
      this.userId,
      this.tenantId || 'global',
      this.includeRolePermissions ? 'with-roles' : 'direct-only',
      this.includeExpired ? 'with-expired' : 'active-only',
      this.permissionType || 'all-types',
      this.resourceType || 'all-resources',
    ];

    return parts.join(':');
  }
}
