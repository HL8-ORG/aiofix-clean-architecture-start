/**
 * @file auth.controller.ts
 * @description 认证控制器
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthApplicationService } from '../../application/services/auth-application.service';
import { GetUserSessionsRequestDto } from '../../application/dto/get-user-sessions-request.dto';
import { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @class AuthController
 * @description 认证控制器，提供用户认证相关的REST API接口
 */
@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authApplicationService: AuthApplicationService,
    private readonly logger: PinoLoggerService,
  ) { }

  /**
   * @method login
   * @description 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '用户登录，返回访问令牌和刷新令牌'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登录成功'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '用户名或密码错误'
  })
  async login(@Body() loginDto: any): Promise<any> {
    this.logger.info('开始用户登录', LogContext.AUTH, {
      email: loginDto.email,
      tenantId: loginDto.tenantId,
    });

    try {
      const result = await this.authApplicationService.login(
        loginDto.usernameOrEmail || loginDto.email,
        loginDto.password,
        loginDto.rememberMe || false,
        loginDto.tenantId,
        loginDto.ipAddress,
        loginDto.userAgent
      );

      this.logger.info('用户登录成功', LogContext.AUTH, {
        userId: result.userId,
        email: loginDto.email,
      });

      return result;
    } catch (error) {
      this.logger.error('用户登录失败', LogContext.AUTH, {
        email: loginDto.email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method logout
   * @description 用户登出
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登出',
    description: '用户登出，清除会话和令牌'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登出成功'
  })
  async logout(@Body() logoutDto: any): Promise<any> {
    this.logger.info('开始用户登出', LogContext.AUTH, {
      userId: logoutDto.userId,
      sessionId: logoutDto.sessionId,
    });

    try {
      const result = await this.authApplicationService.logout(
        logoutDto.userId,
        logoutDto.sessionId,
        logoutDto.globalLogout || false,
        logoutDto.ipAddress,
        logoutDto.userAgent
      );

      this.logger.info('用户登出成功', LogContext.AUTH, {
        userId: logoutDto.userId,
      });

      return result;
    } catch (error) {
      this.logger.error('用户登出失败', LogContext.AUTH, {
        userId: logoutDto.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method refreshToken
   * @description 刷新访问令牌
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新令牌',
    description: '使用刷新令牌获取新的访问令牌'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '令牌刷新成功'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '刷新令牌无效或已过期'
  })
  async refreshToken(@Body() refreshDto: any): Promise<any> {
    this.logger.info('开始刷新令牌', LogContext.AUTH, {
      userId: refreshDto.userId,
    });

    try {
      const result = await this.authApplicationService.refreshToken(refreshDto);

      this.logger.info('令牌刷新成功', LogContext.AUTH, {
        userId: refreshDto.userId,
      });

      return result;
    } catch (error) {
      this.logger.error('令牌刷新失败', LogContext.AUTH, {
        userId: refreshDto.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method validateToken
   * @description 验证访问令牌
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '验证令牌',
    description: '验证访问令牌的有效性'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '令牌有效'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '令牌无效或已过期'
  })
  async validateToken(@Body() validateDto: any): Promise<any> {
    this.logger.info('开始验证令牌', LogContext.AUTH, {
      token: validateDto.token ? '***' : 'undefined',
    });

    try {
      const result = await this.authApplicationService.validateToken(validateDto);

      this.logger.info('令牌验证成功', LogContext.AUTH, {
        userId: result.userId,
      });

      return result;
    } catch (error) {
      this.logger.error('令牌验证失败', LogContext.AUTH, {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * @method getUserSessions
   * @description 获取用户会话列表
   */
  @Get('sessions/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取用户会话',
    description: '获取指定用户的所有活跃会话'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取会话成功'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户不存在'
  })
  async getUserSessions(
    @Param('userId') userId: string,
    @Query() queryDto: any
  ): Promise<any> {
    this.logger.info('开始获取用户会话', LogContext.AUTH, {
      userId,
      activeOnly: queryDto.activeOnly,
    });

    try {
      const request = new GetUserSessionsRequestDto({
        userId,
        tenantId: queryDto.tenantId,
        activeOnly: queryDto.activeOnly,
        limit: queryDto.limit || 10,
        offset: queryDto.offset || 0,
      });

      const result = await this.authApplicationService.getUserSessions(request);

      this.logger.info('用户会话获取成功', LogContext.AUTH, {
        userId,
        sessionCount: result.sessions.length,
      });

      return result;
    } catch (error) {
      this.logger.error('用户会话获取失败', LogContext.AUTH, {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}
