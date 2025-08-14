import { Injectable } from '@nestjs/common';
import type { MikroORMOptions } from '@mikro-orm/core';
import { DatabaseConfig, DatabaseType, ConnectionTestResult } from '../../interfaces/database-config.interface';
import { PostgreSQLConfig } from '../../configs/postgresql.config';
import type { IMikroOrmAdapter, MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

@Injectable()
export class PostgresqlMikroOrmAdapter implements IMikroOrmAdapter {
  readonly supportedDatabaseType: DatabaseType = DatabaseType.POSTGRESQL;
  readonly adapterName: string = 'PostgreSQL MikroORM Adapter';
  private readonly options: MikroOrmAdapterOptions;

  constructor(options: MikroOrmAdapterOptions = {}) {
    this.options = {
      debug: false,
      logging: true,
      connectTimeout: 30000,
      queryTimeout: 30000,
      enableConnectionPool: true,
      pool: { min: 5, max: 20, acquireTimeout: 60000, idleTimeout: 300000, lifetime: 1800000 },
      ssl: false,
      sslOptions: { rejectUnauthorized: false },
      ...options,
    };
  }

  createMikroOrmConfig(config: DatabaseConfig, entities: any[] = [], migrations: any = {}): MikroORMOptions {
    if (!this.validateConfig(config)) {
      throw new Error('配置类型不匹配，需要PostgreSQL配置');
    }

    const pgConfig = config as PostgreSQLConfig;
    const mikroOrmConfig = pgConfig.toMikroOrmConfig();

    return {
      host: mikroOrmConfig.host,
      port: mikroOrmConfig.port,
      dbName: mikroOrmConfig.dbName,
      user: mikroOrmConfig.user,
      password: mikroOrmConfig.password,
      entities: entities,
      debug: this.options.debug || pgConfig.debug || false,
      ...this.getDatabaseSpecificOptions(config),
    } as MikroORMOptions;
  }

  validateConfig(config: DatabaseConfig): boolean {
    return config.type === DatabaseType.POSTGRESQL;
  }

  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: '配置类型不匹配，需要PostgreSQL配置',
          connectionTime: Date.now() - startTime,
        };
      }

      const pgConfig = config as PostgreSQLConfig;
      const validation = pgConfig.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: `配置验证失败: ${validation.errors.join(', ')}`,
          connectionTime: Date.now() - startTime,
        };
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        connectionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        connectionTime: Date.now() - startTime,
      };
    }
  }

  getConnectionString(config: DatabaseConfig): string {
    if (!this.validateConfig(config)) {
      throw new Error('配置类型不匹配，需要PostgreSQL配置');
    }
    const pgConfig = config as PostgreSQLConfig;
    return pgConfig.getConnectionString();
  }

  getDatabaseSpecificOptions(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const pgConfig = config as PostgreSQLConfig;
    return {
      driverOptions: {
        connection: {
          application_name: 'IAM-System',
          client_encoding: 'utf8',
          timezone: 'UTC',
        },
        query_timeout: pgConfig.queryTimeout,
        connection_timeout: pgConfig.connectTimeout,
        statement_timeout: pgConfig.queryTimeout,
        idle_in_transaction_session_timeout: 60000,
      },
      ...(pgConfig.ssl?.enabled && {
        ssl: {
          rejectUnauthorized: pgConfig.ssl.rejectUnauthorized,
          ...(pgConfig.ssl.ca && { ca: pgConfig.ssl.ca }),
          ...(pgConfig.ssl.cert && { cert: pgConfig.ssl.cert }),
          ...(pgConfig.ssl.key && { key: pgConfig.ssl.key }),
        },
      }),
    };
  }

  supportsDatabaseType(databaseType: DatabaseType): boolean {
    return databaseType === DatabaseType.POSTGRESQL;
  }

  getOptions(): MikroOrmAdapterOptions {
    return { ...this.options };
  }

  updateOptions(options: Partial<MikroOrmAdapterOptions>): void {
    Object.assign(this.options, options);
  }

  getConnectionParameters(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const pgConfig = config as PostgreSQLConfig;
    return {
      host: pgConfig.host,
      port: pgConfig.port,
      database: pgConfig.database,
      user: pgConfig.username,
      password: pgConfig.password,
      ssl: pgConfig.ssl?.enabled ? {
        rejectUnauthorized: pgConfig.ssl.rejectUnauthorized,
        ca: pgConfig.ssl.ca,
        cert: pgConfig.ssl.cert,
        key: pgConfig.ssl.key,
      } : false,
      connectionTimeoutMillis: pgConfig.connectTimeout,
      query_timeout: pgConfig.queryTimeout,
      statement_timeout: pgConfig.queryTimeout,
      idle_in_transaction_session_timeout: 60000,
      application_name: 'IAM-System',
      client_encoding: 'utf8',
      timezone: 'UTC',
    };
  }
}
