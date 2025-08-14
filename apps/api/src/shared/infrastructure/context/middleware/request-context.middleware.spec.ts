/**
 * @file request-context.middleware.spec.ts
 * @description 请求上下文中间件单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from '../services/request-context.service';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;
  let contextService: RequestContextService;

  const mockContextService = {
    setRequestContext: jest.fn(),
    setSecurityContext: jest.fn(),
    setPerformanceContext: jest.fn(),
    getRequestContext: jest.fn(),
    setRequestContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestContextMiddleware,
        {
          provide: RequestContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    middleware = module.get<RequestContextMiddleware>(RequestContextMiddleware);
    contextService = module.get<RequestContextService>(RequestContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        url: '/test',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-request-id': 'test-request-id',
          'x-tenant-id': 'test-tenant',
          'x-user-id': 'test-user',
        },
        params: {},
        query: {},
        body: {},
        ip: '192.168.1.1',
        get: jest.fn((header: string) => mockRequest.headers?.[header.toLowerCase()]),
      };

      mockResponse = {
        setHeader: jest.fn(),
        on: jest.fn(),
        statusCode: 200,
      };

      mockNext = jest.fn();
    });

    it('should initialize request context', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(contextService.setRequestContext).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
          tenantId: 'test-tenant',
          userId: 'test-user',
          method: 'GET',
          url: '/test',
          clientIp: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should initialize security context', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(contextService.setSecurityContext).toHaveBeenCalledWith(
        expect.objectContaining({
          authenticated: false,
        })
      );
    });

    it('should initialize performance context', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(contextService.setPerformanceContext).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
        })
      );
    });

    it('should set response headers', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'test-request-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Tenant-ID', 'test-tenant');
    });

    it('should handle authentication token', () => {
      mockRequest.headers = {
        ...mockRequest.headers,
        authorization: 'Bearer test-token',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(contextService.setSecurityContext).toHaveBeenCalledWith(
        expect.objectContaining({
          authenticated: true,
          authToken: 'test-token',
        })
      );
    });

    it('should generate request ID if not provided', () => {
      delete mockRequest.headers!['x-request-id'];

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(contextService.setRequestContext).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.any(String),
        })
      );
    });

    it('should call next function', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const error = new Error('Test error');
      jest.spyOn(contextService, 'setRequestContext').mockImplementation(() => {
        throw error;
      });

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
