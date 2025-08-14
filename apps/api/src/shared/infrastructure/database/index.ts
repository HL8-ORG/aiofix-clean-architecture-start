// 数据库配置接口
export * from './interfaces/database-config.interface';

// 数据库配置实现
export { PostgreSQLConfig } from './configs/postgresql.config';
export { MongoDBConfig } from './configs/mongodb.config';

// 数据库配置工厂
export { DatabaseConfigFactoryImpl } from './factories/database-config.factory';

// 实际应用配置
export { DatabaseConfig } from './configs/database.config';

// 适配器接口
export type { IMikroOrmAdapter } from './adapters/interfaces/mikro-orm-adapter.interface';

// 适配器实现
export { PostgresqlMikroOrmAdapter } from './adapters/implementations/postgresql-mikro-orm.adapter';
export { MongodbMikroOrmAdapter } from './adapters/implementations/mongodb-mikro-orm.adapter';

// 适配器工厂
export { MikroOrmAdapterFactory } from './adapters/factories/mikro-orm-adapter.factory';
export type { IMikroOrmAdapterFactory } from './adapters/factories/mikro-orm-adapter.factory';

// 连接管理器
export { MikroOrmConnectionManager } from './adapters/managers/implementations/mikro-orm-connection-manager';
export type { IMikroOrmConnectionManager } from './adapters/managers/interfaces/mikro-orm-connection-manager.interface';
export type {
  ConnectionInfo,
  ConnectionOptions,
  ConnectionPoolInfo,
  ConnectionHealthCheck,
} from './adapters/managers/interfaces/mikro-orm-connection-manager.interface';
export { ConnectionStatus } from './adapters/managers/interfaces/mikro-orm-connection-manager.interface';

// 事务管理器
export { MikroOrmTransactionManager } from './adapters/managers/implementations/mikro-orm-transaction-manager';
export type { IMikroOrmTransactionManager } from './adapters/managers/interfaces/mikro-orm-transaction-manager.interface';
export type {
  ITransaction,
  TransactionInfo,
  TransactionOptions,
  TransactionResult,
  TransactionStats,
} from './adapters/managers/interfaces/mikro-orm-transaction-manager.interface';
export { TransactionStatus, TransactionIsolationLevel } from './adapters/managers/interfaces/mikro-orm-transaction-manager.interface';
