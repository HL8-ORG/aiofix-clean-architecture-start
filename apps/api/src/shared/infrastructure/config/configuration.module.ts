/**
 * @file configuration.module.ts
 * @description 配置管理模块
 * 
 * 该模块整合了所有配置相关的服务，包括：
 * - 配置服务
 * - 配置验证器
 * - 配置加密服务
 * - 配置缓存服务
 * - 配置加载器
 * 
 * 遵循DDD和Clean Architecture原则，提供统一的配置管理功能。
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

/**
 * @class ConfigurationModule
 * @description 配置管理模块
 * 
 * 提供统一的配置管理功能，包括：
 * - 环境变量配置
 * - 配置文件加载
 * - 配置验证
 * - 配置加密
 * - 配置缓存
 * - 租户配置管理
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
  ],
  providers: [
    // TODO: 添加配置相关服务
    // ConfigurationService,
    // ConfigurationValidator,
    // ConfigurationEncryptionService,
    // ConfigurationCacheService,
    // EnvironmentConfigLoader,
    // FileConfigLoader,
  ],
  exports: [
    // TODO: 导出配置相关服务
    // ConfigurationService,
    // ConfigurationValidator,
    // ConfigurationEncryptionService,
    // ConfigurationCacheService,
  ],
})
export class ConfigurationModule { }
