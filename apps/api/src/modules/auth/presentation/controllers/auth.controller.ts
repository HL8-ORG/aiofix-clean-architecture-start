/**
 * @file auth.controller.ts
 * @description 认证控制器
 * 
 * 该控制器负责处理用户认证相关的HTTP请求，包括登录、登出、令牌刷新等操作。
 * 遵循RESTful API设计原则，提供统一的认证接口。
 * 
 * 主要功能：
 * - 用户登录认证
 * - 用户登出
 * - JWT令牌刷新
 * - 令牌验证
 * - 会话管理
 * 
 * 架构特点：
 * - 采用RESTful API设计
 * - 支持JWT令牌认证
 * - 集成应用层服务
 * - 提供统一的错误处理
 * - 支持多租户认证
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthApplicationService } from '../../login/application/services/auth-application.service';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @interface LoginRequestDto
 * @description 登录请求数据传输对象
 */
export interface LoginRequestDto {
  /** 用户名或邮箱 */
  usernameOrEmail: string;
  /** 密码 */
  password: string;
  /** 租户ID（可选） */
  tenantId?: string;
  /** 记住我 */
  rememberMe?: boolean;
  /** 多因子认证代码（可选） */
  mfaCode?: string;
}

/**
 * @interface LoginResponseDto
 * @description 登录响应数据传输对象
 */
export interface LoginResponseDto {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间（秒） */
  expiresIn: number;
  /** 用户信息 */
  user: {
    id: string;
    username: string;
    email: string;
    tenantId?: string;
    roles: string[];
    permissions: string[];
  };
}

/**
 * @interface RefreshTokenRequestDto
 * @description 刷新令牌请求数据传输对象
 */
export interface RefreshTokenRequestDto {
  /** 刷新令牌 */
  refreshToken: string;
}

/**
 * @interface RefreshTokenResponseDto
 * @description 刷新令牌响应数据传输对象
 */
export interface RefreshTokenResponseDto {
  /** 新的访问令牌 */
  accessToken: string;
  /** 新的刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间（秒） */
  expiresIn: number;
}

/**
 * @interface LogoutRequestDto
 * @description 登出请求数据传输对象
 */
export interface LogoutRequestDto {
  /** 刷新令牌（可选） */
  refreshToken?: string;
}

/**
 * @interface ValidateTokenResponseDto
 * @description 令牌验证响应数据传输对象
 */
export interface ValidateTokenResponseDto {
  /** 是否有效 */
  valid: boolean;
  /** 用户信息（如果有效） */
  user?: {
    id: string;
    username: string;
    email: string;
    tenantId?: string;
    roles: string[];
    permissions: string[];
  };
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * @class AuthController
 * @description 认证控制器类
 * 
 * 该控制器提供用户认证相关的RESTful API接口，包括登录、登出、
 * 令牌刷新和验证等功能。通过应用层服务处理业务逻辑。
 * 
 * 主要原理与机制如下：
 * 1. 接收HTTP请求并验证参数的有效性
 * 2. 调用应用层服务处理业务逻辑
 * 3. 返回标准化的HTTP响应
 * 4. 提供统一的错误处理和日志记录
 * 5. 支持JWT令牌认证和会话管理
 * 
 * API设计原则：
 * - 遵循RESTful设计规范
 * - 使用标准的HTTP状态码
 * - 提供清晰的错误信息
 * - 支持API文档自动生成
 * - 实现统一的响应格式
 */
@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  /**
   * @constructor
   * @description
   * 构造函数，注入必要的依赖服务
   * 
   * @param {AuthApplicationService} authApplicationService - 认证应用服务
   * @param {PinoLoggerService} logger - 日志服务
   */
  constructor(
    private readonly authApplicationService: AuthApplicationService,
    private readonly logger: PinoLoggerService,
  ) { }

  /**
   * @function login
   * @description
   * 用户登录接口。该接口处理用户登录认证，验证用户凭据并返回访问令牌。
   * 
   * 执行流程：
   * 1. 验证登录参数的有效性
   * 2. 调用认证应用服务进行登录验证
   * 3. 生成JWT访问令牌和刷新令牌
   * 4. 记录登录操作日志
   * 5. 返回登录结果
   * 
   * @param {LoginRequestDto} loginDto - 登录请求数据
   * @returns {Promise<LoginResponseDto>} 返回登录响应数据
   * @throws {BadRequestException} 当参数无效时抛出异常
   * @throws {UnauthorizedException} 当认证失败时抛出异常
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '用户通过用户名/邮箱和密码进行登录认证，返回访问令牌和用户信息',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '认证失败',
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      this.logger.info('用户登录请求', LogContext.AUTH, {
        usernameOrEmail: loginDto.usernameOrEmail,
        tenantId: loginDto.tenantId,
        hasMfaCode: !!loginDto.mfaCode,
      });

      // 验证请求参数
      if (!loginDto.usernameOrEmail || !loginDto.password) {
        throw new BadRequestException('用户名/邮箱和密码不能为空');
      }

      // 调用应用层服务进行登录
      const loginResult = await this.authApplicationService.login({
        usernameOrEmail: loginDto.usernameOrEmail,
        password: loginDto.password,
        tenantId: loginDto.tenantId,
        rememberMe: loginDto.rememberMe,
        mfaCode: loginDto.mfaCode,
      });

      this.logger.info('用户登录成功', LogContext.AUTH, {
        userId: loginResult.user.id,
        username: loginResult.user.username,
        tenantId: loginResult.user.tenantId,
      });

      return {
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        tokenType: 'Bearer',
        expiresIn: loginResult.expiresIn,
        user: {
          id: loginResult.user.id,
          username: loginResult.user.username,
          email: loginResult.user.email,
          tenantId: loginResult.user.tenantId,
          roles: loginResult.user.roles || [],
          permissions: loginResult.user.permissions || [],
        },
      };
    } catch (error) {
      this.logger.error('用户登录失败', LogContext.AUTH, {
        usernameOrEmail: loginDto.usernameOrEmail,
        error: error.message,
      }, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new UnauthorizedException('用户名或密码错误');
    }
  }

  /**
   * @function logout
   * @description
   * 用户登出接口。该接口处理用户登出操作，使当前会话失效。
   * 
   * 执行流程：
   * 1. 验证请求参数的有效性
   * 2. 调用认证应用服务进行登出处理
   * 3. 使当前会话和令牌失效
   * 4. 记录登出操作日志
   * 5. 返回登出结果
   * 
   * @param {LogoutRequestDto} logoutDto - 登出请求数据
   * @param {Request} request - HTTP请求对象
   * @returns {Promise<{ message: string }>} 返回登出结果
   * @throws {UnauthorizedException} 当认证失败时抛出异常
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '用户登出',
    description: '用户登出，使当前会话和访问令牌失效',
  })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '登出成功',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '认证失败',
  })
  async logout(
    @Body() logoutDto: LogoutRequestDto,
    @Request() request: any,
  ): Promise<{ message: string }> {
    try {
      const userId = request.user?.id;
      const sessionId = request.user?.sessionId;

      this.logger.info('用户登出请求', LogContext.AUTH, {
        userId,
        sessionId,
        hasRefreshToken: !!logoutDto.refreshToken,
      });

      // 调用应用层服务进行登出
      await this.authApplicationService.logout({
        userId,
        sessionId,
        refreshToken: logoutDto.refreshToken,
      });

      this.logger.info('用户登出成功', LogContext.AUTH, {
        userId,
        sessionId,
      });

      return { message: '登出成功' };
    } catch (error) {
      this.logger.error('用户登出失败', LogContext.AUTH, {
        userId: request.user?.id,
        error: error.message,
      }, error);

      throw new UnauthorizedException('登出失败');
    }
  }

  /**
   * @function refreshToken
   * @description
   * 刷新令牌接口。该接口使用刷新令牌获取新的访问令牌。
   * 
   * 执行流程：
   * 1. 验证刷新令牌的有效性
   * 2. 调用认证应用服务刷新令牌
   * 3. 生成新的访问令牌和刷新令牌
   * 4. 记录令牌刷新操作日志
   * 5. 返回新的令牌信息
   * 
   * @param {RefreshTokenRequestDto} refreshDto - 刷新令牌请求数据
   * @returns {Promise<RefreshTokenResponseDto>} 返回刷新令牌响应数据
   * @throws {BadRequestException} 当参数无效时抛出异常
   * @throws {UnauthorizedException} 当刷新令牌无效时抛出异常
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用刷新令牌获取新的访问令牌',
  })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '刷新令牌无效',
  })
  async refreshToken(
    @Body() refreshDto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    try {
      this.logger.info('令牌刷新请求', LogContext.AUTH, {
        hasRefreshToken: !!refreshDto.refreshToken,
      });

      // 验证请求参数
      if (!refreshDto.refreshToken) {
        throw new BadRequestException('刷新令牌不能为空');
      }

      // 调用应用层服务刷新令牌
      const refreshResult = await this.authApplicationService.refreshToken({
        refreshToken: refreshDto.refreshToken,
      });

      this.logger.info('令牌刷新成功', LogContext.AUTH, {
        userId: refreshResult.user.id,
        sessionId: refreshResult.sessionId,
      });

      return {
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
        tokenType: 'Bearer',
        expiresIn: refreshResult.expiresIn,
      };
    } catch (error) {
      this.logger.error('令牌刷新失败', LogContext.AUTH, {
        error: error.message,
      }, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * @function validateToken
   * @description
   * 验证令牌接口。该接口验证访问令牌的有效性并返回用户信息。
   * 
   * 执行流程：
   * 1. 从请求头中提取访问令牌
   * 2. 调用认证应用服务验证令牌
   * 3. 返回令牌验证结果和用户信息
   * 4. 记录令牌验证操作日志
   * 5. 返回验证结果
   * 
   * @param {Headers} headers - HTTP请求头
   * @returns {Promise<ValidateTokenResponseDto>} 返回令牌验证响应数据
   * @throws {BadRequestException} 当令牌格式错误时抛出异常
   */
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '验证访问令牌',
    description: '验证访问令牌的有效性并返回用户信息',
  })
  @ApiResponse({
    status: 200,
    description: '令牌验证成功',
    type: ValidateTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '令牌无效',
  })
  async validateToken(
    @Headers('authorization') authorization: string,
  ): Promise<ValidateTokenResponseDto> {
    try {
      this.logger.info('令牌验证请求', LogContext.AUTH, {
        hasAuthorization: !!authorization,
      });

      // 验证请求头
      if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new BadRequestException('无效的授权头格式');
      }

      const token = authorization.substring(7);

      // 调用应用层服务验证令牌
      const validationResult = await this.authApplicationService.validateToken({
        token,
      });

      this.logger.info('令牌验证成功', LogContext.AUTH, {
        userId: validationResult.user?.id,
        valid: validationResult.valid,
      });

      return {
        valid: validationResult.valid,
        user: validationResult.user ? {
          id: validationResult.user.id,
          username: validationResult.user.username,
          email: validationResult.user.email,
          tenantId: validationResult.user.tenantId,
          roles: validationResult.user.roles || [],
          permissions: validationResult.user.permissions || [],
        } : undefined,
        expiresAt: validationResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('令牌验证失败', LogContext.AUTH, {
        error: error.message,
      }, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        valid: false,
      };
    }
  }

  /**
   * @function getProfile
   * @description
   * 获取用户信息接口。该接口返回当前登录用户的详细信息。
   * 
   * 执行流程：
   * 1. 从请求中获取当前用户信息
   * 2. 调用应用层服务获取用户详细信息
   * 3. 返回用户信息
   * 4. 记录用户信息查询操作日志
   * 5. 返回用户信息
   * 
   * @param {Request} request - HTTP请求对象
   * @returns {Promise<any>} 返回用户信息
   * @throws {UnauthorizedException} 当用户未认证时抛出异常
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功',
  })
  @ApiResponse({
    status: 401,
    description: '用户未认证',
  })
  async getProfile(@Request() request: any): Promise<any> {
    try {
      const userId = request.user?.id;

      if (!userId) {
        throw new UnauthorizedException('用户未认证');
      }

      this.logger.info('获取用户信息请求', LogContext.AUTH, {
        userId,
      });

      // TODO: 调用用户服务获取详细信息
      // const userInfo = await this.userApplicationService.getUser(userId);

      // 临时实现
      const userInfo = {
        id: userId,
        username: request.user.username,
        email: request.user.email,
        tenantId: request.user.tenantId,
        roles: request.user.roles || [],
        permissions: request.user.permissions || [],
        profile: {
          name: 'Mock User',
          avatar: null,
          phone: null,
          bio: null,
        },
      };

      this.logger.info('获取用户信息成功', LogContext.AUTH, {
        userId,
        username: userInfo.username,
      });

      return userInfo;
    } catch (error) {
      this.logger.error('获取用户信息失败', LogContext.AUTH, {
        userId: request.user?.id,
        error: error.message,
      }, error);

      throw error;
    }
  }
}
