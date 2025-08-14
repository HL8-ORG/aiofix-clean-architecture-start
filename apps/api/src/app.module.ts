import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContextModule } from './shared/infrastructure/context/context.module';

/**
 * @class AppModule
 * @description
 * 应用的根模块，负责组织和配置应用的核心组件。
 * 
 * 主要功能：
 * 1. 导入其他模块和依赖
 * 2. 注册控制器和服务
 * 3. 配置应用的全局设置
 * 
 * 模块结构：
 * - controllers: 注册HTTP请求处理器
 * - providers: 注册服务提供者
 * - imports: 导入其他模块
 */
@Module({
  imports: [ContextModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
