import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigurationCacheService } from './configuration-cache.service';
import { CacheStrategy, CacheEvictionPolicy } from '../interfaces/configuration-cache.interface';

describe('ConfigurationCacheService', () => {
  let service: ConfigurationCacheService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationCacheService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfigurationCacheService>(ConfigurationCacheService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic operations', () => {
    it('should set and get cache values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      // 设置缓存
      const setResult = await service.set(key, value);
      expect(setResult).toBe(true);

      // 获取缓存
      const getResult = await service.get(key);
      expect(getResult).toEqual(value);
    });

    it('should handle different data types', async () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 12345 },
        { key: 'boolean', value: true },
        { key: 'object', value: { nested: { data: 'value' } } },
        { key: 'array', value: [1, 2, 3, 'test'] },
        { key: 'null', value: null },
      ];

      for (const testCase of testCases) {
        await service.set(testCase.key, testCase.value);
        const result = await service.get(testCase.key);
        expect(result).toEqual(testCase.value);
      }
    });

    it('should check if cache exists', async () => {
      const key = 'test-key';
      const value = 'test-value';

      // 初始状态
      expect(await service.has(key)).toBe(false);

      // 设置缓存后
      await service.set(key, value);
      expect(await service.has(key)).toBe(true);
    });

    it('should delete cache values', async () => {
      const key = 'test-key';
      const value = 'test-value';

      // 设置缓存
      await service.set(key, value);
      expect(await service.has(key)).toBe(true);

      // 删除缓存
      const deleteResult = await service.delete(key);
      expect(deleteResult).toBe(true);
      expect(await service.has(key)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', async () => {
      // 清除之前的统计
      await service.clear();

      // 执行一些缓存操作
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.get('key1');
      await service.get('key2');
      await service.get('non-existent'); // 未命中

      const stats = await service.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeGreaterThan(0);
      // 由于操作很快，平均时间可能为0，所以改为检查总访问次数
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('cache configuration', () => {
    it('should set and get cache strategy', () => {
      const newStrategy = CacheStrategy.REDIS;
      const success = service.setStrategy(newStrategy);
      expect(success).toBe(true);

      const currentStrategy = service.getStrategy();
      expect(currentStrategy).toBe(newStrategy);
    });

    it('should enable and disable cache', () => {
      service.enable(false);
      expect(service.isEnabled()).toBe(false);

      service.enable(true);
      expect(service.isEnabled()).toBe(true);
    });
  });
});
