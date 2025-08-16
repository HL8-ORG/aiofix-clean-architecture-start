import { Module, OnModuleInit } from '@nestjs/common';
import { AuthApplicationService } from './services/auth-application.service';
import { CommandBus } from '@/shared/application/bus/command-bus';
import { QueryBus } from '@/shared/application/bus/query-bus';

// 用例
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { ValidateTokenUseCase } from './use-cases/validate-token.use-case';
import { GetUserSessionsUseCase } from './use-cases/get-user-sessions.use-case';
import { GetLoginHistoryUseCase } from './use-cases/get-login-history.use-case';

// 处理器
import { LoginHandler } from './handlers/commands/login.handler';
import { LogoutHandler } from './handlers/commands/logout.handler';
import { RefreshTokenHandler } from './handlers/commands/refresh-token.handler';
import { ValidateTokenHandler } from './handlers/commands/validate-token.handler';
import { GetUserSessionsHandler } from './handlers/queries/get-user-sessions.handler';
import { GetLoginHistoryHandler } from './handlers/queries/get-login-history.handler';

/**
 * @class AuthApplicationModule
 * @description
 * 认证应用层模块。该模块负责配置CQRS架构和所有认证相关的处理器，
 * 实现用户登录、登出、会话管理等认证功能。
 * 
 * 主要原理与机制如下：
 * 1. 通过依赖注入容器管理所有认证服务、命令总线和查询总线
 * 2. 在模块初始化时自动注册所有命令和查询处理器到对应的总线
 * 3. 提供统一的认证操作入口，确保安全性和一致性
 * 4. 支持JWT令牌管理和会话状态跟踪
 * 
 * 架构特点：
 * - 采用CQRS模式，分离认证操作和查询操作
 * - 支持JWT令牌的生成、验证和刷新
 * - 提供会话管理和安全审计
 * - 支持多因子认证集成
 * 
 * @implements {OnModuleInit}
 */
@Module({
  providers: [
    // 应用服务
    AuthApplicationService,

    // Use Cases（用例）
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ValidateTokenUseCase,
    GetUserSessionsUseCase,
    GetLoginHistoryUseCase,

    // CQRS总线
    CommandBus,
    QueryBus,

    // 命令处理器
    LoginHandler,
    LogoutHandler,
    RefreshTokenHandler,
    ValidateTokenHandler,

    // 查询处理器
    GetUserSessionsHandler,
    GetLoginHistoryHandler,
  ],
  exports: [
    AuthApplicationService,
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ValidateTokenUseCase,
    GetUserSessionsUseCase,
    GetLoginHistoryUseCase,
    CommandBus,
    QueryBus,
  ],
})
export class AuthApplicationModule implements OnModuleInit {
  /**
   * @constructor
   * @description
   * 构造函数，注入命令总线和处理器依赖
   * 
   * @param {CommandBus} commandBus - 命令总线，用于处理所有认证命令操作
   * @param {QueryBus} queryBus - 查询总线，用于处理所有认证查询操作
   * @param {LoginHandler} loginHandler - 登录命令处理器
   * @param {LogoutHandler} logoutHandler - 登出命令处理器
   * @param {RefreshTokenHandler} refreshTokenHandler - 刷新令牌命令处理器
   * @param {ValidateTokenHandler} validateTokenHandler - 验证令牌命令处理器
   * @param {GetUserSessionsHandler} getUserSessionsHandler - 获取用户会话查询处理器
   * @param {GetLoginHistoryHandler} getLoginHistoryHandler - 获取登录历史查询处理器
   */
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loginHandler: LoginHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
    private readonly validateTokenHandler: ValidateTokenHandler,
    private readonly getUserSessionsHandler: GetUserSessionsHandler,
    private readonly getLoginHistoryHandler: GetLoginHistoryHandler,
  ) { }

  /**
   * @function onModuleInit
   * @description
   * 模块初始化方法。该方法在模块启动时自动调用，负责注册所有认证相关的命令和查询处理器
   * 到对应的总线中，确保CQRS架构的正确运行。
   * 
   * @returns {void}
   */
  onModuleInit() {
    // 注册命令处理器
    this.commandBus.registerHandler('LoginCommand', this.loginHandler);
    this.commandBus.registerHandler('LogoutCommand', this.logoutHandler);
    this.commandBus.registerHandler('RefreshTokenCommand', this.refreshTokenHandler);
    this.commandBus.registerHandler('ValidateTokenCommand', this.validateTokenHandler);

    // 注册查询处理器
    this.queryBus.registerHandler('GetUserSessionsQuery', this.getUserSessionsHandler);
    this.queryBus.registerHandler('GetLoginHistoryQuery', this.getLoginHistoryHandler);
  }
}
