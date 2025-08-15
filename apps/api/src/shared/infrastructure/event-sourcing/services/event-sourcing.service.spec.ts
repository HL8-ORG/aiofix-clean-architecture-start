import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventSourcingService, EventSourcingConfig } from './event-sourcing.service';
import { PostgresEventStore } from '../stores/postgres-event-store';
import { RedisEventCache } from '../caches/redis-event-cache';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @class MockPostgresEventStore
 * @description 模拟PostgresEventStore，用于测试
 */
class MockPostgresEventStore {
  private events: any[] = [];

  async storeEvent(event: any): Promise<boolean> {
    this.events.push(event);
    return true;
  }

  async getEvents(query: any): Promise<any[]> {
    if (query.eventId) {
      return this.events.filter(e => e.eventId === query.eventId);
    }
    if (query.aggregateId && query.aggregateType) {
      return this.events.filter(e =>
        e.aggregateId === query.aggregateId && e.aggregateType === query.aggregateType
      );
    }
    return this.events;
  }

  async getHealth(): Promise<any> {
    return { status: 'healthy', details: { connected: true } };
  }

  getStats(): any {
    return { totalEvents: this.events.length };
  }

  resetStats(): void {
    // 模拟重置统计
  }

  onDestroy(): void {
    // 模拟销毁
  }
}

/**
 * @class MockRedisEventCache
 * @description 模拟RedisEventCache，用于测试
 */
class MockRedisEventCache {
  private events = new Map<string, any>();
  private aggregateEvents = new Map<string, any[]>();

  async cacheEvent(event: any, ttl?: number): Promise<boolean> {
    this.events.set(event.eventId, event);

    const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
    if (!this.aggregateEvents.has(aggregateKey)) {
      this.aggregateEvents.set(aggregateKey, []);
    }
    this.aggregateEvents.get(aggregateKey)!.push(event);

    return true;
  }

  async cacheEvents(events: any[], ttl?: number): Promise<boolean> {
    for (const event of events) {
      await this.cacheEvent(event, ttl);
    }
    return true;
  }

  async getEvent(eventId: string): Promise<any | null> {
    return this.events.get(eventId) || null;
  }

  async getAggregateEvents(aggregateId: string, aggregateType: string): Promise<any[]> {
    const aggregateKey = `${aggregateType}:${aggregateId}`;
    return this.aggregateEvents.get(aggregateKey) || [];
  }

  async invalidateEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (event) {
      this.events.delete(eventId);
      return true;
    }
    return false;
  }

  async invalidateAggregateEvents(aggregateId: string, aggregateType: string): Promise<boolean> {
    const aggregateKey = `${aggregateType}:${aggregateId}`;
    this.aggregateEvents.delete(aggregateKey);
    return true;
  }

  getStats(): any {
    return { totalEvents: this.events.size };
  }

  resetStats(): void {
    // 模拟重置统计
  }

  async getHealth(): Promise<any> {
    return { status: 'healthy', details: { connected: true } };
  }

  onDestroy(): void {
    // 模拟销毁
  }
}

describe('EventSourcingService', () => {
  let service: EventSourcingService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;
  let mockEventStore: MockPostgresEventStore;
  let mockEventCache: MockRedisEventCache;

  const mockConfig: EventSourcingConfig = {
    enabled: true,
    enableEventCache: true,
    enableEventPublishing: true,
    enableEventReplay: true,
    enableSnapshots: true,
    snapshotInterval: 100,
    batchSize: 100,
    concurrency: 5,
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
    maxEventSize: 1024 * 1024,
    eventCacheTtl: 3600,
    aggregateCacheTtl: 7200,
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

    mockEventStore = new MockPostgresEventStore();
    mockEventCache = new MockRedisEventCache();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventSourcingService,
        {
          provide: 'EVENT_SOURCING_CONFIG',
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
        {
          provide: PostgresEventStore,
          useValue: mockEventStore,
        },
        {
          provide: RedisEventCache,
          useValue: mockEventCache,
        },
      ],
    }).compile();

    service = module.get<EventSourcingService>(EventSourcingService);
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
      expect(mockLogger.info).toHaveBeenCalledWith('EventSourcingService initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBe(0);
      expect(stats.storedEvents).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Event sourcing stats reset', expect.any(String));
    });
  });

  describe('event storage', () => {
    it('should store event successfully', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      const result = await service.storeEvent(event);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.cached).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle disabled event sourcing', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new EventSourcingService(
        disabledConfig,
        mockEventEmitter,
        mockLogger,
        mockEventStore as any,
        mockEventCache as any
      );

      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      const result = await disabledService.storeEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event sourcing is disabled');
    });

    it('should validate event data', async () => {
      const invalidEvent = {
        aggregateId: 'user-123',
        // 缺少必要字段
      };

      const result = await service.storeEvent(invalidEvent as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Event aggregateType is required');
    });
  });

  describe('event retrieval', () => {
    it('should get event from cache first', async () => {
      // 先存储一个事件
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      const storeResult = await service.storeEvent(event);
      expect(storeResult.success).toBe(true);

      // 获取事件
      const retrievedEvent = await service.getEvent(storeResult.eventId!);

      expect(retrievedEvent).toBeDefined();
      expect(retrievedEvent!.eventId).toBe(storeResult.eventId);
      expect(retrievedEvent!.aggregateId).toBe('user-123');
    });

    it('should get aggregate events', async () => {
      // 存储多个事件
      const events = [
        {
          aggregateId: 'user-123',
          aggregateType: 'User',
          eventType: EventType.USER_CREATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'John Doe' },
          userId: 'admin-123',
        },
        {
          aggregateId: 'user-123',
          aggregateType: 'User',
          eventType: EventType.USER_UPDATED,
          version: 2,
          status: EventStatus.COMPLETED,
          data: { name: 'John Smith' },
          userId: 'admin-123',
        },
      ];

      for (const event of events) {
        await service.storeEvent(event);
      }

      // 获取聚合根事件
      const aggregateEvents = await service.getAggregateEvents('user-123', 'User');

      expect(aggregateEvents).toHaveLength(2);
      expect(aggregateEvents[0].version).toBe(1);
      expect(aggregateEvents[1].version).toBe(2);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate event cache', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      const storeResult = await service.storeEvent(event);
      expect(storeResult.success).toBe(true);

      const success = await service.invalidateEvent(storeResult.eventId!);
      expect(success).toBe(true);
    });

    it('should invalidate aggregate events cache', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      await service.storeEvent(event);

      const success = await service.invalidateAggregateEvents('user-123', 'User');
      expect(success).toBe(true);
    });
  });

  describe('health check', () => {
    it('should return healthy status when all services are healthy', async () => {
      const health = await service.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.details.enabled).toBe(true);
      expect(health.details.eventStore).toBeDefined();
      expect(health.details.eventCache).toBeDefined();
      expect(health.details.stats).toBeDefined();
    });

    it('should return disabled status when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new EventSourcingService(
        disabledConfig,
        mockEventEmitter,
        mockLogger,
        mockEventStore as any,
        mockEventCache as any
      );

      const health = await disabledService.getHealth();
      expect(health.status).toBe('disabled');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new EventSourcingService(
        defaultConfig,
        mockEventEmitter,
        mockLogger,
        mockEventStore as any,
        mockEventCache as any
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        batchSize: 50,
        retries: 5,
        eventCacheTtl: 1800,
      };
      const customService = new EventSourcingService(
        customConfig,
        mockEventEmitter,
        mockLogger,
        mockEventStore as any,
        mockEventCache as any
      );

      expect(customService).toBeDefined();
    });
  });

  describe('monitoring', () => {
    it('should start monitoring on initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started event sourcing monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event sourcing monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('EventSourcingService destroyed', expect.any(String));
    });
  });

  describe('error handling', () => {
    it('should handle event store failures', async () => {
      // 模拟事件存储失败
      jest.spyOn(mockEventStore, 'storeEvent').mockResolvedValue(false);

      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      const result = await service.storeEvent(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store event in database');
    });

    it('should handle cache failures gracefully', async () => {
      // 模拟缓存失败
      jest.spyOn(mockEventCache, 'cacheEvent').mockRejectedValue(new Error('Cache error'));

      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      const result = await service.storeEvent(event);

      // 事件存储应该成功，但缓存失败
      expect(result.success).toBe(true);
      expect(result.cached).toBe(false);
    });
  });
});
