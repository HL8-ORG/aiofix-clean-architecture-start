import { Module, DynamicModule } from '@nestjs/common';
import { CommandBus } from '../bus/command-bus';
import { QueryBus } from '../bus/query-bus';
import type { ICommandHandler } from '../interfaces/command-handler.interface';
import type { IQueryHandler } from '../interfaces/query-handler.interface';

/**
 * @interface ApplicationModuleOptions
 * @description 应用层模块的配置选项
 */
export interface ApplicationModuleOptions {
  /**
   * @property {ICommandHandler[]} commandHandlers
   * @description 要注册的命令处理器列表
   */
  commandHandlers?: ICommandHandler[];

  /**
   * @property {IQueryHandler[]} queryHandlers
   * @description 要注册的查询处理器列表
   */
  queryHandlers?: IQueryHandler[];

  /**
   * @property {string} moduleName
   * @description 模块名称，用于标识不同的应用层模块
   */
  moduleName?: string;
}

/**
 * @class ApplicationModuleFactory
 * @description
 * 应用层模块工厂，用于动态创建包含CQRS基础设施的应用层模块。
 * 
 * 主要原理与机制如下：
 * 1. 工厂模式：提供统一的模块创建接口，支持不同的配置选项。
 * 2. 动态模块：利用NestJS的动态模块功能，支持运行时模块配置。
 * 3. 自动注册：自动注册命令和查询处理器到对应的总线。
 * 4. 依赖注入：通过NestJS的依赖注入系统管理组件生命周期。
 * 
 * 功能与职责：
 * - 动态创建应用层模块
 * - 自动注册命令和查询处理器
 * - 提供CQRS基础设施
 * - 支持模块的灵活配置
 * - 确保组件的正确初始化
 */
export class ApplicationModuleFactory {
  /**
   * @static
   * @method createModule
   * @description 创建应用层模块
   * 
   * @param options - 模块配置选项
   * @returns DynamicModule 动态模块
   * 
   * 主要职责：
   * 1. 创建动态模块
   * 2. 注册CQRS基础设施
   * 3. 注册命令和查询处理器
   * 4. 配置模块依赖关系
   */
  public static createModule(options: ApplicationModuleOptions): DynamicModule {
    const { commandHandlers = [], queryHandlers = [], moduleName = 'ApplicationModule' } = options;

    return {
      module: class DynamicApplicationModule { },
      global: false,
      providers: [
        // CQRS基础设施
        CommandBus,
        QueryBus,
        // 命令处理器
        ...commandHandlers,
        // 查询处理器
        ...queryHandlers,
      ],
      exports: [
        CommandBus,
        QueryBus,
        ...commandHandlers,
        ...queryHandlers,
      ],
    };
  }

  /**
   * @static
   * @method createModuleWithProviders
   * @description 创建包含自定义提供者的应用层模块
   * 
   * @param options - 模块配置选项
   * @param additionalProviders - 额外的提供者
   * @returns DynamicModule 动态模块
   * 
   * 主要职责：
   * 1. 创建包含自定义提供者的动态模块
   * 2. 注册CQRS基础设施和处理器
   * 3. 支持额外的依赖注入
   * 4. 配置完整的模块结构
   */
  public static createModuleWithProviders(
    options: ApplicationModuleOptions,
    additionalProviders: any[] = []
  ): DynamicModule {
    const { commandHandlers = [], queryHandlers = [], moduleName = 'ApplicationModule' } = options;

    return {
      module: class DynamicApplicationModule { },
      global: false,
      providers: [
        // CQRS基础设施
        CommandBus,
        QueryBus,
        // 命令处理器
        ...commandHandlers,
        // 查询处理器
        ...queryHandlers,
        // 额外的提供者
        ...additionalProviders,
      ],
      exports: [
        CommandBus,
        QueryBus,
        ...commandHandlers,
        ...queryHandlers,
        ...additionalProviders,
      ],
    };
  }

  /**
   * @static
   * @method createModuleWithImports
   * @description 创建包含导入模块的应用层模块
   * 
   * @param options - 模块配置选项
   * @param imports - 要导入的模块
   * @returns DynamicModule 动态模块
   * 
   * 主要职责：
   * 1. 创建包含导入模块的动态模块
   * 2. 注册CQRS基础设施和处理器
   * 3. 支持模块间的依赖关系
   * 4. 配置完整的模块结构
   */
  public static createModuleWithImports(
    options: ApplicationModuleOptions,
    imports: any[] = []
  ): DynamicModule {
    const { commandHandlers = [], queryHandlers = [], moduleName = 'ApplicationModule' } = options;

    return {
      module: class DynamicApplicationModule { },
      global: false,
      imports,
      providers: [
        // CQRS基础设施
        CommandBus,
        QueryBus,
        // 命令处理器
        ...commandHandlers,
        // 查询处理器
        ...queryHandlers,
      ],
      exports: [
        CommandBus,
        QueryBus,
        ...commandHandlers,
        ...queryHandlers,
      ],
    };
  }

  /**
   * @static
   * @method createGlobalModule
   * @description 创建全局应用层模块
   * 
   * @param options - 模块配置选项
   * @returns DynamicModule 全局动态模块
   * 
   * 主要职责：
   * 1. 创建全局动态模块
   * 2. 注册CQRS基础设施和处理器
   * 3. 支持全局访问
   * 4. 配置全局模块结构
   */
  public static createGlobalModule(options: ApplicationModuleOptions): DynamicModule {
    const { commandHandlers = [], queryHandlers = [], moduleName = 'GlobalApplicationModule' } = options;

    return {
      module: class GlobalDynamicApplicationModule { },
      global: true,
      providers: [
        // CQRS基础设施
        CommandBus,
        QueryBus,
        // 命令处理器
        ...commandHandlers,
        // 查询处理器
        ...queryHandlers,
      ],
      exports: [
        CommandBus,
        QueryBus,
        ...commandHandlers,
        ...queryHandlers,
      ],
    };
  }
}
