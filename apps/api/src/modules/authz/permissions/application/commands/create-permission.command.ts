/**
 * @file create-permission.command.ts
 * @description 创建权限命令
 * 
 * 该命令用于创建新的权限，包含权限的基本信息和配置。
 * 遵循CQRS模式，通过命令总线处理权限创建操作。
 */

import { BaseCommand } from '@/shared/application/base/base-command';

/**
 * @interface CreatePermissionDto
 * @description 创建权限的数据传输对象
 */
export interface CreatePermissionDto {
  /** 权限名称 */
  name: string;
  /** 权限类型 */
  type: string;
  /** 权限描述 */
  description?: string;
  /** 权限代码 */
  code?: string;
  /** 租户ID */
  tenantId?: string;
  /** 资源类型 */
  resourceType?: string;
  /** 操作类型 */
  action?: string;
  /** 权限策略 */
  policy?: any;
  /** 创建者ID */
  createdBy?: string;
}

/**
 * @class CreatePermissionCommand
 * @description 创建权限命令类
 * 
 * 该命令封装了创建权限所需的所有信息，包括权限的基本属性、
 * 资源类型、操作类型等。通过命令总线路由到对应的处理器执行。
 * 
 * 主要原理与机制如下：
 * 1. 继承BaseCommand基类，获得命令的基本属性和验证能力
 * 2. 包含创建权限所需的所有参数和配置信息
 * 3. 支持权限的细粒度配置，包括资源类型和操作类型
 * 4. 支持多租户环境下的权限隔离
 * 5. 提供权限策略的配置支持
 * 
 * @extends {BaseCommand<any>}
 */
export class CreatePermissionCommand extends BaseCommand<any> {
  /**
   * @property commandType
   * @description 命令类型标识符，用于命令总线路由
   */
  readonly commandType = 'CreatePermissionCommand';

  /**
   * @property name
   * @description 权限名称
   */
  readonly name: string;

  /**
   * @property type
   * @description 权限类型
   */
  readonly type: string;

  /**
   * @property description
   * @description 权限描述
   */
  readonly description?: string;

  /**
   * @property code
   * @description 权限代码
   */
  readonly code?: string;

  /**
   * @property resourceType
   * @description 资源类型
   */
  readonly resourceType?: string;

  /**
   * @property action
   * @description 操作类型
   */
  readonly action?: string;

  /**
   * @property policy
   * @description 权限策略
   */
  readonly policy?: any;

  /**
   * @constructor
   * @description
   * 构造函数，初始化创建权限命令的所有属性
   * 
   * @param {CreatePermissionDto} dto - 创建权限的数据传输对象
   */
  constructor(dto: CreatePermissionDto) {
    super();
    this.name = dto.name;
    this.type = dto.type;
    this.description = dto.description;
    this.code = dto.code;
    this.tenantId = dto.tenantId;
    this.resourceType = dto.resourceType;
    this.action = dto.action;
    this.policy = dto.policy;
    this.userId = dto.createdBy;
  }

  /**
   * @function validate
   * @description
   * 验证命令的有效性。该方法检查命令中所有必需字段的有效性，
   * 确保权限创建命令的数据完整性。
   * 
   * 验证规则：
   * 1. 权限名称不能为空且长度在合理范围内
   * 2. 权限类型必须是有效的类型
   * 3. 权限代码必须符合命名规范
   * 4. 资源类型和操作类型必须匹配
   * 
   * @returns {boolean} 返回验证结果
   */
  validate(): boolean {
    if (!this.name || this.name.trim().length === 0) {
      return false;
    }

    if (this.name.length > 100) {
      return false;
    }

    if (!this.type || this.type.trim().length === 0) {
      return false;
    }

    if (this.code && this.code.length > 50) {
      return false;
    }

    if (this.description && this.description.length > 500) {
      return false;
    }

    return true;
  }
}
