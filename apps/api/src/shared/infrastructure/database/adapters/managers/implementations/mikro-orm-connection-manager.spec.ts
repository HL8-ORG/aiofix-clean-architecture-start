import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmConnectionManager } from './mikro-orm-connection-manager';
import { DatabaseType } from '../../../interfaces/database-config.interface';
import type { DatabaseConfig } from '../../../interfaces/database-config.interface';
import type { IMikroOrmAdapter } from '../../interfaces/mikro-orm-adapter.interface';
import { ConnectionStatus } from '../interfaces/mikro-orm-connection-manager.interface';

/**
 * @description
 * MikroORM连接管理器的单元测试
 */
describe('MikroOrmConnectionManager', () => {
  let connectionManager: MikroOrmConnectionManager;
  let mockAdapter: jest.Mocked<IMikroOrmAdapter>;

  const mockPostgreSQLConfig: DatabaseConfig = {
    type: DatabaseType.POSTGRESQL,
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
  };

  const mockMongoDBConfig: DatabaseConfig = {
    type: DatabaseType.MONGODB,
    host: 'localhost',
    port: 27017,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
  };

  beforeEach(async () => {
    // 创建模拟适配器
    mockAdapter = {
      adapterName: 'MockAdapter',
      supportedDatabaseType: DatabaseType.POSTGRESQL,
      createMikroOrmConfig: jest.fn().mockReturnValue({
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        dbName: 'test_db',
        user: 'test_user',
        password: 'test_password',
        entities: [],
        debug: false,
      }),
      getConnectionString: jest.fn().mockReturnValue('postgresql://test_user:test_password@localhost:5432/test_db'),
      getDatabaseSpecificOptions: jest.fn().mockReturnValue({}),
      getConnectionParameters: jest.fn().mockReturnValue({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
      }),
      testConnection: jest.fn().mockResolvedValue(true),
      getOptions: jest.fn().mockReturnValue({ debug: false, logging: true }),
      updateOptions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MikroOrmConnectionManager],
    }).compile();

    connectionManager = module.get<MikroOrmConnectionManager>(MikroOrmConnectionManager);
    connectionManager.setAdapter(mockAdapter);
  });

  afterEach(async () => {
    // 清理所有连接
    await connectionManager.closeAllConnections();
  });

  describe('基本功能', () => {
    it('应该正确初始化', () => {
      expect(connectionManager).toBeDefined();
      expect(connectionManager.getConnectionCount()).toBe(0);
    });

    it('应该设置和获取适配器', () => {
      const adapter = connectionManager.getAdapter(DatabaseType.POSTGRESQL);
      expect(adapter).toBe(mockAdapter);
      expect(adapter?.adapterName).toBe('MockAdapter');
    });

    it('应该检查连接是否存在', () => {
      expect(connectionManager.hasConnection(mockPostgreSQLConfig)).toBe(false);
    });

    it('应该获取连接统计信息', () => {
      const stats = connectionManager.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.failedConnections).toBe(0);
      expect(stats.successRate).toBe(1.0);
    });
  });

  describe('适配器管理', () => {
    it('应该设置适配器', () => {
      const newAdapter = { ...mockAdapter, adapterName: 'NewAdapter' };
      connectionManager.setAdapter(newAdapter);

      const retrievedAdapter = connectionManager.getAdapter(DatabaseType.POSTGRESQL);
      expect(retrievedAdapter?.adapterName).toBe('NewAdapter');
    });

    it('应该返回null当适配器不存在时', () => {
      const adapter = connectionManager.getAdapter(DatabaseType.MONGODB);
      expect(adapter).toBeNull();
    });
  });

  describe('连接信息管理', () => {
    it('应该获取连接信息', () => {
      const info = connectionManager.getConnectionInfo(mockPostgreSQLConfig);
      expect(info).toBeNull();
    });

    it('应该获取所有连接信息', () => {
      const allInfo = connectionManager.getAllConnectionInfo();
      expect(allInfo).toEqual([]);
    });

    it('应该获取连接池信息', () => {
      const poolInfo = connectionManager.getConnectionPoolInfo(mockPostgreSQLConfig);
      expect(poolInfo).toBeNull();
    });
  });

  describe('监控管理', () => {
    it('应该启用监控', () => {
      connectionManager.enableMonitoring(5000);
      expect(connectionManager.isMonitoringEnabled()).toBe(true);
    });

    it('应该禁用监控', () => {
      connectionManager.enableMonitoring();
      connectionManager.disableMonitoring();
      expect(connectionManager.isMonitoringEnabled()).toBe(false);
    });

    it('应该获取监控状态', () => {
      expect(connectionManager.isMonitoringEnabled()).toBe(false);

      connectionManager.enableMonitoring();
      expect(connectionManager.isMonitoringEnabled()).toBe(true);
    });
  });

  describe('连接维护', () => {
    it('应该清理空闲连接', async () => {
      const cleaned = await connectionManager.cleanupIdleConnections();
      expect(cleaned).toBe(0);
    });

    it('应该强制重连', async () => {
      const result = await connectionManager.forceReconnect(mockPostgreSQLConfig);
      expect(result).toBe(false); // 因为没有现有连接
    });
  });

  describe('健康检查', () => {
    it('应该执行健康检查', async () => {
      const healthCheck = await connectionManager.healthCheck(mockPostgreSQLConfig);

      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.error).toBe('没有可用的连接');
      expect(healthCheck.connectionInfo.databaseType).toBe(DatabaseType.POSTGRESQL);
      expect(healthCheck.connectionInfo.status).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('连接池管理', () => {
    it('应该创建连接池', () => {
      const configHash = connectionManager['generateConfigHash'](mockPostgreSQLConfig);
      const pool = connectionManager['createConnectionPool'](mockPostgreSQLConfig, { poolSize: 5 });

      expect(pool.maxConnections).toBe(5);
      expect(pool.minConnections).toBe(1); // 20% of 5
      expect(pool.connections).toEqual([]);
      expect(pool.waitingQueue).toEqual([]);
    });
  });

  describe('配置哈希生成', () => {
    it('应该生成一致的配置哈希', () => {
      const hash1 = connectionManager['generateConfigHash'](mockPostgreSQLConfig);
      const hash2 = connectionManager['generateConfigHash'](mockPostgreSQLConfig);

      expect(hash1).toBe(hash2);
    });

    it('应该为不同配置生成不同哈希', () => {
      const hash1 = connectionManager['generateConfigHash'](mockPostgreSQLConfig);
      const hash2 = connectionManager['generateConfigHash'](mockMongoDBConfig);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('统计信息更新', () => {
    it('应该更新统计信息', () => {
      connectionManager['updateStats']();

      const stats = connectionManager.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
    });

    it('应该更新成功率', () => {
      connectionManager['updateSuccessRate']();

      const stats = connectionManager.getConnectionStats();
      expect(stats.successRate).toBe(1.0);
    });
  });

  describe('监控执行', () => {
    it('应该执行监控', async () => {
      // 模拟监控执行，不应该抛出错误
      await expect(connectionManager['performMonitoring']()).resolves.not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('应该处理适配器不存在的情况', async () => {
      // 移除适配器
      connectionManager['adapters'].clear();

      await expect(connectionManager.createConnection(mockPostgreSQLConfig))
        .rejects.toThrow('未找到数据库类型 postgresql 的适配器');
    });

    it('应该处理连接创建失败', async () => {
      // 模拟连接创建失败
      mockAdapter.createMikroOrmConfig.mockImplementation(() => {
        throw new Error('配置错误');
      });

      await expect(connectionManager.createConnection(mockPostgreSQLConfig))
        .rejects.toThrow('配置错误');
    });
  });

  describe('连接选项', () => {
    it('应该合并默认选项', () => {
      const customOptions = { timeout: 60000, poolSize: 20 };
      const mergedOptions = { ...connectionManager['defaultOptions'], ...customOptions };

      expect(mergedOptions.timeout).toBe(60000);
      expect(mergedOptions.poolSize).toBe(20);
      expect(mergedOptions.retryCount).toBe(3); // 默认值
    });
  });
});
