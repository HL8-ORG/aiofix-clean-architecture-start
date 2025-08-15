import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MikroORM } from '@mikro-orm/core';
import { PostgresEventStore, EventStoreConfig, EventType, EventStatus } from './postgres-event-store';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';

/**
 * @class MockEntityManager
 * @description 模拟实体管理器，用于测试
 */
class MockEntityManager {
  private events: any[] = [];
  
  constructor() {
    this.connection = {
      execute: jest.fn().mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO')) {
          this.events.push({
            event_id: params[0],
            aggregate_id: params[1],
            aggregate_type: params[2],
            event_type: params[3],
            version: params[4],
            status: params[5],
            data: params[6],
            metadata: params[7],
            user_id: params[8],
            tenant_id: params[9],
            session_id: params[10],
            request_id: params[11],
            timestamp: params[12],
            created_at: params[13],
            updated_at: params[14],
          });
          return Promise.resolve({ affectedRows: 1 });
        } else if (sql.includes('SELECT')) {
          // 根据查询条件过滤事件
          let filteredEvents = [...this.events];
          
          // 模拟 WHERE 条件过滤
          if (sql.includes('aggregate_id = ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'aggregate_id = ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.aggregate_id === params[paramIndex]);
            }
          }
          
          if (sql.includes('aggregate_type = ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'aggregate_type = ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.aggregate_type === params[paramIndex]);
            }
          }
          
          if (sql.includes('version >= ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'version >= ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.version >= params[paramIndex]);
            }
          }
          
          if (sql.includes('version <= ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'version <= ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.version <= params[paramIndex]);
            }
          }
          
          if (sql.includes('event_type = ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'event_type = ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.event_type === params[paramIndex]);
            }
          }
          
          if (sql.includes('status = ?') && params.length > 0) {
            const paramIndex = this.getParamIndex(sql, 'status = ?');
            if (paramIndex >= 0 && paramIndex < params.length) {
              filteredEvents = filteredEvents.filter(e => e.status === params[paramIndex]);
            }
          }
          
          return Promise.resolve(filteredEvents);
        }
        return Promise.resolve([]);
      }),
    };
  }
  
  private connection: any;

  /**
   * @private
   * @method getParamIndex
   * @description 获取参数在SQL中的索引位置
   * @param sql SQL语句
   * @param condition 查询条件
   * @returns {number} 参数索引
   */
  private getParamIndex(sql: string, condition: string): number {
    const parts = sql.split(condition);
    if (parts.length < 2) return -1;
    
    const beforeCondition = parts[0];
    const questionMarks = (beforeCondition.match(/\?/g) || []).length;
    return questionMarks;
  }

  fork() {
    return this;
  }

  getConnection() {
    return this.connection;
  }

  flush() {
    return Promise.resolve();
  }

  rollback() {
    return Promise.resolve();
  }
}

/**
 * @class MockMikroORM
 * @description 模拟MikroORM，用于测试
 */
class MockMikroORM {
  em = new MockEntityManager();
}

describe('PostgresEventStore', () => {
  let service: PostgresEventStore;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;
  let mockOrm: MockMikroORM;

  const mockConfig: EventStoreConfig = {
    enabled: true,
    connectionName: 'default',
    eventTableName: 'events',
    snapshotTableName: 'snapshots',
    maxEventSize: 1024 * 1024,
    batchSize: 100,
    concurrency: 5,
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableSnapshots: true,
    snapshotInterval: 100,
    enableEventPublishing: true,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
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

    mockOrm = new MockMikroORM();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresEventStore,
        {
          provide: 'EVENT_STORE_CONFIG',
          useValue: mockConfig,
        },
        {
          provide: MikroORM,
          useValue: mockOrm,
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

    service = module.get<PostgresEventStore>(PostgresEventStore);
  });

  afterEach(() => {
    service.onDestroy();
  });

  describe('basic operations', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('PostgresEventStore initialized', expect.any(String));
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
        data: { name: 'John Doe', email: 'john@example.com' },
        userId: 'admin-123',
        tenantId: 'tenant-1',
      };

      const result = await service.storeEvent(event);

      expect(result).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Event stored:'),
        expect.any(String)
      );
    });

    it('should handle disabled event store', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new PostgresEventStore(
        disabledConfig,
        mockOrm as any,
        mockEventEmitter,
        mockLogger
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

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Event store is disabled', expect.any(String));
    });

    it('should validate event data', async () => {
      const invalidEvent = {
        aggregateId: 'user-123',
        // missing required fields
      };

      const result = await service.storeEvent(invalidEvent as any);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store event:'),
        expect.any(String),
        undefined,
        expect.any(Error)
      );
    });

    it('should handle event size limit', async () => {
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { largeField: largeData },
      };

      const result = await service.storeEvent(event);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store event:'),
        expect.any(String),
        undefined,
        expect.any(Error)
      );
    });
  });

  describe('event retrieval', () => {
    it('should retrieve events by query', async () => {
      // 为这个测试创建独立的服务实例
      const testMockOrm = new MockMikroORM();
      const testService = new PostgresEventStore(
        mockConfig,
        testMockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      // 为这个测试创建独立的数据
      const testEvents = [
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

      for (const event of testEvents) {
        await testService.storeEvent(event);
      }

      const query = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        orderBy: 'version',
        orderDirection: 'ASC' as const,
      };

      const events = await testService.getEvents(query);

      expect(events).toHaveLength(2);
      expect(events[0].version).toBe(1);
      expect(events[1].version).toBe(2);

      // 清理
      testService.onDestroy();
    });

    it('should retrieve events by event type', async () => {
      // 为这个测试创建独立的服务实例
      const testMockOrm = new MockMikroORM();
      const testService = new PostgresEventStore(
        mockConfig,
        testMockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      // 为这个测试创建独立的数据
      const testEvents = [
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
          aggregateId: 'user-456',
          aggregateType: 'User',
          eventType: EventType.USER_CREATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'Jane Doe' },
          userId: 'admin-123',
        },
      ];

      for (const event of testEvents) {
        await testService.storeEvent(event);
      }

      const query = {
        eventType: EventType.USER_CREATED,
      };

      const events = await testService.getEvents(query);

      expect(events).toHaveLength(2);
      expect(events.every(e => e.eventType === EventType.USER_CREATED)).toBe(true);

      // 清理
      testService.onDestroy();
    });

    it('should retrieve events by status', async () => {
      // 为这个测试创建独立的服务实例
      const testMockOrm = new MockMikroORM();
      const testService = new PostgresEventStore(
        mockConfig,
        testMockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      // 为这个测试创建独立的数据
      const testEvents = [
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
          aggregateId: 'user-456',
          aggregateType: 'User',
          eventType: EventType.USER_CREATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'Jane Doe' },
          userId: 'admin-123',
        },
        {
          aggregateId: 'user-789',
          aggregateType: 'User',
          eventType: EventType.USER_UPDATED,
          version: 1,
          status: EventStatus.COMPLETED,
          data: { name: 'Bob Smith' },
          userId: 'admin-123',
        },
      ];

      for (const event of testEvents) {
        await testService.storeEvent(event);
      }

      const query = {
        status: EventStatus.COMPLETED,
      };

      const events = await testService.getEvents(query);

      expect(events).toHaveLength(3);
      expect(events.every(e => e.status === EventStatus.COMPLETED)).toBe(true);

      // 清理
      testService.onDestroy();
    });

    it('should retrieve events by time range', async () => {
      // 为这个测试创建独立的服务实例
      const testMockOrm = new MockMikroORM();
      const testService = new PostgresEventStore(
        mockConfig,
        testMockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      // 存储一个测试事件
      const testEvent = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
        userId: 'admin-123',
      };

      await testService.storeEvent(testEvent);

      const now = new Date();
      const query = {
        startTime: new Date(now.getTime() - 1000), // 1 second ago
        endTime: new Date(now.getTime() + 1000),   // 1 second from now
      };

      const events = await testService.getEvents(query);

      expect(events.length).toBeGreaterThan(0);

      // 清理
      testService.onDestroy();
    });

    it('should handle disabled event store for retrieval', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new PostgresEventStore(
        disabledConfig,
        mockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      const events = await disabledService.getEvents({});

      expect(events).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith('Event store is disabled', expect.any(String));
    });
  });

  describe('statistics', () => {
    it('should get event store stats', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBe(0);
      expect(stats.averageEventSize).toBe(0);
      expect(stats.maxEventSize).toBe(0);
      expect(stats.eventTypeDistribution).toBeDefined();
      expect(stats.eventStatusDistribution).toBeDefined();
      expect(stats.aggregateTypeDistribution).toBeDefined();
    });

    it('should update stats after storing events', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      await service.storeEvent(event);

      const stats = service.getStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.averageEventSize).toBeGreaterThan(0);
      expect(stats.eventTypeDistribution[EventType.USER_CREATED]).toBe(1);
      expect(stats.eventStatusDistribution[EventStatus.COMPLETED]).toBe(1);
    });

    it('should reset stats', () => {
      service.resetStats();

      expect(mockLogger.info).toHaveBeenCalledWith('Event store stats reset', expect.any(String));
    });
  });

  describe('event publishing', () => {
    it('should publish events when enabled', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      await service.storeEvent(event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        `event.${EventType.USER_CREATED}`,
        expect.objectContaining({
          event: expect.objectContaining({
            eventType: EventType.USER_CREATED,
          }),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit event store events', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      await service.storeEvent(event);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'eventstore.event_stored',
        expect.objectContaining({
          type: 'event_stored',
          data: expect.objectContaining({ event: expect.any(Object) }),
          timestamp: expect.any(Date),
          storeId: 'postgres-event-store',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // 模拟数据库错误
      const mockConnection = {
        execute: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      const mockEm = {
        fork: jest.fn().mockReturnValue({
          getConnection: () => mockConnection,
          flush: jest.fn(),
          rollback: jest.fn(),
        }),
      };
      const mockOrmWithError = { em: mockEm };

      const errorService = new PostgresEventStore(
        mockConfig,
        mockOrmWithError as any,
        mockEventEmitter,
        mockLogger
      );

      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      const result = await errorService.storeEvent(event);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to store event:'),
        expect.any(String),
        undefined,
        expect.any(Error)
      );
    });

    it('should handle version conflicts', async () => {
      const event = {
        aggregateId: 'user-123',
        aggregateType: 'User',
        eventType: EventType.USER_CREATED,
        version: 1,
        status: EventStatus.COMPLETED,
        data: { name: 'John Doe' },
      };

      // 第一次存储应该成功
      const result1 = await service.storeEvent(event);
      expect(result1).toBe(true);

      // 第二次存储相同版本应该失败
      const result2 = await service.storeEvent(event);
      expect(result2).toBe(false);
    });
  });

  describe('monitoring', () => {
    it('should start monitoring on initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started event store monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event store monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('PostgresEventStore destroyed', expect.any(String));
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new PostgresEventStore(
        defaultConfig,
        mockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        eventTableName: 'custom_events',
        maxEventSize: 2048,
        batchSize: 50,
      };
      const customService = new PostgresEventStore(
        customConfig,
        mockOrm as any,
        mockEventEmitter,
        mockLogger
      );

      expect(customService).toBeDefined();
    });
  });
});
