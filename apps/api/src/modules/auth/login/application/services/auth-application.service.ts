import { Injectable } from '@nestjs/common';
import type { ILoginUseCase } from '../use-cases/login.use-case';
import type { ILogoutUseCase } from '../use-cases/logout.use-case';
import type { IRefreshTokenUseCase } from '../use-cases/refresh-token.use-case';
import type { IValidateTokenUseCase } from '../use-cases/validate-token.use-case';
import type { IGetUserSessionsUseCase } from '../use-cases/get-user-sessions.use-case';
import type { IGetLoginHistoryUseCase } from '../use-cases/get-login-history.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LogoutRequestDto } from '../dto/logout-request.dto';
import { RefreshTokenRequestDto } from '../dto/refresh-token-request.dto';
import { ValidateTokenRequestDto } from '../dto/validate-token-request.dto';
import { GetUserSessionsRequestDto } from '../dto/get-user-sessions-request.dto';
import { GetLoginHistoryRequestDto } from '../dto/get-login-history-request.dto';

/**
 * @class AuthApplicationService
 * @description
 * 认证应用服务。该服务使用CQRS模式，通过命令总线和查询总线处理认证业务逻辑，
 * 提供完整的用户认证功能，包括登录、登出、令牌管理等。
 * 
 * 主要原理与机制如下：
 * 1. 通过依赖注入获取命令总线和查询总线，实现命令查询职责分离
 * 2. 将认证操作封装为命令对象，通过命令总线发送给对应的处理器
 * 3. 将认证查询封装为查询对象，通过查询总线发送给对应的处理器
 * 4. 提供统一的异常处理和业务规则验证
 * 5. 支持安全审计和日志记录
 * 
 * 架构特点：
 * - 采用CQRS模式，分离认证操作和查询操作
 * - 支持JWT令牌的生成、验证和刷新
 * - 提供会话管理和安全审计
 * - 支持多因子认证集成
 * 
 * 安全特性：
 * - 密码加密存储和验证
 * - JWT令牌安全生成和验证
 * - 会话状态管理和清理
 * - 安全审计和异常检测
 */
@Injectable()
export class AuthApplicationService {
  /**
   * @constructor
   * @description
   * 构造函数，注入所有认证用例依赖
   * 
   * @param {ILoginUseCase} loginUseCase - 登录用例
   * @param {ILogoutUseCase} logoutUseCase - 登出用例
   * @param {IRefreshTokenUseCase} refreshTokenUseCase - 刷新令牌用例
   * @param {IValidateTokenUseCase} validateTokenUseCase - 验证令牌用例
   * @param {IGetUserSessionsUseCase} getUserSessionsUseCase - 获取用户会话用例
   * @param {IGetLoginHistoryUseCase} getLoginHistoryUseCase - 获取登录历史用例
   */
  constructor(
    private readonly loginUseCase: ILoginUseCase,
    private readonly logoutUseCase: ILogoutUseCase,
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    private readonly validateTokenUseCase: IValidateTokenUseCase,
    private readonly getUserSessionsUseCase: IGetUserSessionsUseCase,
    private readonly getLoginHistoryUseCase: IGetLoginHistoryUseCase,
  ) { }

  /**
   * @function login
   * @description
   * 用户登录的核心方法。该方法负责处理用户登录的完整业务流程，
   * 包括身份验证、会话创建和令牌生成。
   * 
   * 执行流程：
   * 1. 将登录参数封装为LoginCommand命令
   * 2. 通过命令总线发送命令给LoginHandler处理器
   * 3. 处理器执行身份验证和会话创建
   * 4. 返回登录结果（包含访问令牌和刷新令牌）
   * 
   * @param {string} usernameOrEmail - 用户名或邮箱地址
   * @param {string} password - 用户密码
   * @param {boolean} [rememberMe=false] - 是否记住登录状态
   * @param {string} [tenantId] - 租户ID（多租户环境）
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   * @returns {Promise<any>} 返回登录结果，包含访问令牌和刷新令牌
   * @throws {UnauthorizedException} 当用户名或密码错误时抛出异常
   * @throws {AccountLockedException} 当账户被锁定时抛出异常
   */
  async login(
    usernameOrEmail: string,
    password: string,
    rememberMe: boolean = false,
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const request = new LoginRequestDto({
      usernameOrEmail,
      password,
      rememberMe,
      tenantId,
      ipAddress,
      userAgent,
    });
    return await this.loginUseCase.execute(request);
  }

  /**
   * @function logout
   * @description
   * 用户登出的核心方法。该方法负责处理用户登出的完整业务流程，
   * 包括会话清理、令牌失效和安全审计。
   * 
   * 执行流程：
   * 1. 将登出参数封装为LogoutCommand命令
   * 2. 通过命令总线发送命令给LogoutHandler处理器
   * 3. 处理器执行会话清理和令牌失效
   * 4. 记录登出操作的安全审计信息
   * 
   * @param {string} userId - 用户ID
   * @param {string} [sessionId] - 会话ID（可选，用于单会话登出）
   * @param {boolean} [globalLogout=false] - 是否全局登出
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   * @returns {Promise<void>} 返回一个Promise，表示登出操作完成
   * @throws {NotFoundException} 当用户或会话不存在时抛出异常
   */
  async logout(
    userId: string,
    sessionId?: string,
    globalLogout: boolean = false,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const command = new LogoutCommand(
      userId,
      sessionId,
      globalLogout,
      ipAddress,
      userAgent,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * @function refreshToken
   * @description
   * 刷新令牌的核心方法。该方法负责处理JWT令牌刷新的完整业务流程，
   * 包括令牌验证、新令牌生成和安全检查。
   * 
   * 执行流程：
   * 1. 将刷新令牌参数封装为RefreshTokenCommand命令
   * 2. 通过命令总线发送命令给RefreshTokenHandler处理器
   * 3. 处理器验证刷新令牌并生成新的访问令牌
   * 4. 返回新的令牌对（访问令牌和刷新令牌）
   * 
   * @param {string} refreshToken - 刷新令牌
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   * @returns {Promise<any>} 返回新的令牌对
   * @throws {UnauthorizedException} 当刷新令牌无效时抛出异常
   * @throws {TokenExpiredException} 当刷新令牌已过期时抛出异常
   */
  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const command = new RefreshTokenCommand(
      refreshToken,
      ipAddress,
      userAgent,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * @function validateToken
   * @description
   * 验证令牌的核心方法。该方法负责处理JWT令牌验证的完整业务流程，
   * 包括令牌有效性检查、权限验证和安全审计。
   * 
   * 执行流程：
   * 1. 将令牌验证参数封装为ValidateTokenCommand命令
   * 2. 通过命令总线发送命令给ValidateTokenHandler处理器
   * 3. 处理器验证令牌有效性和权限
   * 4. 返回验证结果和用户信息
   * 
   * @param {string} accessToken - 访问令牌
   * @param {string} [requiredPermission] - 所需权限（可选）
   * @param {string} [ipAddress] - 客户端IP地址
   * @param {string} [userAgent] - 用户代理信息
   * @returns {Promise<any>} 返回令牌验证结果和用户信息
   * @throws {UnauthorizedException} 当令牌无效时抛出异常
   * @throws {ForbiddenException} 当权限不足时抛出异常
   */
  async validateToken(
    accessToken: string,
    requiredPermission?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const command = new ValidateTokenCommand(
      accessToken,
      requiredPermission,
      ipAddress,
      userAgent,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * @function getUserSessions
   * @description
   * 获取用户会话的核心方法。该方法负责获取指定用户的所有活跃会话信息。
   * 
   * @param {GetUserSessionsRequestDto} request - 获取用户会话请求DTO
   * @returns {Promise<GetUserSessionsResponseDto>} 返回用户会话列表
   */
  async getUserSessions(request: GetUserSessionsRequestDto): Promise<GetUserSessionsResponseDto> {
    return await this.getUserSessionsUseCase.execute(request);
  }
}
