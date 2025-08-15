/**
 * @file infrastructure/users-management-dynamic.module.ts
 * @description 动态用户管理模块
 * 
 * 核心职责：
 * 1. 根据配置动态加载不同的数据库实现
 * 2. 提供统一的模块接口
 * 3. 支持运行时切换数据库
 * 4. 确保依赖注入的正确配置
 */

import { DynamicModule, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DatabaseType, DatabaseAdapterFactory } from './database/database-adapter.factory';

/**
 * @interface UsersManagementModuleOptions
 * @description 用户管理模块配置选项
 */
export interface UsersManagementModuleOptions {
  databaseType?: DatabaseType;
  autoLoad?: boolean;
}

/**
 * @class UsersManagementDynamicModule
 * @description 动态用户管理模块
 */
@Module({})
export class UsersManagementDynamicModule {
  /**
   * @method forRoot
   * @description 创建动态模块
   * @param options 模块配置选项
   * @returns DynamicModule
   */
  static forRoot(options: UsersManagementModuleOptions = {}): DynamicModule {
    const { databaseType = DatabaseType.POSTGRESQL, autoLoad = true } = options;

    // 设置数据库类型
    if (autoLoad) {
      DatabaseAdapterFactory.setDatabaseType(databaseType);
    }

    // 获取当前适配器
    const adapter = DatabaseAdapterFactory.getCurrentAdapter();

    return {
      module: UsersManagementDynamicModule,
      imports: [
        MikroOrmModule.forFeature(adapter.entities)
      ],
      providers: [
        ...adapter.repositories,
        ...adapter.mappers,
        {
          provide: 'IUserRepository',
          useClass: adapter.repositories[0] // 假设第一个是UserRepository
        },
        {
          provide: 'DatabaseType',
          useValue: databaseType
        }
      ],
      exports: [
        ...adapter.repositories,
        ...adapter.mappers,
        'IUserRepository',
        'DatabaseType'
      ]
    };
  }

  /**
   * @method forFeature
   * @description 创建特性模块（用于导入到其他模块）
   * @param options 模块配置选项
   * @returns DynamicModule
   */
  static forFeature(options: UsersManagementModuleOptions = {}): DynamicModule {
    return this.forRoot(options);
  }
}
