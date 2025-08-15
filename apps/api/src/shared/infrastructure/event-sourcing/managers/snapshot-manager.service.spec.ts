import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SnapshotManagerService, SnapshotConfig, SnapshotQuery } from './snapshot-manager.service';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';

describe('SnapshotManagerService', () => {
  let service: SnapshotManagerService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockLogger: jest.Mocked<PinoLoggerService>;

  const mockConfig: SnapshotConfig = {
    enabled: true,
    snapshotInterval: 100,
    retentionPolicy: 'keep_latest',
    retentionCount: 10,
    retentionDays: 30,
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    enableEncryption: false,
    enableStats: true,
    enableEvents: true,
    monitoringInterval: 1000,
    storagePath: './snapshots',
    maxSnapshotSize: 10 * 1024 * 1024, // 10MB
    enableValidation: true,
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
        SnapshotManagerService,
        {
          provide: 'SNAPSHOT_CONFIG',
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

    service = module.get<SnapshotManagerService>(SnapshotManagerService);
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
      expect(mockLogger.info).toHaveBeenCalledWith('SnapshotManagerService initialized', expect.any(String));
    });

    it('should get stats', () => {
      const stats = service.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalSnapshots).toBe(0);
      expect(stats.successfulCreations).toBe(0);
      expect(stats.failedCreations).toBe(0);
      expect(stats.successfulRestorations).toBe(0);
      expect(stats.failedRestorations).toBe(0);
      expect(stats.successfulDeletions).toBe(0);
      expect(stats.failedDeletions).toBe(0);
      expect(stats.totalStorageSize).toBe(0);
      expect(stats.averageSnapshotSize).toBe(0);
      expect(stats.maxSnapshotSize).toBe(0);
      expect(stats.minSnapshotSize).toBe(0);
      expect(stats.compressionRatio).toBe(0);
      expect(stats.errorCount).toBe(0);
    });

    it('should reset stats', () => {
      service.resetStats();
      expect(mockLogger.info).toHaveBeenCalledWith('Snapshot manager stats reset', expect.any(String));
    });
  });

  describe('snapshot creation', () => {
    it('should create snapshot successfully', async () => {
      const aggregateId = 'user-123';
      const aggregateType = 'User';
      const aggregateState = { name: 'John Doe', email: 'john@example.com' };
      const aggregateVersion = 100;
      const metadata = { createdBy: 'system' };

      const result = await service.createSnapshot(
        aggregateId,
        aggregateType,
        aggregateState,
        aggregateVersion,
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBeDefined();
      expect(result.operationTime).toBeGreaterThanOrEqual(0);
      expect(result.snapshotSize).toBeGreaterThan(0);
      expect(result.metadata).toEqual(metadata);

      const stats = service.getStats();
      expect(stats.totalSnapshots).toBe(1);
      expect(stats.successfulCreations).toBe(1);
      expect(stats.totalStorageSize).toBeGreaterThan(0);
    });

    it('should handle disabled snapshot management', async () => {
      const disabledService = new SnapshotManagerService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const result = await disabledService.createSnapshot(
        'user-123',
        'User',
        { name: 'John Doe' },
        100
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Snapshot management is disabled');
    });

    it('should not create snapshot if interval not reached', async () => {
      const aggregateId = 'user-123';
      const aggregateType = 'User';
      const aggregateState = { name: 'John Doe' };

      // 第一次创建快照
      const result1 = await service.createSnapshot(
        aggregateId,
        aggregateType,
        aggregateState,
        100
      );

      expect(result1.success).toBe(true);
      expect(result1.snapshotId).toBeDefined();

      // 第二次创建快照（版本间隔不够）
      const result2 = await service.createSnapshot(
        aggregateId,
        aggregateType,
        aggregateState,
        150 // 间隔只有50，小于100
      );

      expect(result2.success).toBe(true);
      expect(result2.snapshotId).toBeUndefined(); // 没有创建新的快照

      const stats = service.getStats();
      expect(stats.totalSnapshots).toBe(1); // 只有一个快照
    });

    it('should create snapshot when interval is reached', async () => {
      const aggregateId = 'user-123';
      const aggregateType = 'User';
      const aggregateState = { name: 'John Doe' };

      // 第一次创建快照
      const result1 = await service.createSnapshot(
        aggregateId,
        aggregateType,
        aggregateState,
        100
      );

      expect(result1.success).toBe(true);

      // 第二次创建快照（版本间隔足够）
      const result2 = await service.createSnapshot(
        aggregateId,
        aggregateType,
        aggregateState,
        250 // 间隔150，大于100
      );

      expect(result2.success).toBe(true);
      expect(result2.snapshotId).toBeDefined();

      const stats = service.getStats();
      expect(stats.totalSnapshots).toBe(2); // 两个快照
    });

    it('should handle invalid aggregate state', async () => {
      const result = await service.createSnapshot(
        'user-123',
        'User',
        null, // 无效状态
        100
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid aggregate state');

      const stats = service.getStats();
      expect(stats.failedCreations).toBe(1);
    });
  });

  describe('snapshot retrieval', () => {
    it('should get snapshot by ID', async () => {
      // 创建快照
      const result = await service.createSnapshot(
        'user-123',
        'User',
        { name: 'John Doe' },
        100
      );

      expect(result.success).toBe(true);
      const snapshotId = result.snapshotId!;

      // 获取快照
      const snapshot = await service.getSnapshot(snapshotId);

      expect(snapshot).toBeDefined();
      expect(snapshot!.snapshotId).toBe(snapshotId);
      expect(snapshot!.aggregateId).toBe('user-123');
      expect(snapshot!.aggregateType).toBe('User');
      expect(snapshot!.aggregateVersion).toBe(100);
      expect(snapshot!.aggregateState).toEqual({ name: 'John Doe' });
    });

    it('should return null for non-existent snapshot', async () => {
      const snapshot = await service.getSnapshot('non-existent-id');
      expect(snapshot).toBeNull();
    });

    it('should get latest snapshot', async () => {
      // 创建多个快照
      await service.createSnapshot('user-123', 'User', { name: 'John Doe' }, 100);
      await service.createSnapshot('user-123', 'User', { name: 'John Doe', email: 'john@example.com' }, 200);

      const latestSnapshot = await service.getLatestSnapshot('user-123', 'User');

      expect(latestSnapshot).toBeDefined();
      expect(latestSnapshot!.aggregateVersion).toBe(200);
      expect(latestSnapshot!.aggregateState).toEqual({ name: 'John Doe', email: 'john@example.com' });
    });

    it('should return null when no snapshots exist', async () => {
      const snapshot = await service.getLatestSnapshot('user-123', 'User');
      expect(snapshot).toBeNull();
    });
  });

  describe('snapshot querying', () => {
    beforeEach(async () => {
      // 创建测试快照
      await service.createSnapshot('user-123', 'User', { name: 'John Doe' }, 100, { createdBy: 'system' });
      await service.createSnapshot('user-456', 'User', { name: 'Jane Doe' }, 150, { createdBy: 'admin' });
      await service.createSnapshot('tenant-123', 'Tenant', { name: 'Company A' }, 200, { createdBy: 'system' });
    });

    it('should query snapshots by aggregate ID', async () => {
      const query: SnapshotQuery = {
        aggregateId: 'user-123',
      };

      const snapshots = await service.querySnapshots(query);

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].aggregateId).toBe('user-123');
    });

    it('should query snapshots by aggregate type', async () => {
      const query: SnapshotQuery = {
        aggregateType: 'User',
      };

      const snapshots = await service.querySnapshots(query);

      expect(snapshots).toHaveLength(2);
      expect(snapshots.every(s => s.aggregateType === 'User')).toBe(true);
    });

    it('should query snapshots by version range', async () => {
      const query: SnapshotQuery = {
        minVersion: 100,
        maxVersion: 150,
      };

      const snapshots = await service.querySnapshots(query);

      expect(snapshots).toHaveLength(2);
      expect(snapshots.every(s => s.aggregateVersion >= 100 && s.aggregateVersion <= 150)).toBe(true);
    });

    it('should query snapshots with pagination', async () => {
      const query: SnapshotQuery = {
        limit: 1,
        offset: 0,
      };

      const snapshots = await service.querySnapshots(query);

      expect(snapshots).toHaveLength(1);
    });

    it('should return empty array when no snapshots match query', async () => {
      const query: SnapshotQuery = {
        aggregateId: 'non-existent',
      };

      const snapshots = await service.querySnapshots(query);

      expect(snapshots).toHaveLength(0);
    });
  });

  describe('snapshot deletion', () => {
    it('should delete snapshot successfully', async () => {
      // 创建快照
      const result = await service.createSnapshot(
        'user-123',
        'User',
        { name: 'John Doe' },
        100
      );

      expect(result.success).toBe(true);
      const snapshotId = result.snapshotId!;

      // 删除快照
      const deleteResult = await service.deleteSnapshot(snapshotId);

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.snapshotId).toBe(snapshotId);

      // 验证快照已被删除
      const snapshot = await service.getSnapshot(snapshotId);
      expect(snapshot).toBeNull();

      const stats = service.getStats();
      expect(stats.successfulDeletions).toBe(1);
    });

    it('should handle deletion of non-existent snapshot', async () => {
      const result = await service.deleteSnapshot('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Snapshot not found');

      const stats = service.getStats();
      expect(stats.failedDeletions).toBe(1);
    });

    it('should handle disabled snapshot management for deletion', async () => {
      const disabledService = new SnapshotManagerService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const result = await disabledService.deleteSnapshot('some-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Snapshot management is disabled');
    });
  });

  describe('snapshot cleanup', () => {
    beforeEach(async () => {
      // 创建多个快照用于测试清理
      await service.createSnapshot('user-123', 'User', { name: 'John Doe' }, 100);
      await service.createSnapshot('user-123', 'User', { name: 'John Doe', email: 'john@example.com' }, 200);
      await service.createSnapshot('user-456', 'User', { name: 'Jane Doe' }, 150);
    });

    it('should cleanup snapshots with keep_latest policy', async () => {
      const results = await service.cleanupSnapshots();

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.success)).toBe(true);

      // 验证只保留了最新的快照
      const user123Snapshots = await service.querySnapshots({ aggregateId: 'user-123' });
      expect(user123Snapshots).toHaveLength(1);
      expect(user123Snapshots[0].aggregateVersion).toBe(200);
    });

    it('should handle cleanup with keep_all policy', async () => {
      const keepAllService = new SnapshotManagerService(
        { ...mockConfig, retentionPolicy: 'keep_all' },
        mockEventEmitter,
        mockLogger
      );

      // 创建快照
      await keepAllService.createSnapshot('user-123', 'User', { name: 'John Doe' }, 100);
      await keepAllService.createSnapshot('user-123', 'User', { name: 'John Doe', email: 'john@example.com' }, 200);

      const results = await keepAllService.cleanupSnapshots();

      expect(results).toHaveLength(0); // 不删除任何快照
    });

    it('should handle cleanup with keep_by_count policy', async () => {
      const keepByCountService = new SnapshotManagerService(
        { ...mockConfig, retentionPolicy: 'keep_by_count', retentionCount: 1 },
        mockEventEmitter,
        mockLogger
      );

      // 创建多个快照
      await keepByCountService.createSnapshot('user-123', 'User', { name: 'John Doe' }, 100);
      await keepByCountService.createSnapshot('user-123', 'User', { name: 'John Doe', email: 'john@example.com' }, 200);
      await keepByCountService.createSnapshot('user-123', 'User', { name: 'John Doe', email: 'john@example.com', age: 30 }, 300);

      const results = await keepByCountService.cleanupSnapshots();

      expect(results.length).toBeGreaterThan(0);

      // 验证只保留了指定数量的快照
      const user123Snapshots = await keepByCountService.querySnapshots({ aggregateId: 'user-123' });
      expect(user123Snapshots).toHaveLength(1);
      expect(user123Snapshots[0].aggregateVersion).toBe(300); // 最新版本
    });
  });

  describe('compression and encryption', () => {
    it('should handle compression when enabled', async () => {
      const compressedService = new SnapshotManagerService(
        { ...mockConfig, enableCompression: true },
        mockEventEmitter,
        mockLogger
      );

      const result = await compressedService.createSnapshot(
        'user-123',
        'User',
        { name: 'John Doe', email: 'john@example.com' },
        100
      );

      expect(result.success).toBe(true);

      const snapshot = await compressedService.getSnapshot(result.snapshotId!);
      expect(snapshot).toBeDefined();
      expect(snapshot!.aggregateState).toEqual({ name: 'John Doe', email: 'john@example.com' });
    });

    it('should handle encryption when enabled', async () => {
      const encryptedService = new SnapshotManagerService(
        { ...mockConfig, enableEncryption: true },
        mockEventEmitter,
        mockLogger
      );

      const result = await encryptedService.createSnapshot(
        'user-123',
        'User',
        { name: 'John Doe', email: 'john@example.com' },
        100
      );

      expect(result.success).toBe(true);

      const snapshot = await encryptedService.getSnapshot(result.snapshotId!);
      expect(snapshot).toBeDefined();
      expect(snapshot!.aggregateState).toEqual({ name: 'John Doe', email: 'john@example.com' });
    });
  });

  describe('health check', () => {
    it('should return healthy status when enabled and healthy', async () => {
      const health = await service.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.details.enabled).toBe(true);
      expect(health.details.totalSnapshots).toBe(0);
      expect(health.details.totalStorageSize).toBe(0);
      expect(health.details.errorCount).toBe(0);
      expect(health.details.stats).toBeDefined();
    });

    it('should return disabled status when disabled', async () => {
      const disabledService = new SnapshotManagerService(
        { ...mockConfig, enabled: false },
        mockEventEmitter,
        mockLogger
      );

      const health = await disabledService.getHealth();

      expect(health.status).toBe('disabled');
    });

    it('should return unhealthy when too many errors', async () => {
      // 模拟大量错误
      const errorService = new SnapshotManagerService(
        { ...mockConfig, enableValidation: true },
        mockEventEmitter,
        mockLogger
      );

      // 创建大量无效快照来增加错误计数
      for (let i = 0; i < 150; i++) {
        await errorService.createSnapshot('user-123', 'User', null, i);
      }

      const health = await errorService.getHealth();

      expect(health.status).toBe('unhealthy');
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultConfig = {};
      const defaultService = new SnapshotManagerService(
        defaultConfig,
        mockEventEmitter,
        mockLogger
      );

      expect(defaultService).toBeDefined();
    });

    it('should override default configuration', () => {
      const customConfig = {
        snapshotInterval: 50,
        retentionPolicy: 'keep_by_count' as const,
        retentionCount: 5,
        enableCompression: false,
      };
      const customService = new SnapshotManagerService(
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
        expect.stringContaining('Started snapshot manager monitoring'),
        expect.any(String)
      );
    });

    it('should stop monitoring on destroy', () => {
      service.onDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith('Stopped snapshot manager monitoring', expect.any(String));
      expect(mockLogger.info).toHaveBeenCalledWith('SnapshotManagerService destroyed', expect.any(String));
    });
  });

  describe('error handling', () => {
    it('should handle snapshot creation errors gracefully', async () => {
      // 模拟存储失败
      const largeState = { data: 'x'.repeat(20 * 1024 * 1024) }; // 20MB
      const smallMaxSizeService = new SnapshotManagerService(
        { ...mockConfig, maxSnapshotSize: 1024 }, // 1KB max
        mockEventEmitter,
        mockLogger
      );

      const result = await smallMaxSizeService.createSnapshot(
        'user-123',
        'User',
        largeState,
        100
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Snapshot size exceeds maximum allowed size');
    });

    it('should handle snapshot retrieval errors gracefully', async () => {
      // 模拟获取快照失败
      const snapshot = await service.getSnapshot('invalid-id');
      expect(snapshot).toBeNull();
    });
  });
});
