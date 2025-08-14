import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../services/pino-logger.service';
import { LogContext } from '../interfaces/logging.interface';

/**
 * @interface RequestLogData
 * @description 请求日志数据结构
 */
interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  tenantId?: string;
  userId?: string;
  startTime: number;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
}

/**
 * @interface ResponseLogData
 * @description 响应日志数据结构
 */
interface ResponseLogData extends RequestLogData {
  statusCode: number;
  duration: number;
  responseSize?: number;
  error?: Error;
}

/**
 * @class PinoLoggingMiddleware
 * @description
 * Pino日志中间件，负责记录HTTP请求和响应的详细日志。
 * 
 * 主要功能包括：
 * 1. 为每个请求生成唯一ID
 * 2. 记录请求开始和结束时间
 * 3. 记录请求和响应的详细信息
 * 4. 计算请求处理时间
 * 5. 记录错误信息
 * 6. 支持租户和用户追踪
 * 
 * 设计原则：
 * - 高性能：最小化对请求处理的影响
 *  - 结构化：提供结构化的日志数据
 * - 可配置：支持不同级别的日志记录
 * - 安全性：敏感信息过滤
 */
@Injectable()
export class PinoLoggingMiddleware implements NestMiddleware {
  private readonly sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  private readonly sensitiveFields = ['password', 'token', 'secret'];

  constructor(private readonly logger: PinoLoggerService) { }

  /**
   * @method use
   * @description 中间件主方法
   * @param {Request} req Express请求对象
   * @param {Response} res Express响应对象
   * @param {NextFunction} next 下一个中间件函数
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const tenantId = this.extractTenantId(req);
    const userId = this.extractUserId(req);

    // 创建请求日志数据
    const requestLogData: RequestLogData = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIp(req),
      tenantId,
      userId,
      startTime,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
    };

    // 记录请求开始日志
    this.logRequest(requestLogData);

    // 重写响应方法以捕获响应数据
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody: any = null;
    let responseSize = 0;

    // 拦截send方法
    res.send = function (data: any): Response {
      responseBody = data;
      responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      return originalSend.call(this, data);
    };

    // 拦截json方法
    res.json = function (data: any): Response {
      responseBody = data;
      responseSize = JSON.stringify(data).length;
      return originalJson.call(this, data);
    };

    // 拦截end方法
    res.end = function (data?: any): Response {
      if (data && !responseBody) {
        responseBody = data;
        responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      }
      return originalEnd.call(this, data);
    };

    // 监听响应完成事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const responseLogData: ResponseLogData = {
        ...requestLogData,
        statusCode: res.statusCode,
        duration,
        responseSize,
      };

      this.logResponse(responseLogData);
    });

    // 监听错误事件
    res.on('error', (error: Error) => {
      const duration = Date.now() - startTime;
      const responseLogData: ResponseLogData = {
        ...requestLogData,
        statusCode: res.statusCode || 500,
        duration,
        error,
      };

      this.logError(responseLogData);
    });

    next();
  }

  /**
   * @private
   * @method generateRequestId
   * @description 生成请求ID
   * @returns {string} 请求ID
   */
  private generateRequestId(): string {
    return uuidv4();
  }

  /**
   * @private
   * @method extractTenantId
   * @description 从请求中提取租户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 租户ID
   */
  private extractTenantId(req: Request): string | undefined {
    // 从请求头中提取
    const headerTenantId = req.get('X-Tenant-ID') || req.get('x-tenant-id');
    if (headerTenantId) return headerTenantId;

    // 从查询参数中提取
    const queryTenantId = req.query.tenantId || req.query.tenant_id;
    if (queryTenantId) return String(queryTenantId);

    // 从请求体中提取
    const bodyTenantId = req.body?.tenantId || req.body?.tenant_id;
    if (bodyTenantId) return String(bodyTenantId);

    return undefined;
  }

  /**
   * @private
   * @method extractUserId
   * @description 从请求中提取用户ID
   * @param {Request} req Express请求对象
   * @returns {string | undefined} 用户ID
   */
  private extractUserId(req: Request): string | undefined {
    // 从请求头中提取
    const headerUserId = req.get('X-User-ID') || req.get('x-user-id');
    if (headerUserId) return headerUserId;

    // 从查询参数中提取
    const queryUserId = req.query.userId || req.query.user_id;
    if (queryUserId) return String(queryUserId);

    // 从请求体中提取
    const bodyUserId = req.body?.userId || req.body?.user_id;
    if (bodyUserId) return String(bodyUserId);

    return undefined;
  }

  /**
   * @private
   * @method getClientIp
   * @description 获取客户端IP地址
   * @param {Request} req Express请求对象
   * @returns {string} 客户端IP地址
   */
  private getClientIp(req: Request): string {
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
   * @method sanitizeHeaders
   * @description 清理请求头，移除敏感信息
   * @param {Record<string, any>} headers 请求头
   * @returns {Record<string, string>} 清理后的请求头
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (this.sensitiveHeaders.includes(key.toLowerCase())) {
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

    const sanitized = { ...body };

    for (const field of this.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * @private
   * @method logRequest
   * @description 记录请求日志
   * @param {RequestLogData} data 请求日志数据
   */
  private logRequest(data: RequestLogData): void {
    this.logger.info(
      `HTTP Request: ${data.method} ${data.url}`,
      LogContext.HTTP_REQUEST,
      {
        requestId: data.requestId,
        method: data.method,
        url: data.url,
        userAgent: data.userAgent,
        ip: data.ip,
        tenantId: data.tenantId,
        userId: data.userId,
        headers: data.headers,
        query: data.query,
        body: data.body,
      }
    );
  }

  /**
   * @private
   * @method logResponse
   * @description 记录响应日志
   * @param {ResponseLogData} data 响应日志数据
   */
  private logResponse(data: ResponseLogData): void {
    const logLevel = data.statusCode >= 400 ? 'warn' : 'info';
    const message = `HTTP Response: ${data.method} ${data.url} - ${data.statusCode}`;

    // 记录响应日志
    this.logger[logLevel](
      message,
      LogContext.HTTP_REQUEST,
      {
        requestId: data.requestId,
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        responseSize: data.responseSize,
        tenantId: data.tenantId,
        userId: data.userId,
      }
    );

    // 记录性能日志
    this.logger.performance(
      'http_request',
      data.duration,
      LogContext.HTTP_REQUEST,
      {
        requestId: data.requestId,
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        tenantId: data.tenantId,
        userId: data.userId,
      }
    );
  }

  /**
   * @private
   * @method logError
   * @description 记录错误日志
   * @param {ResponseLogData} data 错误日志数据
   */
  private logError(data: ResponseLogData): void {
    this.logger.error(
      `HTTP Error: ${data.method} ${data.url} - ${data.statusCode}`,
      LogContext.HTTP_REQUEST,
      {
        requestId: data.requestId,
        method: data.method,
        url: data.url,
        statusCode: data.statusCode,
        duration: data.duration,
        tenantId: data.tenantId,
        userId: data.userId,
      },
      data.error
    );
  }
}
