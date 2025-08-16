/**
 * @file authz.controller.ts
 * @description 授权控制器
 * 
 * 该控制器负责处理用户授权相关的HTTP请求，包括权限管理、角色管理等操作。
 * 遵循RESTful API设计原则，提供统一的授权接口。
 * 
 * 主要功能：
 * - 权限管理（创建、分配、查询）
 * - 角色管理（创建、分配、查询）
 * - 权限验证
 * - 角色验证
 * - 用户权限查询
 * 
 * 架构特点：
 * - 采用RESTful API设计
 * - 支持细粒度权限控制
 * - 集成应用层服务
 * - 提供统一的错误处理
 * - 支持多租户授权隔离
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PermissionApplicationService } from '../../permissions/application/services/permission-application.service';
import { RoleApplicationService } from '../../roles/application/services/role-application.service';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @interface CreatePermissionRequestDto
 * @description 创建权限请求数据传输对象
 */
export interface CreatePermissionRequestDto {
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
  /** 权限策略 */
  policy?: any;
}

/**
 * @interface AssignPermissionRequestDto
 * @description 分配权限请求数据传输对象
 */
export interface AssignPermissionRequestDto {
  /** 权限ID */
  permissionId: string;
  /** 分配类型 */
  assignmentType: 'user' | 'role';
  /** 用户ID（当分配类型为user时） */
  userId?: string;
  /** 角色ID（当分配类型为role时） */
  roleId?: string;
  /** 分配原因 */
  reason?: string;
  /** 过期时间 */
  expiresAt?: Date;
  /** 条件表达式 */
  conditions?: any;
}

/**
 * @interface CreateRoleRequestDto
 * @description 创建角色请求数据传输对象
 */
export interface CreateRoleRequestDto {
  /** 角色名称 */
  name: string;
  /** 角色代码 */
  code: string;
  /** 角色描述 */
  description?: string;
  /** 权限ID列表 */
  permissionIds?: string[];
  /** 父角色ID */
  parentRoleId?: string;
}

/**
 * @interface AssignRoleRequestDto
 * @description 分配角色请求数据传输对象
 */
export interface AssignRoleRequestDto {
  /** 角色ID */
  roleId: string;
  /** 用户ID */
  userId: string;
  /** 分配原因 */
  reason?: string;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * @interface ValidatePermissionRequestDto
 * @description 验证权限请求数据传输对象
 */
export interface ValidatePermissionRequestDto {
  /** 用户ID */
  userId: string;
  /** 权限名称 */
  permissionName: string;
  /** 资源信息 */
  resource?: any;
}

/**
 * @interface ValidateRoleRequestDto
 * @description 验证角色请求数据传输对象
 */
export interface ValidateRoleRequestDto {
  /** 用户ID */
  userId: string;
  /** 角色名称 */
  roleName: string;
}

/**
 * @class AuthzController
 * @description 授权控制器类
 * 
 * 该控制器提供用户授权相关的RESTful API接口，包括权限管理、角色管理、
 * 权限验证和角色验证等功能。通过应用层服务处理业务逻辑。
 * 
 * 主要原理与机制如下：
 * 1. 接收HTTP请求并验证参数的有效性
 * 2. 调用应用层服务处理业务逻辑
 * 3. 返回标准化的HTTP响应
 * 4. 提供统一的错误处理和日志记录
 * 5. 支持细粒度权限控制和多租户隔离
 * 
 * API设计原则：
 * - 遵循RESTful设计规范
 * - 使用标准的HTTP状态码
 * - 提供清晰的错误信息
 * - 支持API文档自动生成
 * - 实现统一的响应格式
 */
@ApiTags('授权管理')
@Controller('authz')
export class AuthzController {
  /**
   * @constructor
   * @description
   * 构造函数，注入必要的依赖服务
   * 
   * @param {PermissionApplicationService} permissionApplicationService - 权限管理应用服务
   * @param {RoleApplicationService} roleApplicationService - 角色管理应用服务
   * @param {PinoLoggerService} logger - 日志服务
   */
  constructor(
    private readonly permissionApplicationService: PermissionApplicationService,
    private readonly roleApplicationService: RoleApplicationService,
    private readonly logger: PinoLoggerService,
  ) { }

  // ==================== 权限管理接口 ====================

  /**
   * @function createPermission
   * @description
   * 创建权限接口。该接口用于创建新的权限。
   * 
   * @param {CreatePermissionRequestDto} createDto - 创建权限请求数据
   * @returns {Promise<any>} 返回创建的权限信息
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '创建权限',
    description: '创建新的权限，支持细粒度权限配置',
  })
  @ApiResponse({
    status: 201,
    description: '权限创建成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async createPermission(@Body() createDto: CreatePermissionRequestDto): Promise<any> {
    try {
      this.logger.info('创建权限请求', LogContext.AUTH, {
        permissionName: createDto.name,
        permissionType: createDto.type,
        resourceType: createDto.resourceType,
      });

      // 验证请求参数
      if (!createDto.name || !createDto.type) {
        throw new BadRequestException('权限名称和类型不能为空');
      }

      // 调用应用层服务创建权限
      const result = await this.permissionApplicationService.createPermission(createDto);

      this.logger.info('权限创建成功', LogContext.AUTH, {
        permissionId: result.id,
        permissionName: result.name,
      });

      return result;
    } catch (error) {
      this.logger.error('权限创建失败', LogContext.AUTH, {
        permissionName: createDto.name,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function assignPermission
   * @description
   * 分配权限接口。该接口用于将权限分配给用户或角色。
   * 
   * @param {AssignPermissionRequestDto} assignDto - 分配权限请求数据
   * @returns {Promise<any>} 返回分配结果
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('permissions/assign')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '分配权限',
    description: '将权限分配给用户或角色',
  })
  @ApiResponse({
    status: 200,
    description: '权限分配成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async assignPermission(@Body() assignDto: AssignPermissionRequestDto): Promise<any> {
    try {
      this.logger.info('分配权限请求', LogContext.AUTH, {
        permissionId: assignDto.permissionId,
        assignmentType: assignDto.assignmentType,
        targetId: assignDto.userId || assignDto.roleId,
      });

      // 验证请求参数
      if (!assignDto.permissionId || !assignDto.assignmentType) {
        throw new BadRequestException('权限ID和分配类型不能为空');
      }

      if (assignDto.assignmentType === 'user' && !assignDto.userId) {
        throw new BadRequestException('用户ID不能为空');
      }

      if (assignDto.assignmentType === 'role' && !assignDto.roleId) {
        throw new BadRequestException('角色ID不能为空');
      }

      // 调用应用层服务分配权限
      let result;
      if (assignDto.assignmentType === 'user') {
        result = await this.permissionApplicationService.assignPermissionToUser({
          userId: assignDto.userId!,
          permissionId: assignDto.permissionId,
          reason: assignDto.reason,
          expiresAt: assignDto.expiresAt,
          conditions: assignDto.conditions,
        });
      } else {
        result = await this.permissionApplicationService.assignPermissionToRole({
          roleId: assignDto.roleId!,
          permissionId: assignDto.permissionId,
          reason: assignDto.reason,
          expiresAt: assignDto.expiresAt,
          conditions: assignDto.conditions,
        });
      }

      this.logger.info('权限分配成功', LogContext.AUTH, {
        assignmentId: result.id,
        permissionId: assignDto.permissionId,
        assignmentType: assignDto.assignmentType,
      });

      return result;
    } catch (error) {
      this.logger.error('权限分配失败', LogContext.AUTH, {
        permissionId: assignDto.permissionId,
        assignmentType: assignDto.assignmentType,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function getUserPermissions
   * @description
   * 获取用户权限接口。该接口用于查询用户的所有权限信息。
   * 
   * @param {string} userId - 用户ID
   * @param {Query} query - 查询参数
   * @returns {Promise<any>} 返回用户权限信息
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Get('users/:userId/permissions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiQuery({ name: 'includeRolePermissions', required: false, description: '是否包含角色权限' })
  @ApiQuery({ name: 'includeExpired', required: false, description: '是否包含过期权限' })
  @ApiQuery({ name: 'permissionType', required: false, description: '权限类型过滤' })
  @ApiQuery({ name: 'resourceType', required: false, description: '资源类型过滤' })
  @ApiOperation({
    summary: '获取用户权限',
    description: '获取指定用户的所有权限信息，包括直接权限和角色权限',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户权限成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  async getUserPermissions(
    @Param('userId') userId: string,
    @Query('includeRolePermissions') includeRolePermissions?: string,
    @Query('includeExpired') includeExpired?: string,
    @Query('permissionType') permissionType?: string,
    @Query('resourceType') resourceType?: string,
  ): Promise<any> {
    try {
      this.logger.info('获取用户权限请求', LogContext.AUTH, {
        userId,
        includeRolePermissions: includeRolePermissions === 'true',
        includeExpired: includeExpired === 'true',
        permissionType,
        resourceType,
      });

      // 验证请求参数
      if (!userId) {
        throw new BadRequestException('用户ID不能为空');
      }

      // 调用应用层服务获取用户权限
      const result = await this.permissionApplicationService.getUserPermissions(userId);

      this.logger.info('获取用户权限成功', LogContext.AUTH, {
        userId,
        permissionCount: result.permissions?.length || 0,
        roleCount: result.roles?.length || 0,
      });

      return result;
    } catch (error) {
      this.logger.error('获取用户权限失败', LogContext.AUTH, {
        userId,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function validatePermission
   * @description
   * 验证权限接口。该接口用于验证用户是否具有特定权限。
   * 
   * @param {ValidatePermissionRequestDto} validateDto - 验证权限请求数据
   * @returns {Promise<{ hasPermission: boolean }>} 返回验证结果
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('permissions/validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '验证权限',
    description: '验证用户是否具有特定权限',
  })
  @ApiResponse({
    status: 200,
    description: '权限验证成功',
    schema: {
      type: 'object',
      properties: {
        hasPermission: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  async validatePermission(@Body() validateDto: ValidatePermissionRequestDto): Promise<{ hasPermission: boolean }> {
    try {
      this.logger.info('验证权限请求', LogContext.AUTH, {
        userId: validateDto.userId,
        permissionName: validateDto.permissionName,
        resource: validateDto.resource?.id,
      });

      // 验证请求参数
      if (!validateDto.userId || !validateDto.permissionName) {
        throw new BadRequestException('用户ID和权限名称不能为空');
      }

      // 调用应用层服务验证权限
      const hasPermission = await this.permissionApplicationService.validateUserPermission(
        validateDto.userId,
        validateDto.permissionName,
        validateDto.resource,
      );

      this.logger.info('权限验证完成', LogContext.AUTH, {
        userId: validateDto.userId,
        permissionName: validateDto.permissionName,
        hasPermission,
      });

      return { hasPermission };
    } catch (error) {
      this.logger.error('权限验证失败', LogContext.AUTH, {
        userId: validateDto.userId,
        permissionName: validateDto.permissionName,
        error: error.message,
      }, error);

      throw error;
    }
  }

  // ==================== 角色管理接口 ====================

  /**
   * @function createRole
   * @description
   * 创建角色接口。该接口用于创建新的角色。
   * 
   * @param {CreateRoleRequestDto} createDto - 创建角色请求数据
   * @returns {Promise<any>} 返回创建的角色信息
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '创建角色',
    description: '创建新的角色，支持角色层级和权限配置',
  })
  @ApiResponse({
    status: 201,
    description: '角色创建成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async createRole(@Body() createDto: CreateRoleRequestDto): Promise<any> {
    try {
      this.logger.info('创建角色请求', LogContext.AUTH, {
        roleName: createDto.name,
        roleCode: createDto.code,
        permissionCount: createDto.permissionIds?.length || 0,
        parentRoleId: createDto.parentRoleId,
      });

      // 验证请求参数
      if (!createDto.name || !createDto.code) {
        throw new BadRequestException('角色名称和代码不能为空');
      }

      // 调用应用层服务创建角色
      const result = await this.roleApplicationService.createRole(createDto);

      this.logger.info('角色创建成功', LogContext.AUTH, {
        roleId: result.id,
        roleName: result.name,
        roleCode: result.code,
      });

      return result;
    } catch (error) {
      this.logger.error('角色创建失败', LogContext.AUTH, {
        roleName: createDto.name,
        roleCode: createDto.code,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function assignRole
   * @description
   * 分配角色接口。该接口用于将角色分配给用户。
   * 
   * @param {AssignRoleRequestDto} assignDto - 分配角色请求数据
   * @returns {Promise<any>} 返回分配结果
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('roles/assign')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '分配角色',
    description: '将角色分配给用户',
  })
  @ApiResponse({
    status: 200,
    description: '角色分配成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async assignRole(@Body() assignDto: AssignRoleRequestDto): Promise<any> {
    try {
      this.logger.info('分配角色请求', LogContext.AUTH, {
        roleId: assignDto.roleId,
        userId: assignDto.userId,
        reason: assignDto.reason,
      });

      // 验证请求参数
      if (!assignDto.roleId || !assignDto.userId) {
        throw new BadRequestException('角色ID和用户ID不能为空');
      }

      // 调用应用层服务分配角色
      const result = await this.roleApplicationService.assignRoleToUser({
        roleId: assignDto.roleId,
        userId: assignDto.userId,
        reason: assignDto.reason,
        expiresAt: assignDto.expiresAt,
      });

      this.logger.info('角色分配成功', LogContext.AUTH, {
        assignmentId: result.id,
        roleId: assignDto.roleId,
        userId: assignDto.userId,
      });

      return result;
    } catch (error) {
      this.logger.error('角色分配失败', LogContext.AUTH, {
        roleId: assignDto.roleId,
        userId: assignDto.userId,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function getUserRoles
   * @description
   * 获取用户角色接口。该接口用于查询用户的所有角色信息。
   * 
   * @param {string} userId - 用户ID
   * @returns {Promise<any>} 返回用户角色信息
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Get('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiOperation({
    summary: '获取用户角色',
    description: '获取指定用户的所有角色信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户角色成功',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  async getUserRoles(@Param('userId') userId: string): Promise<any> {
    try {
      this.logger.info('获取用户角色请求', LogContext.AUTH, {
        userId,
      });

      // 验证请求参数
      if (!userId) {
        throw new BadRequestException('用户ID不能为空');
      }

      // 调用应用层服务获取用户角色
      const result = await this.roleApplicationService.getUserRoles(userId);

      this.logger.info('获取用户角色成功', LogContext.AUTH, {
        userId,
        roleCount: result.roles?.length || 0,
      });

      return result;
    } catch (error) {
      this.logger.error('获取用户角色失败', LogContext.AUTH, {
        userId,
        error: error.message,
      }, error);

      throw error;
    }
  }

  /**
   * @function validateRole
   * @description
   * 验证角色接口。该接口用于验证用户是否具有特定角色。
   * 
   * @param {ValidateRoleRequestDto} validateDto - 验证角色请求数据
   * @returns {Promise<{ hasRole: boolean }>} 返回验证结果
   * @throws {BadRequestException} 当参数无效时抛出异常
   */
  @Post('roles/validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '验证角色',
    description: '验证用户是否具有特定角色',
  })
  @ApiResponse({
    status: 200,
    description: '角色验证成功',
    schema: {
      type: 'object',
      properties: {
        hasRole: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  async validateRole(@Body() validateDto: ValidateRoleRequestDto): Promise<{ hasRole: boolean }> {
    try {
      this.logger.info('验证角色请求', LogContext.AUTH, {
        userId: validateDto.userId,
        roleName: validateDto.roleName,
      });

      // 验证请求参数
      if (!validateDto.userId || !validateDto.roleName) {
        throw new BadRequestException('用户ID和角色名称不能为空');
      }

      // 调用应用层服务验证角色
      const hasRole = await this.roleApplicationService.validateUserRole(
        validateDto.userId,
        validateDto.roleName,
      );

      this.logger.info('角色验证完成', LogContext.AUTH, {
        userId: validateDto.userId,
        roleName: validateDto.roleName,
        hasRole,
      });

      return { hasRole };
    } catch (error) {
      this.logger.error('角色验证失败', LogContext.AUTH, {
        userId: validateDto.userId,
        roleName: validateDto.roleName,
        error: error.message,
      }, error);

      throw error;
    }
  }
}
