import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventProjectionService, EventProjectionConfig, ProjectionRequest, ProjectionHandler, ProjectionQuery } from './event-projection.service';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { EventType } from '../stores/postgres-event-store';

describe('EventProjectionService', () => {
  let service: EventProjectionService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;

  const mockConfig: EventProjectionConfig = {
    enabled: true,
    batchSize: 1000,
    concurrency: 5,
    timeout: 300000,
    retries: 3,
    retryDelay: 1000,
    enableProjectionCache: true,
    projectionCacheTtl: 3600,
    enableProjectionValidation: true,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 60000,
    maxProjectionEvents: 100000,
    progressReportInterval: 1000,
    enableRealTimeProjection: false,
    realTimeProjectionDelay: 1000,
  };

  const mockProjectionHandler: ProjectionHandler = {
    projectionName: 'test-projection',
    projectionType: 'test-type',
    supportedAggregateTypes: ['User', 'Tenant'],
    supportedEventTypes: [EventType.USER_CREATED, EventType.TENANT_CREATED],
    initializeProjection: jest.fn().mockReturnValue({}),
    handleEvent: jest.fn().mockImplementation((state, event) => ({ ...state, [event.eventId]: event })),
    validateProjection: jest.fn().mockReturnValue(true),
    serializeProjection: jest.fn().mockImplementation((state) => JSON.stringify(state)),
    deserializeProjection: jest.fn().mockImplementation((data) => JSON.parse(data)),
    getProjectionQuery: jest.fn().mockReturnValue({ data: 'test-query-result' }),
  };

  beforeEach(async () => {
    mockEventEmitter = { emit: jest.fn() } as any;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventProjectionService,
        { provide: 'EVENT_PROJECTION_CONFIG', useValue: mockConfig },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PinoLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EventProjectionService>(EventProjectionService);
  });

  afterEach(() => {
    if (service && typeof service.onDestroy === 'function') {
      service.onDestroy();
    }
  });

  describe('basic operations', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config', () => {
      expect(service).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('EventProjectionService initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalProjections).toBe(0);
      expect(stats.activeProjections).toBe(0);
      expect(stats.registeredHandlers).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Event projection stats reset', expect.any(String));
    });
  });

  describe('projection handler registration', () => {
    it('should register projection handler', () => {
      service.registerProjectionHandler(mockProjectionHandler);

      const stats = service.getStats();
      expect(stats.registeredHandlers).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Projection handler registered: test-type:test-projection',
        expect.any(String)
      );
    });

    it('should unregister projection handler', () => {
      service.registerProjectionHandler(mockProjectionHandler);
      service.unregisterProjectionHandler('test-type', 'test-projection');

      const stats = service.getStats();
      expect(stats.registeredHandlers).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Projection handler unregistered: test-type:test-projection',
        expect.any(String)
      );
    });
  });

  describe('projection operations', () => {
    beforeEach(() => {
      service.registerProjectionHandler(mockProjectionHandler);
    });

    it('should project events successfully', async () => {
      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: {
          useCache: false,
        },
      };

      const result = await service.projectEvents(request);

      expect(result).toBeDefined();
      expect(result.projectionId).toBeDefined();
      expect(result.projectionName).toBe('test-projection');
      expect(result.projectionType).toBe('test-type');
      expect(result.status).toBe('completed');
      expect(result.eventsProcessed).toBe(0);
      expect(result.projectionData).toBeDefined();
    });

    it('should handle disabled projection', async () => {
      const disabledService = new EventProjectionService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
      };

      const result = await disabledService.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Event projection is disabled');
    });

    it('should handle invalid request', async () => {
      const request: ProjectionRequest = {
        projectionName: '',
        projectionType: 'test-type',
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Projection name is required');
    });

    it('should handle unregistered projection type', async () => {
      const request: ProjectionRequest = {
        projectionName: 'unknown-projection',
        projectionType: 'unknown-type',
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No projection handler registered for: unknown-type:unknown-projection');
    });

    it('should query projection', async () => {
      const query: ProjectionQuery = {
        queryType: 'test-query',
        parameters: { test: 'value' },
      };

      const result = await service.queryProjection('test-type', 'test-projection', query);

      expect(result).toBeDefined();
      expect(result.data).toBe('test-query-result');
      expect(mockProjectionHandler.getProjectionQuery).toHaveBeenCalled();
    });
  });

  describe('projection management', () => {
    beforeEach(() => {
      service.registerProjectionHandler(mockProjectionHandler);
    });

    it('should get projection status', async () => {
      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: { useCache: false },
      };

      const result = await service.projectEvents(request);
      const status = service.getProjectionStatus(result.projectionId);

      // 投影完成后，状态应该为null（已从活跃投影中移除）
      expect(status).toBeNull();
    });

    it('should cancel projection', async () => {
      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: { useCache: false },
      };

      const result = await service.projectEvents(request);

      // 投影完成后，取消应该返回false
      const cancelled = service.cancelProjection(result.projectionId);
      expect(cancelled).toBe(false);
    });

    it('should get active projections', () => {
      const activeProjections = service.getActiveProjections();
      expect(Array.isArray(activeProjections)).toBe(true);
      expect(activeProjections.length).toBe(0);
    });
  });

  describe('projection options', () => {
    beforeEach(() => {
      service.registerProjectionHandler(mockProjectionHandler);
    });

    it('should handle progress callback', async () => {
      const progressCallback = jest.fn();
      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: {
          useCache: false,
          onProgress: progressCallback,
        },
      };

      await service.projectEvents(request);

      // 由于没有事件，进度回调不会被调用
      expect(progressCallback).not.toHaveBeenCalled();
    });

    it('should handle error strategy stop', async () => {
      const failingHandler: ProjectionHandler = {
        ...mockProjectionHandler,
        initializeProjection: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      service.unregisterProjectionHandler('test-type', 'test-projection');
      service.registerProjectionHandler(failingHandler);

      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: {
          useCache: false,
          errorStrategy: 'stop',
        },
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Test error');
    });

    it('should handle error strategy retry', async () => {
      let callCount = 0;
      const retryHandler: ProjectionHandler = {
        ...mockProjectionHandler,
        initializeProjection: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            throw new Error('Test error');
          }
          return {};
        }),
      };

      service.unregisterProjectionHandler('test-type', 'test-projection');
      service.registerProjectionHandler(retryHandler);

      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: {
          useCache: false,
          errorStrategy: 'retry',
        },
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Test error');
      expect(callCount).toBe(1);
    });
  });

  describe('projection cache', () => {
    beforeEach(() => {
      service.registerProjectionHandler(mockProjectionHandler);
    });

    it('should clear projection cache', () => {
      service.clearProjectionCache();
      expect(mockLogger.info).toHaveBeenCalledWith('All projection cache cleared', expect.any(String));
    });

    it('should clear specific projection cache', () => {
      service.clearProjectionCache('test-type', 'test-projection');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Projection cache cleared: test-type:test-projection',
        expect.any(String)
      );
    });
  });

  describe('health check', () => {
    it('should return healthy status when enabled and healthy', async () => {
      service.registerProjectionHandler(mockProjectionHandler);

      const health = await service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.details.enabled).toBe(true);
      expect(health.details.registeredHandlers).toBe(1);
    });

    it('should return disabled status when disabled', async () => {
      const disabledService = new EventProjectionService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const health = await disabledService.getHealth();

      expect(health.status).toBe('disabled');
      expect(health.details.enabled).toBe(false);
    });

    it('should return unhealthy when too many active projections', async () => {
      service.registerProjectionHandler(mockProjectionHandler);

      // 模拟大量活跃投影
      const mockActiveProjections = new Map();
      for (let i = 0; i < 150; i++) {
        mockActiveProjections.set(`projection-${i}`, { status: 'running' });
      }

      // 使用私有属性模拟大量活跃投影
      (service as any).activeProjections = mockActiveProjections;

      const health = await service.getHealth();

      expect(health.status).toBe('unhealthy');
    });

    it('should return unhealthy when no registered handlers', async () => {
      const health = await service.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.details.registeredHandlers).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultService = new EventProjectionService(
        {},
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig: EventProjectionConfig = {
        enabled: false,
        batchSize: 500,
        concurrency: 3,
        timeout: 600000,
        retries: 5,
        retryDelay: 2000,
        enableProjectionCache: false,
        projectionCacheTtl: 1800,
        enableProjectionValidation: false,
        enableStats: false,
        enableEvents: false,
        monitoringInterval: 120000,
        maxProjectionEvents: 50000,
        progressReportInterval: 500,
        enableRealTimeProjection: true,
        realTimeProjectionDelay: 500,
      };

      const customService = new EventProjectionService(
        customConfig,
        mockEventEmitter,
        mockLogger
      );

      expect(customService).toBeDefined();
    });
  });

  describe('monitoring', () => {
    it('should start monitoring on initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started event projection monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Stopped event projection monitoring',
        expect.any(String)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'EventProjectionService destroyed',
        expect.any(String)
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      service.registerProjectionHandler(mockProjectionHandler);
    });

    it('should handle projection failures gracefully', async () => {
      const failingHandler: ProjectionHandler = {
        ...mockProjectionHandler,
        initializeProjection: jest.fn().mockImplementation(() => {
          throw new Error('Initialization failed');
        }),
      };

      service.unregisterProjectionHandler('test-type', 'test-projection');
      service.registerProjectionHandler(failingHandler);

      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: { useCache: false },
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Initialization failed');
    });

    it('should handle validation errors', async () => {
      const invalidHandler: ProjectionHandler = {
        ...mockProjectionHandler,
        validateProjection: jest.fn().mockReturnValue(false),
      };

      service.unregisterProjectionHandler('test-type', 'test-projection');
      service.registerProjectionHandler(invalidHandler);

      const request: ProjectionRequest = {
        projectionName: 'test-projection',
        projectionType: 'test-type',
        options: { useCache: false },
      };

      const result = await service.projectEvents(request);

      expect(result.status).toBe('completed');
    });

    it('should handle query errors gracefully', async () => {
      const queryErrorHandler: ProjectionHandler = {
        ...mockProjectionHandler,
        getProjectionQuery: jest.fn().mockImplementation(() => {
          throw new Error('Query failed');
        }),
      };

      service.unregisterProjectionHandler('test-type', 'test-projection');
      service.registerProjectionHandler(queryErrorHandler);

      const query: ProjectionQuery = {
        queryType: 'test-query',
        parameters: { test: 'value' },
      };

      await expect(
        service.queryProjection('test-type', 'test-projection', query)
      ).rejects.toThrow('Query failed');
    });
  });
});
