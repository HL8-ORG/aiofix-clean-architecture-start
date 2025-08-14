import { Injectable } from '@nestjs/common';
import type { MikroORMOptions } from '@mikro-orm/core';
import { DatabaseConfig, DatabaseType, ConnectionTestResult } from '../../interfaces/database-config.interface';
import { MongoDBConfig } from '../../configs/mongodb.config';
import type { IMikroOrmAdapter, MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

@Injectable()
export class MongodbMikroOrmAdapter implements IMikroOrmAdapter {
  readonly supportedDatabaseType: DatabaseType = DatabaseType.MONGODB;
  readonly adapterName: string = 'MongoDB MikroORM Adapter';
  private readonly options: MikroOrmAdapterOptions;

  constructor(options: MikroOrmAdapterOptions = {}) {
    this.options = {
      debug: false,
      logging: true,
      connectTimeout: 30000,
      queryTimeout: 30000,
      enableConnectionPool: true,
      pool: { min: 0, max: 10, acquireTimeout: 60000, idleTimeout: 300000, lifetime: 1800000 },
      ssl: false,
      sslOptions: { rejectUnauthorized: false },
      ...options,
    };
  }

  createMikroOrmConfig(config: DatabaseConfig, entities: any[] = [], migrations: any = {}): MikroORMOptions {
    if (!this.validateConfig(config)) {
      throw new Error('配置类型不匹配，需要MongoDB配置');
    }

    const mongoConfig = config as MongoDBConfig;
    const mikroOrmConfig = mongoConfig.toMikroOrmConfig();

    return {
      host: mikroOrmConfig.host,
      port: mikroOrmConfig.port,
      dbName: mikroOrmConfig.dbName,
      user: mikroOrmConfig.user,
      password: mikroOrmConfig.password,
      entities: entities,
      debug: this.options.debug || mongoConfig.debug || false,
      ...this.getDatabaseSpecificOptions(config),
    } as MikroORMOptions;
  }

  validateConfig(config: DatabaseConfig): boolean {
    return config.type === DatabaseType.MONGODB;
  }

  async testConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: '配置类型不匹配，需要MongoDB配置',
          connectionTime: Date.now() - startTime,
        };
      }

      const mongoConfig = config as MongoDBConfig;
      const validation = mongoConfig.validate();
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
      throw new Error('配置类型不匹配，需要MongoDB配置');
    }
    const mongoConfig = config as MongoDBConfig;
    return mongoConfig.getConnectionString();
  }

  getDatabaseSpecificOptions(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const mongoConfig = config as MongoDBConfig;
    return {
      // MongoDB特定配置
      driverOptions: {
        // 连接选项
        connectTimeoutMS: mongoConfig.connectTimeout,
        socketTimeoutMS: mongoConfig.queryTimeout,
        serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS,
        heartbeatFrequencyMS: mongoConfig.heartbeatFrequencyMS,
        
        // 连接池选项
        maxPoolSize: mongoConfig.maxPoolSize,
        minPoolSize: mongoConfig.minPoolSize,
        maxIdleTimeMS: mongoConfig.maxIdleTimeMS,
        
        // 读写偏好
        readPreference: mongoConfig.readPreference,
        writeConcern: mongoConfig.writeConcern,
        
        // 认证选项
        authSource: mongoConfig.authSource,
        
        // 副本集选项
        ...(mongoConfig.replicaSet && { replicaSet: mongoConfig.replicaSet }),
        
        // 重试选项
        retryWrites: true,
        retryReads: true,
        
        // 压缩选项
        compressors: ['zlib'],
        
        // 其他选项
        directConnection: !mongoConfig.replicaSet,
        maxConnecting: 2,
        bufferCommands: true,
        bufferMaxEntries: 0,
      },

      // 副本集配置
      ...(mongoConfig.replicaSet && {
        replicaSet: mongoConfig.replicaSet,
        readPreference: mongoConfig.readPreference,
        writeConcern: mongoConfig.writeConcern,
      }),

      // 分片集群配置
      ...(mongoConfig.replicaSet && {
        mongos: {
          readPreference: mongoConfig.readPreference,
          writeConcern: mongoConfig.writeConcern,
        },
      }),

      // 连接池配置
      pool: {
        min: mongoConfig.minPoolSize || this.options.pool?.min || 0,
        max: mongoConfig.maxPoolSize || this.options.pool?.max || 10,
        acquireTimeout: this.options.pool?.acquireTimeout || 60000,
        idleTimeout: mongoConfig.maxIdleTimeMS || this.options.pool?.idleTimeout || 300000,
        lifetime: this.options.pool?.lifetime || 1800000,
      },

      // 性能优化配置
      extra: {
        max: mongoConfig.maxPoolSize || 10,
        min: mongoConfig.minPoolSize || 0,
        acquireTimeoutMillis: this.options.pool?.acquireTimeout || 60000,
        idleTimeoutMillis: mongoConfig.maxIdleTimeMS || 300000,
        createTimeoutMillis: mongoConfig.connectTimeout,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        propagateCreateError: false,
      },

      // 查询优化配置
      queryBuilder: { enabled: true, cache: true, cacheTTL: 300000 },
      metadataCache: { enabled: true, ttl: 300000, path: process.cwd() + '/temp/metadata' },
    };
  }

  supportsDatabaseType(databaseType: DatabaseType): boolean {
    return databaseType === DatabaseType.MONGODB;
  }

  getOptions(): MikroOrmAdapterOptions {
    return { ...this.options };
  }

  updateOptions(options: Partial<MikroOrmAdapterOptions>): void {
    Object.assign(this.options, options);
  }

  getConnectionParameters(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const mongoConfig = config as MongoDBConfig;
    return {
      host: mongoConfig.host,
      port: mongoConfig.port,
      database: mongoConfig.database,
      username: mongoConfig.username,
      password: mongoConfig.password,
      authSource: mongoConfig.authSource,
      replicaSet: mongoConfig.replicaSet,
      readPreference: mongoConfig.readPreference,
      writeConcern: mongoConfig.writeConcern,
      maxPoolSize: mongoConfig.maxPoolSize,
      minPoolSize: mongoConfig.minPoolSize,
      maxIdleTimeMS: mongoConfig.maxIdleTimeMS,
      connectTimeoutMS: mongoConfig.connectTimeout,
      socketTimeoutMS: mongoConfig.queryTimeout,
      serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: mongoConfig.heartbeatFrequencyMS,
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'],
      directConnection: !mongoConfig.replicaSet,
      maxConnecting: 2,
      bufferCommands: true,
      bufferMaxEntries: 0,
    };
  }

  /**
   * 获取MongoDB特定的连接选项
   * 
   * @param config 数据库配置
   * @returns MongoDB连接选项
   */
  getMongoDBConnectionOptions(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const mongoConfig = config as MongoDBConfig;
    return {
      // 基本连接选项
      host: mongoConfig.host,
      port: mongoConfig.port,
      database: mongoConfig.database,
      username: mongoConfig.username,
      password: mongoConfig.password,
      
      // 认证选项
      authSource: mongoConfig.authSource,
      
      // 副本集选项
      ...(mongoConfig.replicaSet && { replicaSet: mongoConfig.replicaSet }),
      
      // 读写偏好
      readPreference: mongoConfig.readPreference,
      writeConcern: mongoConfig.writeConcern,
      
      // 连接池选项
      maxPoolSize: mongoConfig.maxPoolSize,
      minPoolSize: mongoConfig.minPoolSize,
      maxIdleTimeMS: mongoConfig.maxIdleTimeMS,
      
      // 超时选项
      connectTimeoutMS: mongoConfig.connectTimeout,
      socketTimeoutMS: mongoConfig.queryTimeout,
      serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: mongoConfig.heartbeatFrequencyMS,
      
      // 重试选项
      retryWrites: true,
      retryReads: true,
      
      // 压缩选项
      compressors: ['zlib'],
      
      // 其他选项
      directConnection: !mongoConfig.replicaSet,
      maxConnecting: 2,
      bufferCommands: true,
      bufferMaxEntries: 0,
    };
  }

  /**
   * 获取MongoDB特定的查询选项
   * 
   * @param config 数据库配置
   * @returns MongoDB查询选项
   */
  getMongoDBQueryOptions(config: DatabaseConfig): Record<string, any> {
    if (!this.validateConfig(config)) return {};

    const mongoConfig = config as MongoDBConfig;
    return {
      readPreference: mongoConfig.readPreference,
      writeConcern: mongoConfig.writeConcern,
      maxTimeMS: mongoConfig.queryTimeout,
      retryWrites: true,
      retryReads: true,
    };
  }
}
