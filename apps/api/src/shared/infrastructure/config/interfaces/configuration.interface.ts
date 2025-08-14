import { DatabaseType } from '../../database/interfaces/database-config.interface';

/**
 * @enum ConfigSource
 * @description
 * 配置源枚举，定义配置的来源类型。
 */
export enum ConfigSource {
  /** 环境变量 */
  ENVIRONMENT = 'environment',
  /** 配置文件 */
  FILE = 'file',
  /** 数据库 */
  DATABASE = 'database',
  /** 远程配置中心 */
  REMOTE = 'remote',
  /** 内存 */
  MEMORY = 'memory',
  /** 默认值 */
  DEFAULT = 'default',
}

/**
 * @enum ConfigScope
 * @description
 * 配置作用域枚举，定义配置的作用范围。
 */
export enum ConfigScope {
  /** 系统级配置 */
  SYSTEM = 'system',
  /** 租户级配置 */
  TENANT = 'tenant',
  /** 模块级配置 */
  MODULE = 'module',
  /** 用户级配置 */
  USER = 'user',
  /** 运行时配置 */
  RUNTIME = 'runtime',
}

/**
 * @interface ConfigValue
 * @description
 * 配置值接口，包含配置值的元数据信息。
 */
export interface ConfigValue<T = any> {
  /** 配置值 */
  readonly value: T;
  /** 配置源 */
  readonly source: ConfigSource;
  /** 配置作用域 */
  readonly scope: ConfigScope;
  /** 最后更新时间 */
  readonly lastUpdated: Date;
  /** 是否加密 */
  readonly isEncrypted: boolean;
  /** 版本号 */
  readonly version: number;
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface ConfigKey
 * @description
 * 配置键接口，定义配置键的结构。
 */
export interface ConfigKey {
  /** 配置键名 */
  readonly key: string;
  /** 配置作用域 */
  readonly scope: ConfigScope;
  /** 租户ID（如果适用） */
  readonly tenantId?: string;
  /** 模块名（如果适用） */
  readonly module?: string;
  /** 用户ID（如果适用） */
  readonly userId?: string;
}

/**
 * @interface ConfigOptions
 * @description
 * 配置选项接口，定义配置的选项参数。
 */
export interface ConfigOptions {
  /** 是否加密 */
  encrypt?: boolean;
  /** 加密算法 */
  encryptionAlgorithm?: string;
  /** 是否缓存 */
  cache?: boolean;
  /** 缓存时间（毫秒） */
  cacheTtl?: number;
  /** 是否验证 */
  validate?: boolean;
  /** 验证规则 */
  validationRules?: any;
  /** 默认值 */
  defaultValue?: any;
  /** 描述 */
  description?: string;
  /** 是否敏感信息 */
  sensitive?: boolean;
  /** 自定义选项 */
  custom?: Record<string, any>;
}

/**
 * @interface ConfigChangeEvent
 * @description
 * 配置变更事件接口，定义配置变更的事件信息。
 */
export interface ConfigChangeEvent {
  /** 事件ID */
  readonly eventId: string;
  /** 配置键 */
  readonly configKey: ConfigKey;
  /** 旧值 */
  readonly oldValue?: ConfigValue;
  /** 新值 */
  readonly newValue: ConfigValue;
  /** 变更时间 */
  readonly timestamp: Date;
  /** 变更原因 */
  readonly reason?: string;
  /** 操作用户 */
  readonly userId?: string;
  /** 请求ID */
  readonly requestId?: string;
}

/**
 * @interface ConfigValidationResult
 * @description
 * 配置验证结果接口，定义配置验证的结果信息。
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  readonly isValid: boolean;
  /** 错误信息 */
  readonly errors: string[];
  /** 警告信息 */
  readonly warnings: string[];
  /** 验证时间 */
  readonly validatedAt: Date;
  /** 验证规则 */
  readonly validationRules: any;
}

/**
 * @interface ConfigCacheInfo
 * @description
 * 配置缓存信息接口，定义配置缓存的状态信息。
 */
export interface ConfigCacheInfo {
  /** 缓存键 */
  readonly cacheKey: string;
  /** 是否命中缓存 */
  readonly isHit: boolean;
  /** 缓存时间 */
  readonly cachedAt: Date;
  /** 过期时间 */
  readonly expiresAt: Date;
  /** 缓存大小 */
  readonly size: number;
  /** 访问次数 */
  readonly accessCount: number;
  /** 最后访问时间 */
  readonly lastAccessed: Date;
}

/**
 * @interface ConfigStats
 * @description
 * 配置统计信息接口，定义配置系统的统计信息。
 */
export interface ConfigStats {
  /** 总配置数 */
  readonly totalConfigs: number;
  /** 缓存命中率 */
  readonly cacheHitRate: number;
  /** 平均访问时间（毫秒） */
  readonly averageAccessTime: number;
  /** 配置变更次数 */
  readonly changeCount: number;
  /** 验证失败次数 */
  readonly validationFailures: number;
  /** 加密配置数 */
  readonly encryptedConfigs: number;
  /** 各作用域配置数 */
  readonly configsByScope: Record<ConfigScope, number>;
  /** 各源配置数 */
  readonly configsBySource: Record<ConfigSource, number>;
}

/**
 * @interface IConfigurationService
 * @description
 * 配置服务接口，定义配置管理的核心功能。
 * 
 * 主要职责：
 * 1. 配置的读取和写入
 * 2. 配置的验证和加密
 * 3. 配置的缓存管理
 * 4. 配置的变更通知
 * 5. 配置的版本管理
 * 6. 配置的审计和监控
 * 
 * 设计原则：
 * - 分层配置：支持系统、租户、模块、用户等不同层级的配置
 * - 安全可靠：支持配置加密、验证和访问控制
 * - 高性能：支持配置缓存和异步加载
 * - 可扩展：支持多种配置源和存储方式
 * - 可监控：提供完整的配置审计和监控功能
 */
export interface IConfigurationService {
  /**
   * 获取配置值
   * 
   * @param key 配置键
   * @param options 配置选项
   * @returns 配置值
   */
  get<T = any>(key: string | ConfigKey, options?: ConfigOptions): Promise<ConfigValue<T>>;

  /**
   * 设置配置值
   * 
   * @param key 配置键
   * @param value 配置值
   * @param options 配置选项
   * @returns 是否成功设置
   */
  set<T = any>(key: string | ConfigKey, value: T, options?: ConfigOptions): Promise<boolean>;

  /**
   * 删除配置
   * 
   * @param key 配置键
   * @returns 是否成功删除
   */
  delete(key: string | ConfigKey): Promise<boolean>;

  /**
   * 检查配置是否存在
   * 
   * @param key 配置键
   * @returns 是否存在
   */
  has(key: string | ConfigKey): Promise<boolean>;

  /**
   * 获取所有配置键
   * 
   * @param scope 配置作用域
   * @param pattern 匹配模式
   * @returns 配置键列表
   */
  getKeys(scope?: ConfigScope, pattern?: string): Promise<string[]>;

  /**
   * 获取配置值（同步版本）
   * 
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getSync<T = any>(key: string | ConfigKey, defaultValue?: T): T;

  /**
   * 设置配置值（同步版本）
   * 
   * @param key 配置键
   * @param value 配置值
   * @returns 是否成功设置
   */
  setSync<T = any>(key: string | ConfigKey, value: T): boolean;

  /**
   * 批量获取配置
   * 
   * @param keys 配置键列表
   * @param options 配置选项
   * @returns 配置值映射
   */
  getBatch(keys: (string | ConfigKey)[], options?: ConfigOptions): Promise<Record<string, ConfigValue>>;

  /**
   * 批量设置配置
   * 
   * @param configs 配置映射
   * @param options 配置选项
   * @returns 成功设置的配置数量
   */
  setBatch(configs: Record<string, any>, options?: ConfigOptions): Promise<number>;

  /**
   * 验证配置
   * 
   * @param key 配置键
   * @param value 配置值
   * @param rules 验证规则
   * @returns 验证结果
   */
  validate(key: string | ConfigKey, value: any, rules?: any): Promise<ConfigValidationResult>;

  /**
   * 加密配置值
   * 
   * @param value 原始值
   * @param algorithm 加密算法
   * @returns 加密后的值
   */
  encrypt(value: any, algorithm?: string): Promise<string>;

  /**
   * 解密配置值
   * 
   * @param encryptedValue 加密值
   * @param algorithm 加密算法
   * @returns 解密后的值
   */
  decrypt(encryptedValue: string, algorithm?: string): Promise<any>;

  /**
   * 刷新配置缓存
   * 
   * @param key 配置键（可选，不指定则刷新所有）
   * @returns 刷新的配置数量
   */
  refreshCache(key?: string | ConfigKey): Promise<number>;

  /**
   * 清除配置缓存
   * 
   * @param key 配置键（可选，不指定则清除所有）
   * @returns 清除的配置数量
   */
  clearCache(key?: string | ConfigKey): Promise<number>;

  /**
   * 获取配置缓存信息
   * 
   * @param key 配置键
   * @returns 缓存信息
   */
  getCacheInfo(key: string | ConfigKey): Promise<ConfigCacheInfo | null>;

  /**
   * 获取配置统计信息
   * 
   * @returns 统计信息
   */
  getStats(): Promise<ConfigStats>;

  /**
   * 监听配置变更
   * 
   * @param key 配置键
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  watch(key: string | ConfigKey, callback: (event: ConfigChangeEvent) => void): () => void;

  /**
   * 获取配置历史
   * 
   * @param key 配置键
   * @param limit 限制数量
   * @returns 配置变更历史
   */
  getHistory(key: string | ConfigKey, limit?: number): Promise<ConfigChangeEvent[]>;

  /**
   * 导出配置
   * 
   * @param scope 配置作用域
   * @param format 导出格式
   * @returns 导出的配置数据
   */
  export(scope?: ConfigScope, format?: 'json' | 'yaml' | 'env'): Promise<string>;

  /**
   * 导入配置
   * 
   * @param data 配置数据
   * @param format 导入格式
   * @param options 导入选项
   * @returns 导入的配置数量
   */
  import(data: string, format?: 'json' | 'yaml' | 'env', options?: ConfigOptions): Promise<number>;

  /**
   * 备份配置
   * 
   * @param scope 配置作用域
   * @returns 备份数据
   */
  backup(scope?: ConfigScope): Promise<string>;

  /**
   * 恢复配置
   * 
   * @param backupData 备份数据
   * @param options 恢复选项
   * @returns 恢复的配置数量
   */
  restore(backupData: string, options?: ConfigOptions): Promise<number>;
}
