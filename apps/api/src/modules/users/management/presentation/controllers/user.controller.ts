/**
 * @file user.controller.ts
 * @description 用户管理控制器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserApplicationService } from '../../application/services/user-application.service';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @class UserController
 * @description 用户管理控制器，提供用户相关的REST API接口
 */
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
    private readonly logger: PinoLoggerService,
  ) { }

  /**
   * @method createUser
   * @description 创建用户
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建用户',
    description: '创建新用户，支持多租户用户管理'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '用户创建成功'
  })
  async createUser(@Body() createUserDto: any): Promise<any> {
    this.logger.info('开始创建用户', LogContext.BUSINESS, {
      email: createUserDto.email,
      tenantId: createUserDto.tenantId,
    });

    try {
      const user = await this.userApplicationService.createUser(createUserDto);

      this.logger.info('用户创建成功', LogContext.BUSINESS, {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error('用户创建失败', LogContext.BUSINESS, {
        email: createUserDto.email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method getUser
   * @description 根据ID获取用户
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取用户',
    description: '根据用户ID获取用户详细信息'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取用户成功'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户不存在'
  })
  async getUser(@Param('id') id: string): Promise<any> {
    this.logger.info('开始获取用户', LogContext.BUSINESS, { userId: id });

    try {
      const user = await this.userApplicationService.getUser(id);

      this.logger.info('用户获取成功', LogContext.BUSINESS, {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error('用户获取失败', LogContext.BUSINESS, {
        userId: id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method searchUsers
   * @description 搜索用户
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '搜索用户',
    description: '根据条件搜索用户，支持分页和多种过滤条件'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '搜索成功'
  })
  async searchUsers(@Query() searchDto: any): Promise<any> {
    this.logger.info('开始搜索用户', LogContext.BUSINESS, {
      searchTerm: searchDto.searchTerm,
      tenantId: searchDto.tenantId,
      status: searchDto.status,
      page: searchDto.page,
      limit: searchDto.limit,
    });

    try {
      const result = await this.userApplicationService.searchUsers(searchDto.tenantId, searchDto);

      this.logger.info('用户搜索成功', LogContext.BUSINESS, {
        totalCount: result.total,
        pageCount: result.users.length,
      });

      return result;
    } catch (error) {
      this.logger.error('用户搜索失败', LogContext.BUSINESS, {
        searchTerm: searchDto.searchTerm,
        error: error.message,
      });
      throw error;
    }
  }
}
