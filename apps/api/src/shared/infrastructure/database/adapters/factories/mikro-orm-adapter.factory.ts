import { Injectable } from '@nestjs/common';
import { DatabaseType } from '../../interfaces/database-config.interface';
import { PostgresqlMikroOrmAdapter } from '../implementations/postgresql-mikro-orm.adapter';
import { MongodbMikroOrmAdapter } from '../implementations/mongodb-mikro-orm.adapter';
import type { IMikroOrmAdapter, MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

/**
 * @interface IMikroOrmAdapterFactory
 * @description
 * MikroORM适配器工厂接口，负责创建和管理数据库适配器。
 * 
 * 主要职责：
 * 1. 根据数据库类型创建对应的适配器
 * 2. 管理适配器的生命周期
 * 3. 提供适配器注册和发现功能
 * 4. 支持自定义适配器选项
 */
export interface IMikroOrmAdapterFactory {
  /**
   * 创建适配器
   * 
   * @param databaseType 数据库类型
   * @param options 适配器选项
   * @returns 数据库适配器
   */
  createAdapter(databaseType: DatabaseType, options?: MikroOrmAdapterOptions): IMikroOrmAdapter;

  /**
   * 获取适配器
   * 
   * @param databaseType 数据库类型
   * @returns 数据库适配器
   */
  getAdapter(databaseType: DatabaseType): IMikroOrmAdapter | null;

  /**
   * 注册适配器
   * 
   * @param databaseType 数据库类型
   * @param adapter 适配器实例
   */
  registerAdapter(databaseType: DatabaseType, adapter: IMikroOrmAdapter): void;

  /**
   * 获取支持的数据库类型
   * 
   * @returns 支持的数据库类型列表
   */
  getSupportedDatabaseTypes(): DatabaseType[];

  /**
   * 检查是否支持指定的数据库类型
   * 
   * @param databaseType 数据库类型
   * @returns 是否支持
   */
  supportsDatabaseType(databaseType: DatabaseType): boolean;

  /**
   * 获取所有适配器
   * 
   * @returns 所有适配器的映射
   */
  getAllAdapters(): Map<DatabaseType, IMikroOrmAdapter>;
}

/**
 * @class MikroOrmAdapterFactory
 * @description
 * MikroORM适配器工厂实现，提供适配器的创建和管理功能。
 * 
 * 主要功能：
 * 1. 根据数据库类型创建对应的适配器
 * 2. 缓存已创建的适配器实例
 * 3. 支持自定义适配器选项
 * 4. 提供适配器注册和发现功能
 * 
 * 设计原则：
 * - 工厂模式：统一创建适配器的入口
 * - 单例模式：每个数据库类型只创建一个适配器实例
 * - 开闭原则：支持扩展新的数据库类型
 */
@Injectable()
export class MikroOrmAdapterFactory implements IMikroOrmAdapterFactory {
  /**
   * 适配器缓存
   */
  private readonly adapters = new Map<DatabaseType, IMikroOrmAdapter>();

  /**
   * 默认适配器选项
   */
  private readonly defaultOptions: MikroOrmAdapterOptions = {
    debug: false,
    logging: true,
    connectTimeout: 30000,
    queryTimeout: 30000,
    enableConnectionPool: true,
    pool: {
      min: 5,
      max: 20,
      acquireTimeout: 60000,
      idleTimeout: 300000,
      lifetime: 1800000,
    },
    ssl: false,
    sslOptions: {
      rejectUnauthorized: false,
    },
  };

  constructor() {
    // 预创建默认适配器
    this.createDefaultAdapters();
  }

  /**
   * 创建适配器
   * 
   * @param databaseType 数据库类型
   * @param options 适配器选项
   * @returns 数据库适配器
   */
  createAdapter(databaseType: DatabaseType, options?: MikroOrmAdapterOptions): IMikroOrmAdapter {
    // 检查是否已存在适配器
    const existingAdapter = this.adapters.get(databaseType);
    if (existingAdapter) {
      // 如果提供了新选项，更新现有适配器
      if (options) {
        existingAdapter.updateOptions(options);
      }
      return existingAdapter;
    }

    // 创建新的适配器
    const adapter = this.createNewAdapter(databaseType, options);

    // 缓存适配器
    this.adapters.set(databaseType, adapter);

    return adapter;
  }

  /**
   * 获取适配器
   * 
   * @param databaseType 数据库类型
   * @returns 数据库适配器
   */
  getAdapter(databaseType: DatabaseType): IMikroOrmAdapter | null {
    return this.adapters.get(databaseType) || null;
  }

  /**
   * 注册适配器
   * 
   * @param databaseType 数据库类型
   * @param adapter 适配器实例
   */
  registerAdapter(databaseType: DatabaseType, adapter: IMikroOrmAdapter): void {
    if (!adapter.supportsDatabaseType(databaseType)) {
      throw new Error(`适配器不支持数据库类型: ${databaseType}`);
    }

    this.adapters.set(databaseType, adapter);
  }

  /**
   * 获取支持的数据库类型
   * 
   * @returns 支持的数据库类型列表
   */
  getSupportedDatabaseTypes(): DatabaseType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 检查是否支持指定的数据库类型
   * 
   * @param databaseType 数据库类型
   * @returns 是否支持
   */
  supportsDatabaseType(databaseType: DatabaseType): boolean {
    return this.adapters.has(databaseType);
  }

  /**
   * 获取所有适配器
   * 
   * @returns 所有适配器的映射
   */
  getAllAdapters(): Map<DatabaseType, IMikroOrmAdapter> {
    return new Map(this.adapters);
  }

  /**
   * 创建新的适配器实例
   * 
   * @param databaseType 数据库类型
   * @param options 适配器选项
   * @returns 数据库适配器
   */
  private createNewAdapter(databaseType: DatabaseType, options?: MikroOrmAdapterOptions): IMikroOrmAdapter {
    const mergedOptions = { ...this.defaultOptions, ...options };

    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        return new PostgresqlMikroOrmAdapter(mergedOptions);

      case DatabaseType.MONGODB:
        return new MongodbMikroOrmAdapter(mergedOptions);

      case DatabaseType.MYSQL:
        // TODO: 实现MySQL适配器
        throw new Error(`MySQL适配器暂未实现: ${databaseType}`);

      case DatabaseType.SQLITE:
        // TODO: 实现SQLite适配器
        throw new Error(`SQLite适配器暂未实现: ${databaseType}`);

      default:
        throw new Error(`不支持的数据库类型: ${databaseType}`);
    }
  }

  /**
   * 创建默认适配器
   */
  private createDefaultAdapters(): void {
    // 创建PostgreSQL适配器
    const postgresqlAdapter = new PostgresqlMikroOrmAdapter(this.defaultOptions);
    this.adapters.set(DatabaseType.POSTGRESQL, postgresqlAdapter);

    // 创建MongoDB适配器
    const mongodbAdapter = new MongodbMikroOrmAdapter(this.defaultOptions);
    this.adapters.set(DatabaseType.MONGODB, mongodbAdapter);
  }

  /**
   * 更新默认选项
   * 
   * @param options 新的默认选项
   */
  updateDefaultOptions(options: Partial<MikroOrmAdapterOptions>): void {
    Object.assign(this.defaultOptions, options);

    // 更新所有现有适配器的选项
    for (const adapter of this.adapters.values()) {
      adapter.updateOptions(options);
    }
  }

  /**
   * 获取默认选项
   * 
   * @returns 默认选项
   */
  getDefaultOptions(): MikroOrmAdapterOptions {
    return { ...this.defaultOptions };
  }

  /**
   * 清除适配器缓存
   */
  clearAdapters(): void {
    this.adapters.clear();
  }

  /**
   * 移除适配器
   * 
   * @param databaseType 数据库类型
   * @returns 是否成功移除
   */
  removeAdapter(databaseType: DatabaseType): boolean {
    return this.adapters.delete(databaseType);
  }

  /**
   * 获取适配器统计信息
   * 
   * @returns 适配器统计信息
   */
  getAdapterStats(): {
    totalAdapters: number;
    supportedTypes: DatabaseType[];
    adapterNames: string[];
  } {
    const adapters = Array.from(this.adapters.values());

    return {
      totalAdapters: adapters.length,
      supportedTypes: Array.from(this.adapters.keys()),
      adapterNames: adapters.map(adapter => adapter.adapterName),
    };
  }
}
