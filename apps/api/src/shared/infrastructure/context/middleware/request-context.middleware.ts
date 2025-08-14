import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../services/request-context.service';

/**
 * @class RequestContextMiddleware
 * @description
 * 请求上下文中间件，负责初始化和管理每个HTTP请求的上下文信息。
 * 
 * 主要功能包括：
 * 1. 为每个请求生成唯一ID
 * 2. 提取和设置请求基本信息
 * 3. 初始化各种上下文（租户、用户、安全等）
 * 4. 设置请求开始时间
 * 5. 提取客户端信息
 * 
 * 设计原则：
 * - 早期初始化：在请求处理的最早期初始化上下文
 * - 信息完整：提取尽可能完整的请求信息
 * - 性能优化：最小化对请求处理的影响
 * - 错误处理：确保即使出错也能正常处理请求
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) { }

  /**
   * @method use
   * @description 中间件主方法
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   * @param {NextFunction} next 下一个中间件函数
   */
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // 生成请求ID（如果请求头中没有提供）
      const requestId = this.extractRequestId(req);

      // 提取客户端IP
      const clientIp = this.extractClientIp(req);

      // 提取用户代理
      const userAgent = req.get('User-Agent');

      // 提取租户信息
      const tenantId = this.extractTenantId(req);

      // 提取用户信息
      const userId = this.extractUserId(req);

      // 提取会话信息
      const sessionId = this.extractSessionId(req);

      // 提取认证信息
      const authToken = this.extractAuthToken(req);

      // 初始化请求上下文
      this.contextService.setRequestContext({
        requestId,
        tenantId,
        userId,
        sessionId,
        clientIp,
        userAgent,
        startTime: Date.now(),
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        params: req.params,
        query: req.query,
        body: this.sanitizeBody(req.body),
      });

      // 初始化安全上下文
      this.contextService.setSecurityContext({
        authenticated: !!authToken,
        authMethod: authToken ? 'bearer' : undefined,
        authToken,
        securityLevel: 'low',
        riskScore: 0,
        securityEvents: [],
      });

      // 初始化性能上下文
      this.contextService.setPerformanceContext({
        startTime: Date.now(),
        dbQueries: 0,
        dbQueryTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        externalApiCalls: 0,
        externalApiTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      });

      // 设置响应头
      res.setHeader('X-Request-ID', requestId);
      if (tenantId) {
        res.setHeader('X-Tenant-ID', tenantId);
      }

      // 监听响应完成事件
      res.on('finish', () => {
        this.handleResponseComplete(req, res);
      });

      // 监听响应错误事件
      res.on('error', (error: Error) => {
        this.handleResponseError(req, res, error);
      });

      next();
    } catch (error) {
      // 即使出错也要确保请求能继续处理
      console.error('RequestContextMiddleware error:', error);
      next();
    }
  }

  /**
   * @private
   * @method extractRequestId
   * @description 提取请求ID
   * @param {Request} req Express请求对象
   * @returns {string} 请求ID
   */
  private extractRequestId(req: Request): string {
    // 优先从请求头获取
    const headerRequestId = req.get('X-Request-ID') || req.get('x-request-id');
    if (headerRequestId) {
      return headerRequestId;
    }

    // 从查询参数获取
    const queryRequestId = req.query.requestId || req.query.request_id;
    if (queryRequestId) {
      return String(queryRequestId);
    }

    // 生成新的请求ID
    return uuidv4();
  }

  /**
   * @private
   * @method extractClientIp
   * @description 提取客户端IP
   * @param {Request} req Express请求对象
   * @returns {string} 客户端IP
   */
  private extractClientIp(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0] ||
      req.get('X-Real-IP') ||
      req.get('X-Client-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * @private
   * @method extractTenantId
   * @description 提取租户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 租户ID
   */
  private extractTenantId(req: Request): string | undefined {
    // 从请求头获取
    const headerTenantId = req.get('X-Tenant-ID') || req.get('x-tenant-id');
    if (headerTenantId) return headerTenantId;

    // 从查询参数获取
    const queryTenantId = req.query.tenantId || req.query.tenant_id;
    if (queryTenantId) return String(queryTenantId);

    // 从请求体获取
    const bodyTenantId = req.body?.tenantId || req.body?.tenant_id;
    if (bodyTenantId) return String(bodyTenantId);

    return undefined;
  }

  /**
   * @private
   * @method extractUserId
   * @description 提取用户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 用户ID
   */
  private extractUserId(req: Request): string | undefined {
    // 从请求头获取
    const headerUserId = req.get('X-User-ID') || req.get('x-user-id');
    if (headerUserId) return headerUserId;

    // 从查询参数获取
    const queryUserId = req.query.userId || req.query.user_id;
    if (queryUserId) return String(queryUserId);

    // 从请求体获取
    const bodyUserId = req.body?.userId || req.body?.user_id;
    if (bodyUserId) return String(bodyUserId);

    return undefined;
  }

  /**
   * @private
   * @method extractSessionId
   * @description 提取会话ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 会话ID
   */
  private extractSessionId(req: Request): string | undefined {
    // 从Cookie获取
    const sessionCookie = req.cookies?.sessionId || req.cookies?.session_id;
    if (sessionCookie) return sessionCookie;

    // 从请求头获取
    const headerSessionId = req.get('X-Session-ID') || req.get('x-session-id');
    if (headerSessionId) return headerSessionId;

    return undefined;
  }

  /**
   * @private
   * @method extractAuthToken
   * @description 提取认证令牌
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 认证令牌
   */
  private extractAuthToken(req: Request): string | undefined {
    // 从Authorization头获取
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 从查询参数获取
    const queryToken = req.query.token || req.query.access_token;
    if (queryToken) return String(queryToken);

    // 从请求体获取
    const bodyToken = req.body?.token || req.body?.access_token;
    if (bodyToken) return String(bodyToken);

    return undefined;
  }

  /**
   * @private
   * @method sanitizeHeaders
   * @description 清理请求头，移除敏感信息
   * @param {Record<string, any>} headers 请求头
   * @returns {Record<string, string>} 清理后的请求头
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * @private
   * @method sanitizeBody
   * @description 清理请求体，移除敏感信息
   * @param {any} body 请求体
   * @returns {any} 清理后的请求体
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * @private
   * @method handleResponseComplete
   * @description 处理响应完成事件
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   */
  private handleResponseComplete(req: Request, res: Response): void {
    try {
      const requestContext = this.contextService.getRequestContext();
      const performanceContext = this.contextService.getPerformanceContext();

      // 更新响应信息
      this.contextService.setRequestContext({
        statusCode: res.statusCode,
        responseTime: Date.now() - requestContext.startTime,
      });

      // 更新性能信息
      this.contextService.setPerformanceContext({
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
      });
    } catch (error) {
      console.error('Error handling response complete:', error);
    }
  }

  /**
   * @private
   * @method handleResponseError
   * @description 处理响应错误事件
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   * @param {Error} error 错误对象
   */
  private handleResponseError(req: Request, res: Response, error: Error): void {
    try {
      // 更新错误信息
      this.contextService.setRequestContext({
        error,
        statusCode: res.statusCode || 500,
      });

      // 添加安全事件
      this.contextService.addSecurityEvent(`response_error: ${error.message}`);
    } catch (contextError) {
      console.error('Error handling response error:', contextError);
    }
  }
}
