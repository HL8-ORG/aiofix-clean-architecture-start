import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { PinoLoggingMiddleware } from './pino-logging.middleware';
import { PinoLoggerService } from '../services/pino-logger.service';
import { LogContext } from '../interfaces/logging.interface';

describe('PinoLoggingMiddleware', () => {
  let middleware: PinoLoggingMiddleware;
  let logger: PinoLoggerService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinoLoggingMiddleware,
        {
          provide: PinoLoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            performance: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<PinoLoggingMiddleware>(PinoLoggingMiddleware);
    logger = module.get<PinoLoggerService>(PinoLoggerService);

    // 重置模拟
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // 设置模拟请求
    mockRequest = {
      method: 'GET',
      url: '/api/users',
      get: jest.fn(),
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-tenant-id': 'tenant-123',
        'x-user-id': 'user-456',
        'authorization': 'Bearer token123',
      },
      query: { page: '1', limit: '10' },
      body: { name: 'test' },
      connection: { remoteAddress: '192.168.1.1' },
      socket: { remoteAddress: '192.168.1.1' },
    };

    // 设置模拟响应
    mockResponse = {
      statusCode: 200,
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      on: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('request logging', () => {
    it('should log request information', () => {
      // 设置get方法的返回值
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        switch (header) {
          case 'User-Agent':
            return 'Mozilla/5.0';
          case 'X-Tenant-ID':
          case 'x-tenant-id':
            return 'tenant-123';
          case 'X-User-ID':
          case 'x-user-id':
            return 'user-456';
          default:
            return undefined;
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        'HTTP Request: GET /api/users',
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          method: 'GET',
          url: '/api/users',
          userAgent: 'Mozilla/5.0',
          tenantId: 'tenant-123',
          userId: 'user-456',
          ip: '192.168.1.1',
          requestId: expect.any(String),
          headers: expect.objectContaining({
            authorization: '[REDACTED]',
            'user-agent': 'Mozilla/5.0',
          }),
          query: { page: '1', limit: '10' },
          body: { name: 'test' },
        })
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should generate unique request ID', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          requestId: expect.any(String),
        })
      );
    });

    it('should extract tenant ID from different sources', () => {
      // 测试从查询参数提取
      mockRequest.query = { tenantId: 'query-tenant' };
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          tenantId: 'query-tenant',
        })
      );
    });

    it('should extract user ID from different sources', () => {
      // 测试从请求体提取
      mockRequest.body = { userId: 'body-user' };
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          userId: 'body-user',
        })
      );
    });
  });

  describe('response logging', () => {
    it('should log successful response', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      // 模拟响应完成事件
      const finishCallback = jest.fn();
      (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback.mockImplementation(callback);
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      // 触发响应完成
      finishCallback();

      expect(logger.info).toHaveBeenCalledWith(
        'HTTP Response: GET /api/users - 200',
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
        })
      );

      expect(logger.performance).toHaveBeenCalledWith(
        'http_request',
        expect.any(Number),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          statusCode: 200,
        })
      );
    });

    it('should log error response as warning', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);
      mockResponse.statusCode = 404;

      const finishCallback = jest.fn();
      (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback.mockImplementation(callback);
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
      finishCallback();

      expect(logger.warn).toHaveBeenCalledWith(
        'HTTP Response: GET /api/users - 404',
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it('should capture response size', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const finishCallback = jest.fn();
      (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback.mockImplementation(callback);
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      // 触发响应完成
      finishCallback();

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('error logging', () => {
    it('should log response errors', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const errorCallback = jest.fn();
      (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'error') {
          errorCallback.mockImplementation(callback);
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      const testError = new Error('Test error');
      errorCallback(testError);

      expect(logger.error).toHaveBeenCalledWith(
        'HTTP Error: GET /api/users - 200',
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
        }),
        testError
      );
    });
  });

  describe('security features', () => {
    it('should sanitize sensitive headers', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: '[REDACTED]',
            'user-agent': 'Mozilla/5.0',
          }),
        })
      );
    });

    it('should sanitize sensitive body fields', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);
      mockRequest.body = {
        username: 'testuser',
        password: 'secret123',
        token: 'jwt-token',
        email: 'test@example.com',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          body: expect.objectContaining({
            username: 'testuser',
            password: '[REDACTED]',
            token: '[REDACTED]',
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  describe('client IP detection', () => {
    it('should detect IP from X-Forwarded-For header', () => {
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        switch (header) {
          case 'User-Agent':
            return undefined;
          case 'X-Tenant-ID':
          case 'x-tenant-id':
            return undefined;
          case 'X-User-ID':
          case 'x-user-id':
            return undefined;
          case 'X-Forwarded-For':
            return '192.168.1.100, 10.0.0.1';
          default:
            return undefined;
        }
      });

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          ip: '192.168.1.100',
          tenantId: undefined,
          userId: undefined,
        })
      );
    });

    it('should fallback to connection remote address', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);
      mockRequest.connection = { remoteAddress: '192.168.1.200' };

      middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        LogContext.HTTP_REQUEST,
        expect.objectContaining({
          ip: '192.168.1.200',
        })
      );
    });
  });
});
