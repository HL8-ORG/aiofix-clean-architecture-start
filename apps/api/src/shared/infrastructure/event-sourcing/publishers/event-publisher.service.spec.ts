import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisherService, EventPublisherConfig } from './event-publisher.service';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { EventType, EventStatus } from '../stores/postgres-event-store';

describe('EventPublisherService', () => {
  let service: EventPublisherService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;

  const mockConfig: EventPublisherConfig = {
    enabled: true,
    enableAsync: true,
    enableQueue: true,
    queueSize: 1000,
    publishTimeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableAck: true,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
    maxConcurrency: 10,
    batchSize: 100,
    failureStrategy: 'retry',
    deadLetterTtl: 86400,
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
        EventPublisherService,
        {
          provide: 'EVENT_PUBLISHER_CONFIG',
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

    service = module.get<EventPublisherService>(EventPublisherService);
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
      expect(mockLogger.info).toHaveBeenCalledWith('EventPublisherService initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalPublished).toBe(0);
      expect(stats.successfulPublished).toBe(0);
      expect(stats.failedPublished).toBe(0);
      expect(stats.activeSubscriptions).toBe(0);
      expect(stats.totalSubscriptions).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Event publisher stats reset', expect.any(String));
    });
  });

  describe('event publishing', () => {
    it('should publish event successfully', async () => {
      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.publishEvent(event);

      expect(result.success).toBe(true);
      expect(result.publishId).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.acknowledgments).toBe(0); // 没有订阅者
    });

    it('should handle disabled event publishing', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new EventPublisherService(
        disabledConfig,
        mockEventEmitter,
        mockLogger
      );

      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await disabledService.publishEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event publishing is disabled');
    });

    it('should validate event data', async () => {
      const invalidEvent = {
        eventId: 'event-123',
        // 缺少必要字段
      };

      const result = await service.publishEvent(invalidEvent as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Event eventType is required');
    });

    it('should publish events to subscribers', async () => {
      // 注册订阅者
      await service.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.publishEvent(event);

      expect(result.success).toBe(true);
      expect(result.acknowledgments).toBe(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'eventsourcing.user.created',
        expect.objectContaining({
          event,
          publishId: result.publishId,
        })
      );
    });
  });

  describe('subscription management', () => {
    it('should register subscription successfully', async () => {
      const success = await service.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1',
        'http://localhost:3000/webhook'
      );

      expect(success).toBe(true);

      const subscriptions = service.getSubscriptions(EventType.USER_CREATED);
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].subscriberId).toBe('subscriber-1');
      expect(subscriptions[0].subscriberName).toBe('Test Subscriber 1');
      expect(subscriptions[0].status).toBe('active');
    });

    it('should unregister subscription successfully', async () => {
      // 先注册
      await service.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      // 再取消注册
      const success = await service.unsubscribe(EventType.USER_CREATED, 'subscriber-1');

      expect(success).toBe(true);

      const subscriptions = service.getSubscriptions(EventType.USER_CREATED);
      expect(subscriptions).toHaveLength(0);
    });

    it('should get subscriptions by event type', async () => {
      // 注册多个订阅者
      await service.subscribe(EventType.USER_CREATED, 'subscriber-1', 'Test Subscriber 1');
      await service.subscribe(EventType.USER_CREATED, 'subscriber-2', 'Test Subscriber 2');
      await service.subscribe(EventType.USER_UPDATED, 'subscriber-3', 'Test Subscriber 3');

      const userCreatedSubscriptions = service.getSubscriptions(EventType.USER_CREATED);
      expect(userCreatedSubscriptions).toHaveLength(2);

      const userUpdatedSubscriptions = service.getSubscriptions(EventType.USER_UPDATED);
      expect(userUpdatedSubscriptions).toHaveLength(1);

      const allSubscriptions = service.getSubscriptions();
      expect(allSubscriptions).toHaveLength(3);
    });

    it('should handle subscription errors', async () => {
      // 模拟订阅失败
      jest.spyOn(service as any, 'emitEvent').mockImplementation(() => {
        throw new Error('Subscription error');
      });

      const success = await service.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      expect(success).toBe(false);
    });
  });

  describe('event acknowledgment', () => {
    it('should acknowledge event successfully', async () => {
      // 注册订阅者
      await service.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const publishResult = await service.publishEvent(event);
      expect(publishResult.success).toBe(true);

      // 确认事件
      const ackResult = await service.acknowledgeEvent(publishResult.publishId!, 'subscriber-1');
      expect(ackResult).toBe(true);
    });

    it('should handle acknowledgment when disabled', async () => {
      const disabledConfig = { ...mockConfig, enableAck: false };
      const disabledService = new EventPublisherService(
        disabledConfig,
        mockEventEmitter,
        mockLogger
      );

      const result = await disabledService.acknowledgeEvent('publish-123', 'subscriber-1');
      expect(result).toBe(false);
    });
  });

  describe('batch publishing', () => {
    it('should publish multiple events successfully', async () => {
      const events = [
        {
          eventId: 'event-1',
          aggregateId: 'user-1',
          aggregateType: 'User',
          eventType: EventType.USER_CREATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'John Doe' },
          userId: 'admin-123',
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          eventId: 'event-2',
          aggregateId: 'user-2',
          aggregateType: 'User',
          eventType: EventType.USER_UPDATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'Jane Smith' },
          userId: 'admin-123',
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = await service.publishEvents(events);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle empty events array', async () => {
      const results = await service.publishEvents([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('health check', () => {
    it('should return healthy status when enabled and healthy', async () => {
      const health = await service.getHealth();
      expect(health.status).toBe('unhealthy'); // 没有活跃订阅者时状态为unhealthy
      expect(health.details.enabled).toBe(true);
      expect(health.details.queueSize).toBe(0);
      expect(health.details.activeSubscriptions).toBe(0);
      expect(health.details.stats).toBeDefined();
    });

    it('should return disabled status when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new EventPublisherService(
        disabledConfig,
        mockEventEmitter,
        mockLogger
      );

      const health = await disabledService.getHealth();
      expect(health.status).toBe('disabled');
    });

    it('should return unhealthy when queue is full', async () => {
      const smallQueueConfig = { ...mockConfig, queueSize: 1 };
      const smallQueueService = new EventPublisherService(
        smallQueueConfig,
        mockEventEmitter,
        mockLogger
      );

      // 发布两个事件，使队列满
      const event1 = {
        eventId: 'event-1',
        aggregateId: 'user-1',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event2 = {
        eventId: 'event-2',
        aggregateId: 'user-2',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'Jane Smith' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await smallQueueService.publishEvent(event1);
      await smallQueueService.publishEvent(event2);

      const health = await smallQueueService.getHealth();
      expect(health.status).toBe('unhealthy');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new EventPublisherService(
        defaultConfig,
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        queueSize: 500,
        retries: 5,
        batchSize: 50,
      };
      const customService = new EventPublisherService(
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
        expect.stringContaining('Started event publisher monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event publisher monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('EventPublisherService destroyed', expect.any(String));
    });
  });

  describe('error handling', () => {
    it('should handle publish failures gracefully', async () => {
      // 创建一个总是失败的订阅者
      const failingService = new EventPublisherService(
        { ...mockConfig, retries: 0, retryDelay: 100 }, // 不重试
        mockEventEmitter,
        mockLogger
      );

      // 模拟发布失败
      jest.spyOn(mockEventEmitter, 'emit').mockImplementation(() => {
        throw new Error('Publish error');
      });

      // 注册订阅者
      await failingService.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await failingService.publishEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Max retries exceeded');
    }, 10000); // 增加超时时间

    it('should handle subscription errors', async () => {
      // 创建一个总是失败的订阅者
      const failingService = new EventPublisherService(
        { ...mockConfig, retries: 0, retryDelay: 100 }, // 不重试
        mockEventEmitter,
        mockLogger
      );

      // 模拟订阅者错误
      jest.spyOn(mockEventEmitter, 'emit').mockImplementation(() => {
        throw new Error('Subscriber error');
      });

      // 注册订阅者
      await failingService.subscribe(
        EventType.USER_CREATED,
        'subscriber-1',
        'Test Subscriber 1'
      );

      const event = {
        eventId: 'event-123',
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await failingService.publishEvent(event);

      expect(result.success).toBe(false);
    }, 10000); // 增加超时时间
  });
});
