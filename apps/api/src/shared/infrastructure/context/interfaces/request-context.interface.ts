/**
 * @file request-context.interface.ts
 * @description 请求上下文接口定义
 * 
 * 该文件定义了在CLS（Continuation Local Storage）中存储的请求上下文数据结构。
 * 用于在整个请求生命周期中传递和访问请求相关的信息。
 * 
 * 主要功能：
 * 1. 定义请求上下文数据结构
 * 2. 定义租户上下文数据结构
 * 3. 定义用户上下文数据结构
 * 4. 定义安全上下文数据结构
 * 5. 定义性能上下文数据结构
 * 6. 定义审计上下文数据结构
 */

/**
 * @interface RequestContext
 * @description 请求上下文接口
 */
export interface RequestContext {
  /** 请求ID */
  requestId: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 客户端IP */
  clientIp?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求开始时间 */
  startTime: number;
  /** HTTP方法 */
  method?: string;
  /** 请求URL */
  url?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数 */
  params?: Record<string, any>;
  /** 查询参数 */
  query?: Record<string, any>;
  /** 请求体 */
  body?: any;
  /** 响应状态码 */
  statusCode?: number;
  /** 响应时间 */
  responseTime?: number;
  /** 错误信息 */
  error?: Error;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface TenantContext
 * @description 租户上下文接口
 */
export interface TenantContext {
  /** 租户ID */
  tenantId: string;
  /** 租户代码 */
  tenantCode?: string;
  /** 租户名称 */
  tenantName?: string;
  /** 租户状态 */
  tenantStatus?: string;
  /** 租户配置 */
  tenantConfig?: Record<string, any>;
  /** 租户时区 */
  timezone?: string;
  /** 租户语言 */
  language?: string;
  /** 租户货币 */
  currency?: string;
}

/**
 * @interface UserContext
 * @description 用户上下文接口
 */
export interface UserContext {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username?: string;
  /** 邮箱 */
  email?: string;
  /** 用户状态 */
  userStatus?: string;
  /** 用户角色 */
  roles?: string[];
  /** 用户权限 */
  permissions?: string[];
  /** 用户组织 */
  organizations?: string[];
  /** 用户偏好 */
  preferences?: Record<string, any>;
}

/**
 * @interface SecurityContext
 * @description 安全上下文接口
 */
export interface SecurityContext {
  /** 认证状态 */
  authenticated: boolean;
  /** 认证方式 */
  authMethod?: string;
  /** 认证令牌 */
  authToken?: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 令牌过期时间 */
  tokenExpiresAt?: number;
  /** 多因子认证状态 */
  mfaEnabled?: boolean;
  /** 多因子认证验证状态 */
  mfaVerified?: boolean;
  /** 会话ID */
  sessionId?: string;
  /** 安全级别 */
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * @interface PerformanceContext
 * @description 性能上下文接口
 */
export interface PerformanceContext {
  /** 请求开始时间 */
  startTime: number;
  /** 数据库查询次数 */
  dbQueries: number;
  /** 数据库查询时间 */
  dbQueryTime: number;
  /** 缓存命中次数 */
  cacheHits: number;
  /** 缓存未命中次数 */
  cacheMisses: number;
  /** 缓存操作时间 */
  cacheTime: number;
  /** 外部API调用次数 */
  externalApiCalls: number;
  /** 外部API调用时间 */
  externalApiTime: number;
  /** 内存使用量 */
  memoryUsage: number;
  /** CPU使用率 */
  cpuUsage: number;
}

/**
 * @interface AuditContext
 * @description 审计上下文接口
 */
export interface AuditContext {
  /** 操作类型 */
  operationType: string;
  /** 操作描述 */
  operationDescription?: string;
  /** 操作资源 */
  resource?: string;
  /** 操作资源ID */
  resourceId?: string;
  /** 操作前状态 */
  beforeState?: any;
  /** 操作后状态 */
  afterState?: any;
  /** 操作结果 */
  result?: 'success' | 'failure' | 'partial';
  /** 操作原因 */
  reason?: string;
  /** 风险级别 */
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** 合规要求 */
  complianceRequirements?: string[];
}

/**
 * @interface IRequestContextService
 * @description 请求上下文服务接口
 */
export interface IRequestContextService {
  /**
   * @method getRequestContext
   * @description 获取请求上下文
   * @returns {RequestContext} 请求上下文
   */
  getRequestContext(): RequestContext;

  /**
   * @method getTenantContext
   * @description 获取租户上下文
   * @returns {TenantContext | null} 租户上下文
   */
  getTenantContext(): TenantContext | null;

  /**
   * @method getUserContext
   * @description 获取用户上下文
   * @returns {UserContext | null} 用户上下文
   */
  getUserContext(): UserContext | null;

  /**
   * @method getSecurityContext
   * @description 获取安全上下文
   * @returns {SecurityContext} 安全上下文
   */
  getSecurityContext(): SecurityContext;

  /**
   * @method getPerformanceContext
   * @description 获取性能上下文
   * @returns {PerformanceContext} 性能上下文
   */
  getPerformanceContext(): PerformanceContext;

  /**
   * @method getAuditContext
   * @description 获取审计上下文
   * @returns {AuditContext | null} 审计上下文
   */
  getAuditContext(): AuditContext | null;

  /**
   * @method setRequestContext
   * @description 设置请求上下文
   * @param {Partial<RequestContext>} context 请求上下文
   */
  setRequestContext(context: Partial<RequestContext>): void;

  /**
   * @method setTenantContext
   * @description 设置租户上下文
   * @param {TenantContext} context 租户上下文
   */
  setTenantContext(context: TenantContext): void;

  /**
   * @method setUserContext
   * @description 设置用户上下文
   * @param {UserContext} context 用户上下文
   */
  setUserContext(context: UserContext): void;

  /**
   * @method setSecurityContext
   * @description 设置安全上下文
   * @param {Partial<SecurityContext>} context 安全上下文
   */
  setSecurityContext(context: Partial<SecurityContext>): void;

  /**
   * @method setPerformanceContext
   * @description 设置性能上下文
   * @param {Partial<PerformanceContext>} context 性能上下文
   */
  setPerformanceContext(context: Partial<PerformanceContext>): void;

  /**
   * @method setAuditContext
   * @description 设置审计上下文
   * @param {AuditContext} context 审计上下文
   */
  setAuditContext(context: AuditContext): void;

  /**
   * @method clear
   * @description 清除所有上下文
   */
  clear(): void;

  /**
   * @method isInitialized
   * @description 检查上下文是否已初始化
   * @returns {boolean} 是否已初始化
   */
  isInitialized(): boolean;

  /**
   * @method getRequestId
   * @description 获取请求ID
   * @returns {string} 请求ID
   */
  getRequestId(): string;

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string | undefined} 租户ID
   */
  getTenantId(): string | undefined;

  /**
   * @method getUserId
   * @description 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  getUserId(): string | undefined;

  /**
   * @method getSessionId
   * @description 获取会话ID
   * @returns {string | undefined} 会话ID
   */
  getSessionId(): string | undefined;

  /**
   * @method incrementDbQueries
   * @description 增加数据库查询次数
   * @param {number} count 增加的数量
   */
  incrementDbQueries(count?: number): void;

  /**
   * @method incrementCacheHits
   * @description 增加缓存命中次数
   * @param {number} count 增加的数量
   */
  incrementCacheHits(count?: number): void;

  /**
   * @method incrementCacheMisses
   * @description 增加缓存未命中次数
   * @param {number} count 增加的数量
   */
  incrementCacheMisses(count?: number): void;

  /**
   * @method addDbQueryTime
   * @description 添加数据库查询时间
   * @param {number} time 查询时间（毫秒）
   */
  addDbQueryTime(time: number): void;

  /**
   * @method addCacheTime
   * @description 添加缓存操作时间
   * @param {number} time 操作时间（毫秒）
   */
  addCacheTime(time: number): void;

  /**
   * @method addExternalApiTime
   * @description 添加外部API调用时间
   * @param {number} time 调用时间（毫秒）
   */
  addExternalApiTime(time: number): void;

  /**
   * @method setResponseTime
   * @description 设置响应时间
   * @param {number} time 响应时间（毫秒）
   */
  setResponseTime(time: number): void;

  /**
   * @method setStatusCode
   * @description 设置响应状态码
   * @param {number} statusCode 状态码
   */
  setStatusCode(statusCode: number): void;

  /**
   * @method setError
   * @description 设置错误信息
   * @param {Error} error 错误对象
   */
  setError(error: Error): void;
}
