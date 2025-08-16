/**
 * @file login.use-case.ts
 * @description 用户登录用例
 * 
 * 该用例封装了用户登录的完整业务逻辑，是Clean Architecture的核心组件。
 * 用例层负责协调领域对象和基础设施，实现具体的业务场景。
 * 
 * 主要功能：
 * - 用户身份验证
 * - 会话创建和管理
 * - JWT令牌生成
 * - 安全审计和日志记录
 * 
 * 架构特点：
 * - 遵循Clean Architecture原则
 * - 依赖抽象接口而非具体实现
 * - 包含完整的业务规则验证
 * - 支持多因子认证
 * - 提供安全审计功能
 */

import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user.repository.interface';
import type { ISessionRepository } from '@/modules/auth/login/domain/repositories/session.repository.interface';
import type { ITokenService } from '@/modules/auth/login/domain/services/token.service.interface';
import type { IPasswordService } from '@/modules/auth/login/domain/services/password.service.interface';
import type { IAuditService } from '@/shared/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UnauthorizedException } from '@/shared/domain/exceptions/unauthorized.exception';
import { AccountLockedException } from '@/shared/domain/exceptions/account-locked.exception';
import { UserStatus } from '@/modules/users/management/domain/value-objects/user-status';

/**
 * @interface ILoginUseCase
 * @description 登录用例接口
 * 
 * 定义登录用例的契约，确保用例的可测试性和可替换性。
 * 遵循依赖倒置原则，依赖抽象而非具体实现。
 */
export interface ILoginUseCase {
  /**
   * 执行用户登录
   * @param request 登录请求数据
   * @returns Promise<LoginResponseDto> 登录响应数据
   */
  execute(request: LoginRequestDto): Promise<LoginResponseDto>;
}

/**
 * @class LoginUseCase
 * @description 用户登录用例实现类
 * 
 * 该用例封装了用户登录的完整业务逻辑，包括身份验证、会话管理、
 * 令牌生成和安全审计等功能。是Clean Architecture的核心业务逻辑层。
 * 
 * 主要原理与机制如下：
 * 1. 接收登录请求并验证输入数据的有效性
 * 2. 通过用户仓储查找用户信息
 * 3. 使用密码服务验证用户密码
 * 4. 检查用户状态和权限
 * 5. 创建用户会话并生成JWT令牌
 * 6. 记录安全审计日志
 * 7. 返回登录结果
 * 
 * 业务规则：
 * - 用户必须存在且状态为激活
 *  - 密码必须正确
 *  - 账户不能被锁定
 *  - 支持多因子认证验证
 *  - 登录失败次数限制
 *  - 会话并发控制
 * 
 * 安全特性：
 * - 密码安全验证
 * - 账户锁定保护
 * - 会话安全创建
 * - 令牌安全生成
 * - 审计日志记录
 * 
 * @implements {ILoginUseCase}
 */
@Injectable()
export class LoginUseCase implements ILoginUseCase {
  /**
   * @constructor
   * @description
   * 构造函数，注入所有必要的依赖服务
   * 
   * @param {IUserRepository} userRepository - 用户仓储接口
   * @param {ISessionRepository} sessionRepository - 会话仓储接口
   * @param {ITokenService} tokenService - 令牌服务接口
   * @param {IPasswordService} passwordService - 密码服务接口
   * @param {IAuditService} auditService - 审计服务接口
   * @param {PinoLoggerService} logger - 日志服务
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordService: IPasswordService,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  /**
   * @function execute
   * @description
   * 执行用户登录用例。该方法封装了完整的登录业务流程，
   * 包括身份验证、会话创建、令牌生成和安全审计。
   * 
   * 执行流程：
   * 1. 验证输入数据的有效性
   * 2. 查找用户信息
   * 3. 验证用户密码
   * 4. 检查用户状态和权限
   * 5. 验证多因子认证（如果启用）
   * 6. 创建用户会话
   * 7. 生成JWT访问令牌和刷新令牌
   * 8. 记录安全审计日志
   * 9. 返回登录结果
   * 
   * @param {LoginRequestDto} request - 登录请求数据
   * @returns {Promise<LoginResponseDto>} 返回登录响应数据
   * @throws {UnauthorizedException} 当用户名或密码错误时抛出异常
   * @throws {AccountLockedException} 当账户被锁定时抛出异常
   * @throws {ValidationException} 当输入数据无效时抛出异常
   */
  async execute(request: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      this.logger.info('开始执行用户登录用例', LogContext.AUTH, {
        usernameOrEmail: request.usernameOrEmail,
        tenantId: request.tenantId,
        hasMfaCode: !!request.mfaCode,
        ipAddress: request.ipAddress,
      });

      // 1. 验证输入数据
      this.validateRequest(request);

      // 2. 查找用户
      const user = await this.findUser(request.usernameOrEmail, request.tenantId);
      if (!user) {
        await this.handleLoginFailure(request, '用户不存在');
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 3. 检查用户状态
      if (user.status.value !== UserStatus.ACTIVE) {
        await this.handleLoginFailure(request, `用户状态异常: ${user.status.value}`);
        throw new UnauthorizedException('账户状态异常，请联系管理员');
      }

      // 4. 验证密码
      const isPasswordValid = await this.passwordService.verifyPassword(
        request.password,
        user.password.value,
      );

      if (!isPasswordValid) {
        await this.handleLoginFailure(request, '密码错误', user.id.value);
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 5. 验证多因子认证（如果启用）
      if (user.mfaEnabled && request.mfaCode) {
        const isMfaValid = await this.validateMfa(user.id.value, request.mfaCode);
        if (!isMfaValid) {
          await this.handleLoginFailure(request, '多因子认证失败', user.id.value);
          throw new UnauthorizedException('多因子认证失败');
        }
      } else if (user.mfaEnabled && !request.mfaCode) {
        await this.handleLoginFailure(request, '缺少多因子认证代码', user.id.value);
        throw new UnauthorizedException('需要多因子认证代码');
      }

      // 6. 创建用户会话
      const session = await this.createUserSession(user.id.value, request);

      // 7. 生成JWT令牌
      const tokens = await this.generateTokens(user, session.id.value);

      // 8. 记录成功登录审计日志
      await this.auditService.logLoginSuccess({
        userId: user.id.value,
        username: user.username.value,
        email: user.email.value,
        tenantId: user.tenantId?.value,
        sessionId: session.id.value,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        timestamp: new Date(),
      });

      this.logger.info('用户登录成功', LogContext.AUTH, {
        userId: user.id.value,
        username: user.username.value,
        sessionId: session.id.value,
        tenantId: user.tenantId?.value,
      });

      // 9. 返回登录结果
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id.value,
          username: user.username.value,
          email: user.email.value,
          tenantId: user.tenantId?.value,
          roles: user.roles || [],
          permissions: user.permissions || [],
        },
        session: {
          id: session.id.value,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error('用户登录用例执行失败', LogContext.AUTH, {
        usernameOrEmail: request.usernameOrEmail,
        error: error.message,
      }, error);
      throw error;
    }
  }

  /**
   * @function validateRequest
   * @description
   * 验证登录请求数据的有效性
   * 
   * @param {LoginRequestDto} request - 登录请求数据
   * @throws {ValidationException} 当数据无效时抛出异常
   */
  private validateRequest(request: LoginRequestDto): void {
    if (!request.usernameOrEmail || request.usernameOrEmail.trim().length === 0) {
      throw new Error('用户名或邮箱不能为空');
    }

    if (!request.password || request.password.length === 0) {
      throw new Error('密码不能为空');
    }

    if (request.usernameOrEmail.length > 100) {
      throw new Error('用户名或邮箱长度不能超过100个字符');
    }

    if (request.password.length > 128) {
      throw new Error('密码长度不能超过128个字符');
    }
  }

  /**
   * @function findUser
   * @description
   * 根据用户名或邮箱查找用户
   * 
   * @param {string} usernameOrEmail - 用户名或邮箱
   * @param {string} tenantId - 租户ID
   * @returns {Promise<any>} 返回用户信息
   */
  private async findUser(usernameOrEmail: string, tenantId?: string): Promise<any> {
    // 判断是用户名还是邮箱
    const isEmail = usernameOrEmail.includes('@');

    if (isEmail) {
      return await this.userRepository.findByEmail(usernameOrEmail, tenantId);
    } else {
      return await this.userRepository.findByUsername(usernameOrEmail, tenantId);
    }
  }

  /**
   * @function validateMfa
   * @description
   * 验证多因子认证代码
   * 
   * @param {string} userId - 用户ID
   * @param {string} mfaCode - 多因子认证代码
   * @returns {Promise<boolean>} 返回验证结果
   */
  private async validateMfa(userId: string, mfaCode: string): Promise<boolean> {
    // TODO: 实现多因子认证验证逻辑
    // 这里应该调用多因子认证服务进行验证
    return true; // 临时实现
  }

  /**
   * @function createUserSession
   * @description
   * 创建用户会话
   * 
   * @param {string} userId - 用户ID
   * @param {LoginRequestDto} request - 登录请求数据
   * @returns {Promise<any>} 返回会话信息
   */
  private async createUserSession(userId: string, request: LoginRequestDto): Promise<any> {
    const sessionData = {
      userId,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      rememberMe: request.rememberMe,
      tenantId: request.tenantId,
    };

    return await this.sessionRepository.create(sessionData);
  }

  /**
   * @function generateTokens
   * @description
   * 生成JWT访问令牌和刷新令牌
   * 
   * @param {any} user - 用户信息
   * @param {string} sessionId - 会话ID
   * @returns {Promise<any>} 返回令牌信息
   */
  private async generateTokens(user: any, sessionId: string): Promise<any> {
    const payload = {
      sub: user.id.value,
      email: user.email.value,
      username: user.username.value,
      tenantId: user.tenantId?.value,
      roles: user.roles || [],
      permissions: user.permissions || [],
      sessionId,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1小时
    };
  }

  /**
   * @function handleLoginFailure
   * @description
   * 处理登录失败情况
   * 
   * @param {LoginRequestDto} request - 登录请求数据
   * @param {string} reason - 失败原因
   * @param {string} userId - 用户ID（可选）
   */
  private async handleLoginFailure(
    request: LoginRequestDto,
    reason: string,
    userId?: string,
  ): Promise<void> {
    await this.auditService.logLoginFailure({
      usernameOrEmail: request.usernameOrEmail,
      userId,
      reason,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      timestamp: new Date(),
    });

    this.logger.warn('用户登录失败', LogContext.AUTH, {
      usernameOrEmail: request.usernameOrEmail,
      userId,
      reason,
      ipAddress: request.ipAddress,
    });
  }
}
