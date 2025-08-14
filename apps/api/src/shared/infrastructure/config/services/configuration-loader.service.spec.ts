import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigurationLoaderService } from './configuration-loader.service';
import { LoaderType, LoaderOptions } from '../interfaces/configuration-loader.interface';
import { ConfigSource } from '../interfaces/configuration.interface';

describe('ConfigurationLoaderService', () => {
  let service: ConfigurationLoaderService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationLoaderService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfigurationLoaderService>(ConfigurationLoaderService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic operations', () => {
    it('should add and remove loaders', () => {
      const mockLoader = {
        load: jest.fn(),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.ENVIRONMENT,
        priority: 1,
        enabled: true,
      };

      expect(service.addLoader(mockLoader, options)).toBe(true);
      expect(service.getLoader(LoaderType.ENVIRONMENT)).toBe(mockLoader);
      expect(service.removeLoader(LoaderType.ENVIRONMENT)).toBe(true);
      expect(service.getLoader(LoaderType.ENVIRONMENT)).toBeNull();
    });

    it('should manage loader options', () => {
      const mockLoader = {
        load: jest.fn(),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.FILE,
        priority: 2,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      expect(service.getLoaderOptions(LoaderType.FILE)).toEqual(options);
      expect(service.setLoaderOptions(LoaderType.FILE, { priority: 3 })).toBe(true);
      expect(service.getLoaderOptions(LoaderType.FILE)?.priority).toBe(3);
    });

    it('should enable and disable loaders', () => {
      const mockLoader = {
        load: jest.fn(),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.DATABASE,
        priority: 1,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      expect(service.isLoaderEnabled(LoaderType.DATABASE)).toBe(true);
      expect(service.enableLoader(LoaderType.DATABASE, false)).toBe(true);
      expect(service.isLoaderEnabled(LoaderType.DATABASE)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track loader statistics', async () => {
      const mockLoader = {
        load: jest.fn().mockResolvedValue({
          success: true,
          value: 'test-value',
          source: ConfigSource.ENVIRONMENT,
          loadTime: 10,
          metadata: {},
        }),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.ENVIRONMENT,
        priority: 1,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      // 清除之前的统计
      service.resetStats();

      // 执行一些加载操作
      await service.load('test-key', options);
      await service.load('test-key2', options);

      const stats = await service.getStats();
      const envStats = stats.find(s => s.type === LoaderType.ENVIRONMENT);

      expect(envStats).toBeDefined();
      expect(envStats?.totalLoads).toBeGreaterThanOrEqual(2);
      expect(envStats?.successfulLoads).toBeGreaterThanOrEqual(2);
      expect(envStats?.errorRate).toBe(0);
    });
  });

  describe('cache operations', () => {
    it('should clear cache', async () => {
      const mockLoader = {
        load: jest.fn().mockResolvedValue({
          success: true,
          value: 'test-value',
          source: ConfigSource.ENVIRONMENT,
          loadTime: 10,
          metadata: {},
        }),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.ENVIRONMENT,
        priority: 1,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      // 加载配置以填充缓存
      await service.load('test-key', options);

      // 清除缓存
      const clearedCount = await service.clearCache();
      expect(clearedCount).toBeGreaterThan(0);

      // 清除特定键的缓存
      await service.load('test-key2', options);
      const specificClearedCount = await service.clearCache('test-key2');
      expect(specificClearedCount).toBe(1);
    });
  });

  describe('event handling', () => {
    it('should emit events', async () => {
      const mockLoader = {
        load: jest.fn().mockResolvedValue({
          success: true,
          value: 'test-value',
          source: ConfigSource.ENVIRONMENT,
          loadTime: 10,
          metadata: {},
        }),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.ENVIRONMENT,
        priority: 1,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      // 监听事件
      const eventCallback = jest.fn();
      const unsubscribe = service.on('load', eventCallback);

      // 执行加载操作
      await service.load('test-key', options);

      // 验证事件被发送
      expect(eventEmitter.emit).toHaveBeenCalledWith('config.loader.load', expect.any(Object));

      // 取消监听
      unsubscribe();
    });

    it('should track event history', async () => {
      const mockLoader = {
        load: jest.fn().mockResolvedValue({
          success: true,
          value: 'test-value',
          source: ConfigSource.ENVIRONMENT,
          loadTime: 10,
          metadata: {},
        }),
        loadBatch: jest.fn(),
        preload: jest.fn(),
        refresh: jest.fn(),
        clearCache: jest.fn(),
        getStats: jest.fn(),
        addLoader: jest.fn(),
        removeLoader: jest.fn(),
        getLoader: jest.fn(),
        getLoaders: jest.fn(),
        setLoaderOptions: jest.fn(),
        getLoaderOptions: jest.fn(),
        enableLoader: jest.fn(),
        isLoaderEnabled: jest.fn(),
        getLoaderHealth: jest.fn(),
        getAllLoadersHealth: jest.fn(),
        on: jest.fn(),
        getEventHistory: jest.fn(),
        exportConfig: jest.fn(),
        importConfig: jest.fn(),
        resetStats: jest.fn(),
        optimize: jest.fn(),
      };

      const options: LoaderOptions = {
        type: LoaderType.ENVIRONMENT,
        priority: 1,
        enabled: true,
      };

      service.addLoader(mockLoader, options);

      // 执行一些操作
      await service.load('test-key', options);
      await service.refresh('test-key');

      const eventHistory = service.getEventHistory();
      expect(eventHistory.length).toBeGreaterThan(0);
      expect(eventHistory[0]).toHaveProperty('type');
      expect(eventHistory[0]).toHaveProperty('timestamp');
    });
  });
});
