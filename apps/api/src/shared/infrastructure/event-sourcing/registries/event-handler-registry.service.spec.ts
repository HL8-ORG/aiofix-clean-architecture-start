import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventHandlerRegistryService, EventHandlerRegistryConfig, EventHandler, EventHandlerContext, EventHandlerResult } from './event-handler-registry.service';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { EventType, EventStatus } from '../stores/postgres-event-store';

describe('EventHandlerRegistryService', () => {
  let service: EventHandlerRegistryService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;

  const mockConfig: EventHandlerRegistryConfig = {
    enabled: true,
    enableAsync: true,
    enableConcurrency: true,
    maxConcurrency: 10,
    handlerTimeout: 30000,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
    enableRetry: true,
    retries: 3,
    retryDelay: 1000,
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 5,
    circuitBreakerWindow: 60000,
  };

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventHandlerRegistryService,
        {
          provide: 'EVENT_HANDLER_REGISTRY_CONFIG',
          useValue: mockConfig,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: PinoLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EventHandlerRegistryService>(EventHandlerRegistryService);
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
      expect(mockLogger.info).toHaveBeenCalledWith('EventHandlerRegistryService initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalHandlers).toBe(0);
      expect(stats.enabledHandlers).toBe(0);
      expect(stats.totalExecutions).toBe(0);
      expect(stats.successfulExecutions).toBe(0);
      expect(stats.failedExecutions).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Event handler registry stats reset', expect.any(String));
    });
  });

  describe('handler registration', () => {
    it('should register handler successfully', async () => {
      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        description: 'Test handler for unit testing',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn().mockResolvedValue({
          success: true,
          data: { processed: true },
          executionTime: 100,
        }),
      };

      const success = await service.registerHandler(handler);

      expect(success).toBe(true);
      expect(service.getStats().totalHandlers).toBe(1);
      expect(service.getStats().enabledHandlers).toBe(1);
    });

    it('should handle disabled registry', async () => {
      const disabledService = new EventHandlerRegistryService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      const success = await disabledService.registerHandler(handler);

      expect(success).toBe(false);
    });

    it('should unregister handler successfully', async () => {
      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      await service.registerHandler(handler);
      expect(service.getStats().totalHandlers).toBe(1);

      const handlers = service.getHandlers();
      const handlerId = handlers[0].handlerId;

      const success = await service.unregisterHandler(handlerId);

      expect(success).toBe(true);
      expect(service.getStats().totalHandlers).toBe(0);
    });

    it('should get handlers by event type', async () => {
      const handler1: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Handler 1',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      const handler2: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Handler 2',
        supportedEventTypes: [EventType.USER_CREATED, EventType.USER_UPDATED],
        priority: 2,
        enabled: true,
        handle: jest.fn(),
      };

      await service.registerHandler(handler1);
      await service.registerHandler(handler2);

      const userCreatedHandlers = service.getHandlers(EventType.USER_CREATED);
      expect(userCreatedHandlers).toHaveLength(2);

      const userUpdatedHandlers = service.getHandlers(EventType.USER_UPDATED);
      expect(userUpdatedHandlers).toHaveLength(1);

      const allHandlers = service.getHandlers();
      expect(allHandlers).toHaveLength(2);
    });

    it('should sort handlers by priority', async () => {
      const handler1: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Low Priority Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      const handler2: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'High Priority Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 10,
        enabled: true,
        handle: jest.fn(),
      };

      await service.registerHandler(handler1);
      await service.registerHandler(handler2);

      const handlers = service.getHandlers(EventType.USER_CREATED);
      expect(handlers[0].handlerName).toBe('High Priority Handler');
      expect(handlers[1].handlerName).toBe('Low Priority Handler');
    });
  });

  describe('handler management', () => {
    it('should enable handler', async () => {
      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: false,
        handle: jest.fn(),
      };

      await service.registerHandler(handler);
      expect(service.getStats().enabledHandlers).toBe(0);

      const handlers = service.getHandlers();
      const handlerId = handlers[0].handlerId;

      const success = await service.enableHandler(handlerId);

      expect(success).toBe(true);
      expect(service.getStats().enabledHandlers).toBe(1);
    });

    it('should disable handler', async () => {
      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      await service.registerHandler(handler);
      expect(service.getStats().enabledHandlers).toBe(1);

      const handlers = service.getHandlers();
      const handlerId = handlers[0].handlerId;

      const success = await service.disableHandler(handlerId);

      expect(success).toBe(true);
      expect(service.getStats().enabledHandlers).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should handle event successfully', async () => {
      const mockHandle = jest.fn().mockResolvedValue({
        success: true,
        data: { processed: true },
        executionTime: 100,
      });

      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: mockHandle,
      };

      await service.registerHandler(handler);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].data).toEqual({ processed: true });
      expect(mockHandle).toHaveBeenCalledWith(event, context);
    });

    it('should handle event with multiple handlers', async () => {
      const mockHandle1 = jest.fn().mockResolvedValue({
        success: true,
        data: { processed: true },
        executionTime: 100,
      });

      const mockHandle2 = jest.fn().mockResolvedValue({
        success: true,
        data: { processed: true },
        executionTime: 200,
      });

      const handler1: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Handler 1',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: mockHandle1,
      };

      const handler2: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Handler 2',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 2,
        enabled: true,
        handle: mockHandle2,
      };

      await service.registerHandler(handler1);
      await service.registerHandler(handler2);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockHandle1).toHaveBeenCalledWith(event, context);
      expect(mockHandle2).toHaveBeenCalledWith(event, context);
    });

    it('should handle event with no handlers', async () => {
      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(0);
    });

    it('should handle event with disabled registry', async () => {
      const disabledService = new EventHandlerRegistryService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await disabledService.handleEvent(event, context);

      expect(results).toHaveLength(0);
    });

    it('should handle event with missing event type', async () => {
      const event = {
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Event type is required');
    });
  });

  describe('handler execution', () => {
    it('should handle handler timeout', async () => {
      const slowHandler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Slow Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            success: true,
            data: { processed: true },
            executionTime: 1000,
          }), 1000))
        ),
      };

      const timeoutService = new EventHandlerRegistryService(
        { ...mockConfig, handlerTimeout: 100 },
        mockEventEmitter,
        mockLogger
      );

      await timeoutService.registerHandler(slowHandler);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await timeoutService.handleEvent(event, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('All retry attempts failed');
    }, 10000);

    it('should handle handler failure', async () => {
      const failingHandler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Failing Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn().mockRejectedValue(new Error('Handler execution failed')),
      };

      await service.registerHandler(failingHandler);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('All retry attempts failed');
    }, 10000);

    it('should handle handler retry', async () => {
      let callCount = 0;
      const retryHandler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Retry Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            throw new Error('Temporary failure');
          }
          return Promise.resolve({
            success: true,
            data: { processed: true },
            executionTime: 100,
          });
        }),
      };

      const retryService = new EventHandlerRegistryService(
        { ...mockConfig, retries: 3, retryDelay: 100 },
        mockEventEmitter,
        mockLogger
      );

      await retryService.registerHandler(retryHandler);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      const results = await retryService.handleEvent(event, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(callCount).toBe(3);
    }, 15000);
  });

  describe('concurrency control', () => {
    it('should respect max concurrency limit', async () => {
      const concurrentService = new EventHandlerRegistryService(
        { ...mockConfig, maxConcurrency: 1, enableConcurrency: true },
        mockEventEmitter,
        mockLogger
      );

      const slowHandler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Slow Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({
            success: true,
            data: { processed: true },
            executionTime: 100,
          }), 100))
        ),
      };

      await concurrentService.registerHandler(slowHandler);

      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      // 同时发送两个事件
      const promise1 = concurrentService.handleEvent(event, context);
      const promise2 = concurrentService.handleEvent(event, context);

      const [results1, results2] = await Promise.all([promise1, promise2]);

      // 其中一个应该被拒绝
      expect(results1.length === 0 || results2.length === 0).toBe(true);
    }, 10000);
  });

  describe('health check', () => {
    it('should return healthy status when enabled and healthy', async () => {
      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      await service.registerHandler(handler);

      const health = await service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.details.enabled).toBe(true);
      expect(health.details.totalHandlers).toBe(1);
      expect(health.details.enabledHandlers).toBe(1);
      expect(health.details.stats).toBeDefined();
    });

    it('should return disabled status when disabled', async () => {
      const disabledService = new EventHandlerRegistryService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const health = await disabledService.getHealth();

      expect(health.status).toBe('disabled');
    });

    it('should return unhealthy when no enabled handlers', async () => {
      const health = await service.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.details.enabledHandlers).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new EventHandlerRegistryService(
        defaultConfig,
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        maxConcurrency: 5,
        handlerTimeout: 15000,
        retries: 2,
      };
      const customService = new EventHandlerRegistryService(
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
        expect.stringContaining('Started event handler registry monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event handler registry monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('EventHandlerRegistryService destroyed', expect.any(String));
    });
  });

  describe('error handling', () => {
    it('should handle registration errors gracefully', async () => {
      // 模拟注册失败
      jest.spyOn(service as any, 'emitEvent').mockImplementation(() => {
        throw new Error('Registration error');
      });

      const handler: Omit<EventHandler, 'handlerId' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount' | 'averageExecutionTime'> = {
        handlerName: 'Test Handler',
        supportedEventTypes: [EventType.USER_CREATED],
        priority: 1,
        enabled: true,
        handle: jest.fn(),
      };

      const success = await service.registerHandler(handler);

      expect(success).toBe(false);
    });

    it('should handle event handling errors gracefully', async () => {
      const event = {
        eventType: EventType.USER_CREATED,
        data: { userId: 'user-123' },
      };

      const context: EventHandlerContext = {
        requestId: 'req-123',
        tenantId: 'tenant-123',
        userId: 'user-123',
        timestamp: new Date(),
      };

      // 模拟事件处理失败
      jest.spyOn(service as any, 'emitEvent').mockImplementation(() => {
        throw new Error('Event handling error');
      });

      const results = await service.handleEvent(event, context);

      expect(results).toHaveLength(0);
    });
  });
});
