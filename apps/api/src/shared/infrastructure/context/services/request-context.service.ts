import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import {
  IRequestContextService,
  RequestContext,
  TenantContext,
  UserContext,
  SecurityContext,
  PerformanceContext,
  AuditContext,
} from '../interfaces/request-context.interface';

/**
 * @class RequestContextService
 * @description
 * 基于nestjs-cls的请求上下文服务，提供完整的请求生命周期上下文管理。
 * 
 * 主要功能包括：
 * 1. 请求上下文管理（requestId、租户、用户等）
 * 2. 租户上下文管理
 * 3. 用户上下文管理
 * 4. 安全上下文管理
 * 5. 性能上下文管理
 * 6. 审计上下文管理
 * 
 * 设计原则：
 * - 类型安全：完整的TypeScript类型支持
 * - 自动管理：基于CLS自动管理上下文生命周期
 * - 性能优化：最小化对请求处理的影响
 * - 扩展性：支持自定义元数据和扩展字段
 */
@Injectable()
export class RequestContextService implements IRequestContextService {
  private static readonly CONTEXT_KEYS = {
    REQUEST: 'request',
    TENANT: 'tenant',
    USER: 'user',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    AUDIT: 'audit',
  } as const;

  constructor(private readonly cls: ClsService) { }

  /**
   * @method getRequestContext
   * @description 获取完整的请求上下文
   * @returns {RequestContext} 请求上下文
   */
  getRequestContext(): RequestContext {
    const context = this.cls.get<RequestContext>(RequestContextService.CONTEXT_KEYS.REQUEST);

    if (!context) {
      // 如果上下文不存在，创建一个默认的
      const defaultContext: RequestContext = {
        requestId: uuidv4(),
        startTime: Date.now(),
      };
      this.setRequestContext(defaultContext);
      return defaultContext;
    }

    return context;
  }

  /**
   * @method getTenantContext
   * @description 获取租户上下文
   * @returns {TenantContext | null} 租户上下文
   */
  getTenantContext(): TenantContext | null {
    return this.cls.get<TenantContext>(RequestContextService.CONTEXT_KEYS.TENANT) || null;
  }

  /**
   * @method getUserContext
   * @description 获取用户上下文
   * @returns {UserContext | null} 用户上下文
   */
  getUserContext(): UserContext | null {
    return this.cls.get<UserContext>(RequestContextService.CONTEXT_KEYS.USER) || null;
  }

  /**
   * @method getSecurityContext
   * @description 获取安全上下文
   * @returns {SecurityContext} 安全上下文
   */
  getSecurityContext(): SecurityContext {
    const context = this.cls.get<SecurityContext>(RequestContextService.CONTEXT_KEYS.SECURITY);

    if (!context) {
      // 如果安全上下文不存在，创建一个默认的
      const defaultContext: SecurityContext = {
        authenticated: false,
      };
      this.setSecurityContext(defaultContext);
      return defaultContext;
    }

    return context;
  }

  /**
   * @method getPerformanceContext
   * @description 获取性能上下文
   * @returns {PerformanceContext} 性能上下文
   */
  getPerformanceContext(): PerformanceContext {
    const context = this.cls.get<PerformanceContext>(RequestContextService.CONTEXT_KEYS.PERFORMANCE);

    if (!context) {
      // 如果性能上下文不存在，创建一个默认的
      const defaultContext: PerformanceContext = {
        startTime: Date.now(),
        dbQueries: 0,
        dbQueryTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheTime: 0,
        externalApiCalls: 0,
        externalApiTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };
      this.setPerformanceContext(defaultContext);
      return defaultContext;
    }

    return context;
  }

  /**
   * @method getAuditContext
   * @description 获取审计上下文
   * @returns {AuditContext | null} 审计上下文
   */
  getAuditContext(): AuditContext | null {
    return this.cls.get<AuditContext>(RequestContextService.CONTEXT_KEYS.AUDIT) || null;
  }

  /**
   * @method setRequestContext
   * @description 设置请求上下文
   * @param {Partial<RequestContext>} context 上下文信息
   * @returns {void}
   */
  setRequestContext(context: Partial<RequestContext>): void {
    const currentContext = this.cls.get<RequestContext>(RequestContextService.CONTEXT_KEYS.REQUEST);
    const updatedContext = { ...currentContext, ...context };
    this.cls.set(RequestContextService.CONTEXT_KEYS.REQUEST, updatedContext);
  }

  /**
   * @method setTenantContext
   * @description 设置租户上下文
   * @param {TenantContext} context 租户上下文
   * @returns {void}
   */
  setTenantContext(context: TenantContext): void {
    this.cls.set(RequestContextService.CONTEXT_KEYS.TENANT, context);

    // 同时更新请求上下文中的租户ID
    this.setRequestContext({ tenantId: context.tenantId });
  }

  /**
   * @method setUserContext
   * @description 设置用户上下文
   * @param {UserContext} context 用户上下文
   * @returns {void}
   */
  setUserContext(context: UserContext): void {
    this.cls.set(RequestContextService.CONTEXT_KEYS.USER, context);

    // 同时更新请求上下文中的用户ID
    this.setRequestContext({ userId: context.userId });
  }

  /**
   * @method setSecurityContext
   * @description 设置安全上下文
   * @param {Partial<SecurityContext>} context 安全上下文
   * @returns {void}
   */
  setSecurityContext(context: Partial<SecurityContext>): void {
    const currentContext = this.cls.get<SecurityContext>(RequestContextService.CONTEXT_KEYS.SECURITY);
    const updatedContext = { ...currentContext, ...context };
    this.cls.set(RequestContextService.CONTEXT_KEYS.SECURITY, updatedContext);
  }

  /**
   * @method setPerformanceContext
   * @description 设置性能上下文
   * @param {Partial<PerformanceContext>} context 性能上下文
   * @returns {void}
   */
  setPerformanceContext(context: Partial<PerformanceContext>): void {
    const currentContext = this.cls.get<PerformanceContext>(RequestContextService.CONTEXT_KEYS.PERFORMANCE);
    const updatedContext = { ...currentContext, ...context };
    this.cls.set(RequestContextService.CONTEXT_KEYS.PERFORMANCE, updatedContext);
  }

  /**
   * @method setAuditContext
   * @description 设置审计上下文
   * @param {AuditContext} context 审计上下文
   * @returns {void}
   */
  setAuditContext(context: AuditContext): void {
    this.cls.set(RequestContextService.CONTEXT_KEYS.AUDIT, context);
  }

  /**
   * @method clear
   * @description 清除所有上下文
   * @returns {void}
   */
  clear(): void {
    Object.values(RequestContextService.CONTEXT_KEYS).forEach(key => {
      this.cls.set(key, undefined);
    });
  }

  /**
   * @method isInitialized
   * @description 检查上下文是否已初始化
   * @returns {boolean} 是否已初始化
   */
  isInitialized(): boolean {
    return this.cls.has(RequestContextService.CONTEXT_KEYS.REQUEST);
  }

  // ==================== 便捷方法 ====================

  /**
   * @method getRequestId
   * @description 获取请求ID
   * @returns {string} 请求ID
   */
  getRequestId(): string {
    return this.getRequestContext().requestId;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string | undefined} 租户ID
   */
  getTenantId(): string | undefined {
    return this.getRequestContext().tenantId;
  }

  /**
   * @method getUserId
   * @description 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  getUserId(): string | undefined {
    return this.getRequestContext().userId;
  }

  /**
   * @method getClientIp
   * @description 获取客户端IP
   * @returns {string | undefined} 客户端IP
   */
  getClientIp(): string | undefined {
    return this.getRequestContext().clientIp;
  }

  /**
   * @method getUserAgent
   * @description 获取用户代理
   * @returns {string | undefined} 用户代理
   */
  getUserAgent(): string | undefined {
    return this.getRequestContext().userAgent;
  }

  /**
   * @method isAuthenticated
   * @description 检查是否已认证
   * @returns {boolean} 是否已认证
   */
  isAuthenticated(): boolean {
    return this.getSecurityContext().authenticated;
  }

  /**
   * @method getAuthToken
   * @description 获取认证令牌
   * @returns {string | undefined} 认证令牌
   */
  getAuthToken(): string | undefined {
    return this.getSecurityContext().authToken;
  }

  /**
   * @method getSessionId
   * @description 获取会话ID
   * @returns {string | undefined} 会话ID
   */
  getSessionId(): string | undefined {
    return this.getRequestContext().sessionId;
  }

  /**
   * @method incrementDbQueries
   * @description 增加数据库查询次数
   * @param {number} count 增加的数量
   */
  incrementDbQueries(count: number = 1): void {
    const performance = this.getPerformanceContext();
    performance.dbQueries += count;
    this.setPerformanceContext(performance);
  }

  /**
   * @method incrementCacheHits
   * @description 增加缓存命中次数
   * @param {number} count 增加的数量
   */
  incrementCacheHits(count: number = 1): void {
    const performance = this.getPerformanceContext();
    performance.cacheHits += count;
    this.setPerformanceContext(performance);
  }

  /**
   * @method incrementCacheMisses
   * @description 增加缓存未命中次数
   * @param {number} count 增加的数量
   */
  incrementCacheMisses(count: number = 1): void {
    const performance = this.getPerformanceContext();
    performance.cacheMisses += count;
    this.setPerformanceContext(performance);
  }

  /**
   * @method addDbQueryTime
   * @description 添加数据库查询时间
   * @param {number} time 查询时间（毫秒）
   */
  addDbQueryTime(time: number): void {
    const performance = this.getPerformanceContext();
    performance.dbQueryTime += time;
    this.setPerformanceContext(performance);
  }

  /**
   * @method addCacheTime
   * @description 添加缓存操作时间
   * @param {number} time 操作时间（毫秒）
   */
  addCacheTime(time: number): void {
    const performance = this.getPerformanceContext();
    performance.cacheTime += time;
    this.setPerformanceContext(performance);
  }

  /**
   * @method addExternalApiTime
   * @description 添加外部API调用时间
   * @param {number} time 调用时间（毫秒）
   */
  addExternalApiTime(time: number): void {
    const performance = this.getPerformanceContext();
    performance.externalApiTime += time;
    this.setPerformanceContext(performance);
  }

  /**
   * @method setResponseTime
   * @description 设置响应时间
   * @param {number} time 响应时间（毫秒）
   */
  setResponseTime(time: number): void {
    this.setRequestContext({ responseTime: time });
  }

  /**
   * @method setStatusCode
   * @description 设置响应状态码
   * @param {number} statusCode 状态码
   */
  setStatusCode(statusCode: number): void {
    this.setRequestContext({ statusCode });
  }

  /**
   * @method setError
   * @description 设置错误信息
   * @param {Error} error 错误对象
   */
  setError(error: Error): void {
    this.setRequestContext({ error });
  }



  /**
   * @method setMetadata
   * @description 设置元数据
   * @param {string} key 键
   * @param {any} value 值
   * @returns {void}
   */
  setMetadata(key: string, value: any): void {
    const context = this.getRequestContext();
    if (!context.metadata) {
      context.metadata = {};
    }
    context.metadata[key] = value;
    this.setRequestContext(context);
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @param {string} key 键
   * @returns {any} 值
   */
  getMetadata(key: string): any {
    const context = this.getRequestContext();
    return context.metadata?.[key];
  }

  /**
   * @method getAllMetadata
   * @description 获取所有元数据
   * @returns {Record<string, any>} 所有元数据
   */
  getAllMetadata(): Record<string, any> {
    const context = this.getRequestContext();
    return context.metadata || {};
  }
}
