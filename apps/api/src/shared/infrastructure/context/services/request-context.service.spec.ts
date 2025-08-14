import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { RequestContextService } from './request-context.service';
import { RequestContext, TenantContext, UserContext } from '../interfaces/request-context.interface';

describe('RequestContextService', () => {
  let service: RequestContextService;
  let clsService: ClsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestContextService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            has: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestContextService>(RequestContextService);
    clsService = module.get<ClsService>(ClsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRequestContext', () => {
    it('should return existing request context', () => {
      const mockContext: RequestContext = {
        requestId: 'test-request-id',
        startTime: Date.now(),
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockContext);

      const result = service.getRequestContext();

      expect(result).toEqual(mockContext);
      expect(clsService.get).toHaveBeenCalledWith('request');
    });

    it('should create default context if none exists', () => {
      jest.spyOn(clsService, 'get').mockReturnValue(undefined);
      jest.spyOn(clsService, 'set').mockImplementation(() => { });

      const result = service.getRequestContext();

      expect(result.requestId).toBeDefined();
      expect(result.startTime).toBeDefined();
      expect(clsService.set).toHaveBeenCalledWith('request', expect.any(Object));
    });
  });

  describe('getTenantContext', () => {
    it('should return tenant context', () => {
      const mockTenantContext: TenantContext = {
        tenantId: 'test-tenant',
        tenantCode: 'TEST',
        tenantName: 'Test Tenant',
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockTenantContext);

      const result = service.getTenantContext();

      expect(result).toEqual(mockTenantContext);
      expect(clsService.get).toHaveBeenCalledWith('tenant');
    });

    it('should return null if no tenant context exists', () => {
      jest.spyOn(clsService, 'get').mockReturnValue(undefined);

      const result = service.getTenantContext();

      expect(result).toBeNull();
    });
  });

  describe('getUserContext', () => {
    it('should return user context', () => {
      const mockUserContext: UserContext = {
        userId: 'test-user',
        username: 'testuser',
        email: 'test@example.com',
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockUserContext);

      const result = service.getUserContext();

      expect(result).toEqual(mockUserContext);
      expect(clsService.get).toHaveBeenCalledWith('user');
    });

    it('should return null if no user context exists', () => {
      jest.spyOn(clsService, 'get').mockReturnValue(undefined);

      const result = service.getUserContext();

      expect(result).toBeNull();
    });
  });

  describe('setRequestContext', () => {
    it('should update request context', () => {
      const existingContext: RequestContext = {
        requestId: 'existing-id',
        startTime: Date.now(),
      };

      const updateContext: Partial<RequestContext> = {
        tenantId: 'new-tenant',
        userId: 'new-user',
      };

      jest.spyOn(clsService, 'get').mockReturnValue(existingContext);
      jest.spyOn(clsService, 'set').mockImplementation(() => { });

      service.setRequestContext(updateContext);

      expect(clsService.set).toHaveBeenCalledWith('request', {
        ...existingContext,
        ...updateContext,
      });
    });
  });

  describe('setTenantContext', () => {
    it('should set tenant context and update request context', () => {
      const tenantContext: TenantContext = {
        tenantId: 'test-tenant',
        tenantCode: 'TEST',
        tenantName: 'Test Tenant',
      };

      jest.spyOn(clsService, 'set').mockImplementation(() => { });

      service.setTenantContext(tenantContext);

      expect(clsService.set).toHaveBeenCalledWith('tenant', tenantContext);
      expect(clsService.set).toHaveBeenCalledWith('request', expect.objectContaining({
        tenantId: 'test-tenant',
      }));
    });
  });

  describe('setUserContext', () => {
    it('should set user context and update request context', () => {
      const userContext: UserContext = {
        userId: 'test-user',
        username: 'testuser',
        email: 'test@example.com',
      };

      jest.spyOn(clsService, 'set').mockImplementation(() => { });

      service.setUserContext(userContext);

      expect(clsService.set).toHaveBeenCalledWith('user', userContext);
      expect(clsService.set).toHaveBeenCalledWith('request', expect.objectContaining({
        userId: 'test-user',
      }));
    });
  });

  describe('clear', () => {
    it('should clear all context keys', () => {
      jest.spyOn(clsService, 'delete').mockImplementation(() => { });

      service.clear();

      expect(clsService.delete).toHaveBeenCalledWith('request');
      expect(clsService.delete).toHaveBeenCalledWith('tenant');
      expect(clsService.delete).toHaveBeenCalledWith('user');
      expect(clsService.delete).toHaveBeenCalledWith('security');
      expect(clsService.delete).toHaveBeenCalledWith('performance');
      expect(clsService.delete).toHaveBeenCalledWith('audit');
    });
  });

  describe('isInitialized', () => {
    it('should return true if context is initialized', () => {
      jest.spyOn(clsService, 'has').mockReturnValue(true);

      const result = service.isInitialized();

      expect(result).toBe(true);
      expect(clsService.has).toHaveBeenCalledWith('request');
    });

    it('should return false if context is not initialized', () => {
      jest.spyOn(clsService, 'has').mockReturnValue(false);

      const result = service.isInitialized();

      expect(result).toBe(false);
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      const mockContext: RequestContext = {
        requestId: 'test-request-id',
        tenantId: 'test-tenant',
        userId: 'test-user',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        startTime: Date.now(),
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockContext);
    });

    it('should get request ID', () => {
      const result = service.getRequestId();
      expect(result).toBe('test-request-id');
    });

    it('should get tenant ID', () => {
      const result = service.getTenantId();
      expect(result).toBe('test-tenant');
    });

    it('should get user ID', () => {
      const result = service.getUserId();
      expect(result).toBe('test-user');
    });

    it('should get client IP', () => {
      const result = service.getClientIp();
      expect(result).toBe('192.168.1.1');
    });

    it('should get user agent', () => {
      const result = service.getUserAgent();
      expect(result).toBe('Mozilla/5.0');
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      const mockPerformanceContext = {
        startTime: Date.now(),
        dbQueries: 0,
        dbQueryTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        externalApiCalls: 0,
        externalApiTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockPerformanceContext);
      jest.spyOn(clsService, 'set').mockImplementation(() => { });
    });

    it('should increment database queries', () => {
      service.incrementDbQueries(100);

      expect(clsService.set).toHaveBeenCalledWith('performance', expect.objectContaining({
        dbQueries: 1,
        dbQueryTime: 100,
      }));
    });

    it('should increment cache hits', () => {
      service.incrementCacheHits();

      expect(clsService.set).toHaveBeenCalledWith('performance', expect.objectContaining({
        cacheHits: 1,
      }));
    });

    it('should increment cache misses', () => {
      service.incrementCacheMisses();

      expect(clsService.set).toHaveBeenCalledWith('performance', expect.objectContaining({
        cacheMisses: 1,
      }));
    });

    it('should increment external API calls', () => {
      service.incrementExternalApiCalls(200);

      expect(clsService.set).toHaveBeenCalledWith('performance', expect.objectContaining({
        externalApiCalls: 1,
        externalApiTime: 200,
      }));
    });
  });

  describe('metadata management', () => {
    beforeEach(() => {
      const mockContext: RequestContext = {
        requestId: 'test-request-id',
        startTime: Date.now(),
        metadata: {},
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockContext);
      jest.spyOn(clsService, 'set').mockImplementation(() => { });
    });

    it('should set metadata', () => {
      service.setMetadata('testKey', 'testValue');

      expect(clsService.set).toHaveBeenCalledWith('request', expect.objectContaining({
        metadata: { testKey: 'testValue' },
      }));
    });

    it('should get metadata', () => {
      const mockContext: RequestContext = {
        requestId: 'test-request-id',
        startTime: Date.now(),
        metadata: { testKey: 'testValue' },
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockContext);

      const result = service.getMetadata('testKey');
      expect(result).toBe('testValue');
    });

    it('should get all metadata', () => {
      const mockContext: RequestContext = {
        requestId: 'test-request-id',
        startTime: Date.now(),
        metadata: { key1: 'value1', key2: 'value2' },
      };

      jest.spyOn(clsService, 'get').mockReturnValue(mockContext);

      const result = service.getAllMetadata();
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });
});
