/**
 * @file request-context.middleware.ts
 * @description 请求上下文中间件
 * 
 * 该中间件负责在请求开始时初始化请求上下文，并在请求结束时清理上下文。
 * 使用nestjs-cls确保在整个请求生命周期中都能访问到上下文信息。
 * 
 * 主要功能：
 * 1. 提取请求信息（ID、IP、User-Agent等）
 * 2. 提取租户和用户信息
 * 3. 初始化各种上下文
 * 4. 设置响应头
 * 5. 监听响应事件
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../services/request-context.service';

/**
 * @class RequestContextMiddleware
 * @description 请求上下文中间件
 * 
 * 负责在每个HTTP请求中初始化和管理请求上下文，确保：
 * - 每个请求都有唯一的请求ID
 * - 租户和用户信息正确传递
 * - 性能监控数据正确收集
 * - 响应头包含必要的追踪信息
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) { }

  /**
   * @method use
   * @description 中间件处理方法
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   * @param {NextFunction} next 下一个中间件函数
   */
  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // 提取请求信息
      const requestId = this.extractRequestId(req);
      const clientIp = this.extractClientIp(req);
      const userAgent = req.get('User-Agent');
      const tenantId = this.extractTenantId(req);
      const userId = this.extractUserId(req);
      const sessionId = this.extractSessionId(req);
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
        authToken,
        sessionId,
      });

      // 初始化性能上下文
      this.contextService.setPerformanceContext({
        startTime: Date.now(),
      });

      // 设置响应头
      res.setHeader('X-Request-ID', requestId);
      if (tenantId) {
        res.setHeader('X-Tenant-ID', tenantId);
      }

      // 监听响应完成事件
      res.on('finish', () => {
        this.handleResponseFinish(req, res);
      });

      // 监听响应错误事件
      res.on('error', (error: Error) => {
        this.handleResponseError(req, res, error);
      });

      next();
    } catch (error) {
      console.error('RequestContextMiddleware error:', error);
      next();
    }
  }

  /**
   * @private extractRequestId
   * @description 提取请求ID
   * @param {Request} req Express请求对象
   * @returns {string} 请求ID
   */
  private extractRequestId(req: Request): string {
    // 优先从请求头获取
    const headerRequestId = req.get('X-Request-ID');
    if (headerRequestId) {
      return headerRequestId;
    }

    // 从查询参数获取
    const queryRequestId = req.query.requestId as string;
    if (queryRequestId) {
      return queryRequestId;
    }

    // 生成新的请求ID
    return uuidv4();
  }

  /**
   * @private extractClientIp
   * @description 提取客户端IP
   * @param {Request} req Express请求对象
   * @returns {string} 客户端IP
   */
  private extractClientIp(req: Request): string {
    // 检查各种可能的IP头
    const ipHeaders = [
      'X-Forwarded-For',
      'X-Real-IP',
      'X-Client-IP',
      'CF-Connecting-IP', // Cloudflare
      'X-Forwarded',
      'Forwarded-For',
      'Forwarded',
    ];

    for (const header of ipHeaders) {
      const ip = req.get(header);
      if (ip) {
        // 如果是逗号分隔的多个IP，取第一个
        return ip.split(',')[0].trim();
      }
    }

    // 回退到连接IP
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * @private extractTenantId
   * @description 提取租户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 租户ID
   */
  private extractTenantId(req: Request): string | undefined {
    // 从请求头获取
    const headerTenantId = req.get('X-Tenant-ID');
    if (headerTenantId) {
      return headerTenantId;
    }

    // 从查询参数获取
    const queryTenantId = req.query.tenantId as string;
    if (queryTenantId) {
      return queryTenantId;
    }

    // 从路径参数获取
    const pathTenantId = req.params.tenantId;
    if (pathTenantId) {
      return pathTenantId;
    }

    // 从JWT令牌中提取（如果有的话）
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // 这里可以解析JWT令牌获取租户信息
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // return decoded.tenantId;
      } catch (error) {
        // 令牌解析失败，忽略
      }
    }

    return undefined;
  }

  /**
   * @private extractUserId
   * @description 提取用户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 用户ID
   */
  private extractUserId(req: Request): string | undefined {
    // 从请求头获取
    const headerUserId = req.get('X-User-ID');
    if (headerUserId) {
      return headerUserId;
    }

    // 从查询参数获取
    const queryUserId = req.query.userId as string;
    if (queryUserId) {
      return queryUserId;
    }

    // 从JWT令牌中提取（如果有的话）
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // 这里可以解析JWT令牌获取用户信息
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // return decoded.userId;
      } catch (error) {
        // 令牌解析失败，忽略
      }
    }

    return undefined;
  }

  /**
   * @private extractSessionId
   * @description 提取会话ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 会话ID
   */
  private extractSessionId(req: Request): string | undefined {
    // 从Cookie获取
    const sessionCookie = req.cookies?.sessionId || req.cookies?.sid;
    if (sessionCookie) {
      return sessionCookie;
    }

    // 从请求头获取
    const headerSessionId = req.get('X-Session-ID');
    if (headerSessionId) {
      return headerSessionId;
    }

    return undefined;
  }

  /**
   * @private extractAuthToken
   * @description 提取认证令牌
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 认证令牌
   */
  private extractAuthToken(req: Request): string | undefined {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  /**
   * @private sanitizeHeaders
   * @description 清理请求头，移除敏感信息
   * @param {Record<string, any>} headers 请求头
   * @returns {Record<string, string>} 清理后的请求头
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-password',
    ];

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
   * @private sanitizeBody
   * @description 清理请求体，移除敏感信息
   * @param {any} body 请求体
   * @returns {any} 清理后的请求体
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'authToken',
      'auth_token',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * @private handleResponseFinish
   * @description 处理响应完成事件
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   */
  private handleResponseFinish(req: Request, res: Response): void {
    try {
      const responseTime = Date.now() - this.contextService.getRequestContext().startTime;

      this.contextService.setRequestContext({
        statusCode: res.statusCode,
        responseTime,
      });

      // 这里可以添加响应日志记录
      // this.logger.info('Request completed', {
      //   requestId: this.contextService.getRequestId(),
      //   method: req.method,
      //   url: req.url,
      //   statusCode: res.statusCode,
      //   responseTime,
      // });
    } catch (error) {
      console.error('Error handling response finish:', error);
    }
  }

  /**
   * @private handleResponseError
   * @description 处理响应错误事件
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   * @param {Error} error 错误对象
   */
  private handleResponseError(req: Request, res: Response, error: Error): void {
    try {
      this.contextService.setError(error);

      // 这里可以添加错误日志记录
      // this.logger.error('Request error', {
      //   requestId: this.contextService.getRequestId(),
      //   method: req.method,
      //   url: req.url,
      //   error: error.message,
      //   stack: error.stack,
      // });
    } catch (logError) {
      console.error('Error handling response error:', logError);
    }
  }
}
