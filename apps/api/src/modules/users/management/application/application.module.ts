import { Module, OnModuleInit } from '@nestjs/common';
import { UserApplicationService } from './services/user-application.service';
import { CommandBus } from './bus/command-bus';
import { QueryBus } from './bus/query-bus';

// 命令处理器导入
import { CreateUserHandler } from './handlers/commands/create-user.handler';
import { UpdateUserHandler } from './handlers/commands/update-user.handler';
import { DeleteUserHandler } from './handlers/commands/delete-user.handler';
import { ActivateUserHandler } from './handlers/commands/activate-user.handler';
import { DeactivateUserHandler } from './handlers/commands/deactivate-user.handler';
import { ChangePasswordHandler } from './handlers/commands/change-password.handler';
import { ResetPasswordHandler } from './handlers/commands/reset-password.handler';
import { ChangeUserStatusHandler } from './handlers/commands/change-user-status.handler';

// 查询处理器导入
import { GetUserHandler } from './handlers/queries/get-user.handler';
import { GetUsersHandler } from './handlers/queries/get-users.handler';
import { GetUserByEmailHandler } from './handlers/queries/get-user-by-email.handler';
import { GetUserByUsernameHandler } from './handlers/queries/get-user-by-username.handler';
import { SearchUsersHandler } from './handlers/queries/search-users.handler';

/**
 * @class UserManagementApplicationModule
 * @description
 * 用户管理应用层模块。该模块负责配置CQRS架构和所有处理器，
 * 实现命令查询职责分离模式，提供完整的用户管理应用服务。
 * 
 * 主要原理与机制如下：
 * 1. 通过依赖注入容器管理所有应用服务、命令总线和查询总线
 * 2. 在模块初始化时自动注册所有命令和查询处理器到对应的总线
 * 3. 提供统一的命令和查询执行入口，确保业务逻辑的一致性
 * 4. 支持模块的动态加载和配置，便于扩展和维护
 * 
 * 架构特点：
 * - 采用CQRS模式，分离读写操作
 * - 支持命令和查询的异步处理
 * - 提供统一的异常处理和日志记录
 * - 支持处理器的手动注册和自动发现
 * 
 * @implements {OnModuleInit}
 */
@Module({
  providers: [
    // 应用服务
    UserApplicationService,

    // CQRS总线
    CommandBus,
    QueryBus,

    // 命令处理器
    CreateUserHandler,
    UpdateUserHandler,
    DeleteUserHandler,
    ActivateUserHandler,
    DeactivateUserHandler,
    ChangePasswordHandler,
    ResetPasswordHandler,
    ChangeUserStatusHandler,

    // 查询处理器
    GetUserHandler,
    GetUsersHandler,
    GetUserByEmailHandler,
    GetUserByUsernameHandler,
    SearchUsersHandler,
  ],
  exports: [
    UserApplicationService,
    CommandBus,
    QueryBus,
  ],
})
export class UserManagementApplicationModule implements OnModuleInit {
  /**
   * @constructor
   * @description
   * 构造函数，注入命令总线和查询总线依赖
   * 
   * @param {CommandBus} commandBus - 命令总线，用于处理所有命令操作
   * @param {QueryBus} queryBus - 查询总线，用于处理所有查询操作
   */
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * @function onModuleInit
   * @description
   * 模块初始化方法。该方法在模块启动时自动调用，负责注册所有命令和查询处理器
   * 到对应的总线中，确保CQRS架构的正确运行。
   * 
   * 注册流程：
   * 1. 注册所有命令处理器到命令总线，支持用户CRUD操作
   * 2. 注册所有查询处理器到查询总线，支持用户信息查询
   * 3. 建立命令和查询与处理器的映射关系
   * 4. 初始化总线的内部状态和配置
   * 
   * 处理器映射：
   * - CreateUserCommand -> CreateUserHandler
   * - UpdateUserCommand -> UpdateUserHandler
   * - DeleteUserCommand -> DeleteUserHandler
   * - ActivateUserCommand -> ActivateUserHandler
   * - DeactivateUserCommand -> DeactivateUserHandler
   * - ChangePasswordCommand -> ChangePasswordHandler
   * - ResetPasswordCommand -> ResetPasswordHandler
   * - GetUserQuery -> GetUserHandler
   * - GetUsersQuery -> GetUsersHandler
   * - GetUserByEmailQuery -> GetUserByEmailHandler
   * - GetUserByUsernameQuery -> GetUserByUsernameHandler
   * 
   * @returns {void}
   */
  onModuleInit() {
    // 注册命令处理器
    this.commandBus.register('CreateUserCommand', CreateUserHandler);
    this.commandBus.register('UpdateUserCommand', UpdateUserHandler);
    this.commandBus.register('DeleteUserCommand', DeleteUserHandler);
    this.commandBus.register('ActivateUserCommand', ActivateUserHandler);
    this.commandBus.register('DeactivateUserCommand', DeactivateUserHandler);
    this.commandBus.register('ChangePasswordCommand', ChangePasswordHandler);
    this.commandBus.register('ResetPasswordCommand', ResetPasswordHandler);

    // 注册查询处理器
    this.queryBus.register('GetUserQuery', GetUserHandler);
    this.queryBus.register('GetUsersQuery', GetUsersHandler);
    this.queryBus.register('GetUserByEmailQuery', GetUserByEmailHandler);
    this.queryBus.register('GetUserByUsernameQuery', GetUserByUsernameHandler);
  }
}
