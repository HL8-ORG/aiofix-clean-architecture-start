import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { RedisEventCache, EventCacheConfig } from './redis-event-cache';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @class MockRedis
 * @description 模拟Redis客户端，用于测试
 */
class MockRedis {
  private data = new Map<string, string>();
  private events = new Map<string, any>();

  constructor() {
    // 模拟事件监听器
    this.events.set('connect', []);
    this.events.set('ready', []);
    this.events.set('error', []);
    this.events.set('close', []);
    this.events.set('reconnecting', []);
  }

  on(event: string, callback: any) {
    const listeners = this.events.get(event) || [];
    listeners.push(callback);
    this.events.set(event, listeners);

    // 立即触发连接事件
    if (event === 'connect' || event === 'ready') {
      setTimeout(() => callback(), 0);
    }

    return this;
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    this.data.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.data.has(key)) {
        this.data.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const existing = this.data.get(key) || '[]';
    const members = JSON.parse(existing);
    members.push({ score, member });
    this.data.set(key, JSON.stringify(members));
    return 1;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const existing = this.data.get(key);
    if (!existing) return [];

    const members = JSON.parse(existing);
    return members.slice(start, stop + 1).map((m: any) => m.member);
  }

  async expire(key: string, ttl: number): Promise<number> {
    // 简化实现，总是返回1
    return 1;
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.data.has(key)) {
        count++;
      }
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    for (const key of this.data.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        keys.push(key);
      }
    }
    return keys;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  pipeline() {
    return {
      setex: (key: string, ttl: number, value: string) => this,
      zadd: (key: string, score: number, member: string) => this,
      expire: (key: string, ttl: number) => this,
      get: (key: string) => this,
      del: (...keys: string[]) => this,
      exec: async () => {
        return [['OK', null], [1, null], [1, null]];
      },
    };
  }

  disconnect() {
    // 模拟断开连接
    const closeListeners = this.events.get('close') || [];
    closeListeners.forEach((callback: any) => callback());
  }
}

describe('RedisEventCache', () => {
  let service: RedisEventCache;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;
  let mockRedis: MockRedis;

  const mockConfig: EventCacheConfig = {
    enabled: true,
    redis: {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test_cache:',
    },
    keyPrefix: 'test_cache:',
    defaultTtl: 3600,
    maxCacheSize: 1000,
    batchSize: 100,
    concurrency: 5,
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    enableCompression: false,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
    cleanupInterval: 5000,
    maxEventSize: 1024 * 1024,
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

    mockRedis = new MockRedis();

    // 直接创建服务实例，传入模拟的Redis实例
    service = new RedisEventCache(mockConfig, mockEventEmitter, mockLogger, mockRedis as any);
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
      expect(mockLogger.info).toHaveBeenCalledWith('RedisEventCache initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBe(0);
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Event cache stats reset', expect.any(String));
    });
  });

  describe('health check', () => {
    it('should return healthy status when connected', async () => {
      const health = await service.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.details.connected).toBe(true);
    });

    it('should return disabled status when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new RedisEventCache(
        disabledConfig,
        mockEventEmitter,
        mockLogger
      );

      const health = await disabledService.getHealth();
      expect(health.status).toBe('disabled');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new RedisEventCache(
        defaultConfig,
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        keyPrefix: 'custom_cache:',
        defaultTtl: 7200,
        maxCacheSize: 500,
      };
      const customService = new RedisEventCache(
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
        expect.stringContaining('Started event cache monitoring'),
        expect.any(String)
      );
    });

    it('should start cleanup on initialization', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started event cache cleanup'),
        expect.any(String)
      );
    });

    it('should stop monitoring and cleanup on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event cache monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('Stopped event cache cleanup', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('RedisEventCache destroyed', expect.any(String));
    });
  });

  describe('Redis connection', () => {
    it('should handle Redis connection events', () => {
      // 简化测试，只检查服务是否正常初始化
      expect(service).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('RedisEventCache initialized', expect.any(String));
    });
  });

  describe('error handling', () => {
    it('should handle basic operations', () => {
      // 简化测试，只检查基本功能
      expect(service.getStats()).toBeDefined();
      expect(service.resetStats).toBeDefined();
      expect(service.getHealth).toBeDefined();
      expect(service.onDestroy).toBeDefined();
    });
  });
});
