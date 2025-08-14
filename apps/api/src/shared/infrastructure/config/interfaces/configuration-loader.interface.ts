import type { ConfigValue, ConfigKey, ConfigSource, ConfigScope } from './configuration.interface';

/**
 * @enum LoaderType
 * @description
 * 加载器类型枚举，定义配置加载器的类型。
 */
export enum LoaderType {
  /** 环境变量加载器 */
  ENVIRONMENT = 'environment',
  /** 文件加载器 */
  FILE = 'file',
  /** 数据库加载器 */
  DATABASE = 'database',
  /** 远程配置加载器 */
  REMOTE = 'remote',
  /** 内存加载器 */
  MEMORY = 'memory',
  /** 默认值加载器 */
  DEFAULT = 'default',
}

/**
 * @interface LoaderOptions
 * @description
 * 加载器选项接口，定义加载器的选项参数。
 */
export interface LoaderOptions {
  /** 加载器类型 */
  type: LoaderType;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 重试间隔（毫秒） */
  retryInterval?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 自定义选项 */
  custom?: Record<string, any>;
}

/**
 * @interface LoaderResult<T = any>
 * @description
 * 加载器结果接口，定义加载器的返回结果。
 */
export interface LoaderResult<T = any> {
  /** 是否成功 */
  readonly success: boolean;
  /** 配置值 */
  readonly value?: T;
  /** 配置源 */
  readonly source: ConfigSource;
  /** 错误信息 */
  readonly error?: string;
  /** 加载时间（毫秒） */
  readonly loadTime: number;
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface LoaderStats
 * @description
 * 加载器统计信息接口，定义加载器的统计信息。
 */
export interface LoaderStats {
  /** 加载器类型 */
  readonly type: LoaderType;
  /** 总加载次数 */
  readonly totalLoads: number;
  /** 成功加载次数 */
  readonly successfulLoads: number;
  /** 失败加载次数 */
  readonly failedLoads: number;
  /** 平均加载时间（毫秒） */
  readonly averageLoadTime: number;
  /** 最后加载时间 */
  readonly lastLoadTime?: Date;
  /** 错误率 */
  readonly errorRate: number;
}

/**
 * @interface IConfigurationLoader
 * @description
 * 配置加载器接口，定义配置加载的核心功能。
 * 
 * 主要职责：
 * 1. 从不同源加载配置
 * 2. 配置的优先级管理
 * 3. 配置的缓存和刷新
 * 4. 配置的验证和转换
 * 5. 配置的监控和统计
 * 6. 配置的容错和重试
 * 
 * 设计原则：
 * - 分层加载：支持多个加载器的优先级管理
 * - 容错性：支持加载失败时的降级和重试
 * - 高性能：支持配置缓存和异步加载
 * - 可扩展：支持自定义加载器
 * - 可监控：提供完整的加载统计和监控
 */
export interface IConfigurationLoader {
  /**
   * 加载配置值
   * 
   * @param key 配置键
   * @param options 加载选项
   * @returns 加载结果
   */
  load<T = any>(key: string | ConfigKey, options?: LoaderOptions): Promise<LoaderResult<T>>;

  /**
   * 批量加载配置
   * 
   * @param keys 配置键列表
   * @param options 加载选项
   * @returns 加载结果映射
   */
  loadBatch<T = any>(
    keys: (string | ConfigKey)[],
    options?: LoaderOptions
  ): Promise<Record<string, LoaderResult<T>>>;

  /**
   * 预加载配置
   * 
   * @param keys 配置键列表
   * @param options 加载选项
   * @returns 预加载的配置数量
   */
  preload(keys: (string | ConfigKey)[], options?: LoaderOptions): Promise<number>;

  /**
   * 刷新配置
   * 
   * @param key 配置键（可选，不指定则刷新所有）
   * @returns 刷新的配置数量
   */
  refresh(key?: string | ConfigKey): Promise<number>;

  /**
   * 清除配置缓存
   * 
   * @param key 配置键（可选，不指定则清除所有）
   * @returns 清除的配置数量
   */
  clearCache(key?: string | ConfigKey): Promise<number>;

  /**
   * 获取加载器统计信息
   * 
   * @returns 统计信息
   */
  getStats(): Promise<LoaderStats[]>;

  /**
   * 添加加载器
   * 
   * @param loader 加载器实例
   * @param options 加载器选项
   * @returns 是否成功添加
   */
  addLoader(loader: IConfigurationLoader, options: LoaderOptions): boolean;

  /**
   * 移除加载器
   * 
   * @param type 加载器类型
   * @returns 是否成功移除
   */
  removeLoader(type: LoaderType): boolean;

  /**
   * 获取加载器
   * 
   * @param type 加载器类型
   * @returns 加载器实例
   */
  getLoader(type: LoaderType): IConfigurationLoader | null;

  /**
   * 获取所有加载器
   * 
   * @returns 加载器列表
   */
  getLoaders(): Array<{ loader: IConfigurationLoader; options: LoaderOptions }>;

  /**
   * 设置加载器选项
   * 
   * @param type 加载器类型
   * @param options 加载器选项
   * @returns 是否成功设置
   */
  setLoaderOptions(type: LoaderType, options: Partial<LoaderOptions>): boolean;

  /**
   * 获取加载器选项
   * 
   * @param type 加载器类型
   * @returns 加载器选项
   */
  getLoaderOptions(type: LoaderType): LoaderOptions | null;

  /**
   * 启用加载器
   * 
   * @param type 加载器类型
   * @param enabled 是否启用
   * @returns 是否成功设置
   */
  enableLoader(type: LoaderType, enabled: boolean): boolean;

  /**
   * 检查加载器是否启用
   * 
   * @param type 加载器类型
   * @returns 是否启用
   */
  isLoaderEnabled(type: LoaderType): boolean;

  /**
   * 获取加载器健康状态
   * 
   * @param type 加载器类型
   * @returns 健康状态
   */
  getLoaderHealth(type: LoaderType): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }>;

  /**
   * 获取所有加载器健康状态
   * 
   * @returns 健康状态映射
   */
  getAllLoadersHealth(): Promise<Record<LoaderType, {
    healthy: boolean;
    details: Record<string, any>;
  }>>;

  /**
   * 监听加载事件
   * 
   * @param eventType 事件类型
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  on(eventType: 'load' | 'error' | 'refresh', callback: (event: any) => void): () => void;

  /**
   * 获取加载事件历史
   * 
   * @param limit 限制数量
   * @returns 事件历史
   */
  getEventHistory(limit?: number): any[];

  /**
   * 导出加载器配置
   * 
   * @param format 导出格式
   * @returns 导出的配置
   */
  exportConfig(format?: 'json' | 'yaml'): Promise<string>;

  /**
   * 导入加载器配置
   * 
   * @param config 配置数据
   * @param format 导入格式
   * @returns 是否成功导入
   */
  importConfig(config: string, format?: 'json' | 'yaml'): Promise<boolean>;

  /**
   * 重置加载器统计
   * 
   * @param type 加载器类型（可选，不指定则重置所有）
   * @returns 是否成功重置
   */
  resetStats(type?: LoaderType): boolean;

  /**
   * 优化加载器
   * 
   * @param type 加载器类型（可选，不指定则优化所有）
   * @returns 优化结果
   */
  optimize(type?: LoaderType): Promise<{
    optimized: boolean;
    details: Record<string, any>;
  }>;
}
