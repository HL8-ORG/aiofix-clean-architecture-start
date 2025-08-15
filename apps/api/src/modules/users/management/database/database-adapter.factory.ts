/**
 * @file infrastructure/database-adapter.factory.ts
 * @description 数据库适配器工厂
 * 
 * 核心职责：
 * 1. 管理不同数据库的实现
 * 2. 提供统一的接口来访问数据库特定的实现
 * 3. 支持运行时切换数据库
 * 4. 确保依赖注入的正确配置
 */

import { Injectable } from '@nestjs/common';

/**
 * @enum DatabaseType
 * @description 支持的数据库类型
 */
export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb'
}

/**
 * @interface DatabaseAdapter
 * @description 数据库适配器接口
 */
export interface DatabaseAdapter {
  readonly type: DatabaseType;
  readonly entities: any[];
  readonly repositories: any[];
  readonly mappers: any[];
}

/**
 * @class DatabaseAdapterFactory
 * @description 数据库适配器工厂
 */
@Injectable()
export class DatabaseAdapterFactory {
  private static currentAdapter: DatabaseAdapter;

  /**
   * @method setDatabaseType
   * @description 设置当前使用的数据库类型
   * @param type 数据库类型
   */
  static setDatabaseType(type: DatabaseType): void {
    switch (type) {
      case DatabaseType.POSTGRESQL:
        this.currentAdapter = this.createPostgreSQLAdapter();
        break;
      case DatabaseType.MONGODB:
        this.currentAdapter = this.createMongoDBAdapter();
        break;
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * @method getCurrentAdapter
   * @description 获取当前数据库适配器
   * @returns DatabaseAdapter
   */
  static getCurrentAdapter(): DatabaseAdapter {
    if (!this.currentAdapter) {
      // 默认使用PostgreSQL
      this.setDatabaseType(DatabaseType.POSTGRESQL);
    }
    return this.currentAdapter;
  }

  /**
   * @method getEntities
   * @description 获取当前数据库的实体列表
   * @returns any[]
   */
  static getEntities(): any[] {
    return this.getCurrentAdapter().entities;
  }

  /**
   * @method getRepositories
   * @description 获取当前数据库的仓储列表
   * @returns any[]
   */
  static getRepositories(): any[] {
    return this.getCurrentAdapter().repositories;
  }

  /**
   * @method getMappers
   * @description 获取当前数据库的映射器列表
   * @returns any[]
   */
  static getMappers(): any[] {
    return this.getCurrentAdapter().mappers;
  }

  /**
   * @method createPostgreSQLAdapter
   * @description 创建PostgreSQL适配器
   * @returns DatabaseAdapter
   * @private
   */
  private static createPostgreSQLAdapter(): DatabaseAdapter {
    // 动态导入PostgreSQL实现
    const { UserEntity } = require('../infrastructure/postgresql/entities/user.entity');
    const { UserRepository } = require('../infrastructure/postgresql/repositories/user.repository');
    const { UserMapper } = require('../infrastructure/postgresql/mappers/user.mapper');

    return {
      type: DatabaseType.POSTGRESQL,
      entities: [UserEntity],
      repositories: [UserRepository],
      mappers: [UserMapper]
    };
  }

  /**
   * @method createMongoDBAdapter
   * @description 创建MongoDB适配器
   * @returns DatabaseAdapter
   * @private
   */
  private static createMongoDBAdapter(): DatabaseAdapter {
    // TODO: 实现MongoDB适配器
    throw new Error('MongoDB adapter not implemented yet');
    
    // 示例代码（未来实现）：
    // const { UserEntity } = require('./mongodb/entities/user.entity');
    // const { UserRepository } = require('./mongodb/repositories/user.repository');
    // const { UserMapper } = require('./mongodb/mappers/user.mapper');
    //
    // return {
    //   type: DatabaseType.MONGODB,
    //   entities: [UserEntity],
    //   repositories: [UserRepository],
    //   mappers: [UserMapper]
    // };
  }

  /**
   * @method isPostgreSQL
   * @description 检查当前是否使用PostgreSQL
   * @returns boolean
   */
  static isPostgreSQL(): boolean {
    return this.getCurrentAdapter().type === DatabaseType.POSTGRESQL;
  }

  /**
   * @method isMongoDB
   * @description 检查当前是否使用MongoDB
   * @returns boolean
   */
  static isMongoDB(): boolean {
    return this.getCurrentAdapter().type === DatabaseType.MONGODB;
  }
}
