// 基础接口
// 使用共享的CQRS基础设施，不再需要本地的基础命令类
// 使用共享的CQRS基础设施，不再需要本地的基础查询类
export * from './handlers/command-handler.interface';
export * from './handlers/query-handler.interface';
export * from './bus/command-bus.interface';
export * from './bus/query-bus.interface';

// 命令
export * from './commands/create-user.command';
export * from './commands/update-user.command';
export * from './commands/change-password.command';
export * from './commands/activate-user.command';
export * from './commands/deactivate-user.command';
export * from './commands/reset-password.command';

// 查询
export * from './queries/get-user.query';
export * from './queries/get-users.query';
export * from './queries/get-user-by-email.query';
export * from './queries/get-user-by-username.query';

// 处理器
export * from './handlers/commands/create-user.handler';
export * from './handlers/commands/update-user.handler';
export * from './handlers/queries/get-user.handler';
export * from './handlers/queries/get-users.handler';

// 总线
export * from './bus/command-bus';
export * from './bus/query-bus';

// 服务
export * from './services/user-application.service';
export * from './interfaces/user-application.interface';

// DTO
export * from './dto/user.dto';
export * from './dto/create-user.dto';
export * from './dto/update-user.dto';
export * from './dto/change-password.dto';
export * from './dto/user-list.dto';

// 模块
export * from './application.module';
