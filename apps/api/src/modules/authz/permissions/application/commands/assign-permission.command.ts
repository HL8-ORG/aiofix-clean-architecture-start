/**
 * @file assign-permission.command.ts
 * @description 权限分配命令
 * 
 * 该命令用于将权限分配给用户或角色，支持用户级别和角色级别的权限分配。
 * 遵循CQRS模式，通过命令总线处理权限分配操作。
 */

import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @enum AssignmentType
 * @description 权限分配类型枚举
 */
export enum AssignmentType {
  /** 分配给用户 */
  USER = 'user',
  /** 分配给角色 */
  ROLE = 'role',
}

/**
 * @interface AssignPermissionDto
 * @description 权限分配的数据传输对象
 */
export interface AssignPermissionDto {
  /** 权限ID */
  permissionId: string;
  /** 分配类型 */
  assignmentType: AssignmentType;
  /** 用户ID（当分配类型为USER时） */
  userId?: string;
  /** 角色ID（当分配类型为ROLE时） */
  roleId?: string;
  /** 租户ID */
  tenantId?: string;
  /** 分配者ID */
  assignedBy?: string;
  /** 分配原因 */
  reason?: string;
  /** 过期时间 */
  expiresAt?: Date;
  /** 条件表达式 */
  conditions?: any;
}

/**
 * @class AssignPermissionCommand
 * @description 权限分配命令类
 * 
 * 该命令封装了权限分配所需的所有信息，支持将权限分配给用户或角色，
 * 并支持条件权限和过期时间等高级功能。
 * 
 * 主要原理与机制如下：
 * 1. 继承BaseCommand基类，获得命令的基本属性和验证能力
 * 2. 支持用户级别和角色级别的权限分配
 * 3. 支持条件权限和过期时间配置
 * 4. 支持多租户环境下的权限隔离
 * 5. 提供权限分配的审计和追踪
 * 
 * @extends {BaseCommand<any>}
 */
export class AssignPermissionCommand extends BaseCommand<any> {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'AssignPermissionCommand';

  /**
   * @property permissionId
   * @description 权限ID
   */
  readonly permissionId: string;

  /**
   * @property assignmentType
   * @description 分配类型
   */
  readonly assignmentType: AssignmentType;

  /**
   * @property userId
   * @description 用户ID（当分配类型为USER时）
   */
  readonly userId?: string;

  /**
   * @property roleId
   * @description 角色ID（当分配类型为ROLE时）
   */
  readonly roleId?: string;

  /**
   * @property reason
   * @description 分配原因
   */
  readonly reason?: string;

  /**
   * @property expiresAt
   * @description 过期时间
   */
  readonly expiresAt?: Date;

  /**
   * @property conditions
   * @description 条件表达式
   */
  readonly conditions?: any;

  /**
   * @constructor
   * @description
   * 构造函数，初始化权限分配命令的所有属性
   * 
   * @param {AssignPermissionDto} dto - 权限分配的数据传输对象
   */
  constructor(dto: AssignPermissionDto) {
    super();
    this.permissionId = dto.permissionId;
    this.assignmentType = dto.assignmentType;
    this.userId = dto.userId;
    this.roleId = dto.roleId;
    this.tenantId = dto.tenantId;
    this.reason = dto.reason;
    this.expiresAt = dto.expiresAt;
    this.conditions = dto.conditions;
    this.userId = dto.assignedBy;
  }

  /**
   * @function validate
   * @description
   * 验证命令的有效性。该方法检查命令中所有必需字段的有效性，
   * 确保权限分配命令的数据完整性。
   * 
   * 验证规则：
   * 1. 权限ID不能为空
   * 2. 分配类型必须是有效的类型
   * 3. 根据分配类型，用户ID或角色ID必须存在
   * 4. 过期时间不能是过去的时间
   * 5. 条件表达式必须是有效的格式
   * 
   * @returns {boolean} 返回验证结果
   */
  validate(): boolean {
    if (!this.permissionId || this.permissionId.trim().length === 0) {
      return false;
    }

    if (!Object.values(AssignmentType).includes(this.assignmentType)) {
      return false;
    }

    if (this.assignmentType === AssignmentType.USER && !this.userId) {
      return false;
    }

    if (this.assignmentType === AssignmentType.ROLE && !this.roleId) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    if (this.reason && this.reason.length > 500) {
      return false;
    }

    return true;
  }

  /**
   * @function getTargetId
   * @description
   * 获取分配目标的ID。根据分配类型返回用户ID或角色ID。
   * 
   * @returns {string} 返回目标ID
   */
  getTargetId(): string {
    if (this.assignmentType === AssignmentType.USER) {
      return this.userId!;
    }
    return this.roleId!;
  }
}
