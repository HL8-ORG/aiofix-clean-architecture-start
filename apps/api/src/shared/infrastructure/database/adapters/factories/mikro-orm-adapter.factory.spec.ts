import { MikroOrmAdapterFactory } from './mikro-orm-adapter.factory';
import { DatabaseType } from '../../interfaces/database-config.interface';
import { MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

describe('MikroOrmAdapterFactory', () => {
  let factory: MikroOrmAdapterFactory;

  beforeEach(() => {
    factory = new MikroOrmAdapterFactory();
  });

  describe('基本功能', () => {
    it('应该创建PostgreSQL适配器', () => {
      const adapter = factory.createAdapter(DatabaseType.POSTGRESQL);

      expect(adapter).toBeDefined();
      expect(adapter.supportedDatabaseType).toBe(DatabaseType.POSTGRESQL);
      expect(adapter.adapterName).toBe('PostgreSQL MikroORM Adapter');
    });

    it('应该创建MongoDB适配器', () => {
      const adapter = factory.createAdapter(DatabaseType.MONGODB);

      expect(adapter).toBeDefined();
      expect(adapter.supportedDatabaseType).toBe(DatabaseType.MONGODB);
      expect(adapter.adapterName).toBe('MongoDB MikroORM Adapter');
    });

    it('应该抛出错误当数据库类型不支持', () => {
      expect(() => {
        factory.createAdapter(DatabaseType.MYSQL);
      }).toThrow('MySQL适配器暂未实现');
    });
  });

  describe('适配器缓存', () => {
    it('应该缓存已创建的适配器', () => {
      const adapter1 = factory.createAdapter(DatabaseType.POSTGRESQL);
      const adapter2 = factory.createAdapter(DatabaseType.POSTGRESQL);

      expect(adapter1).toBe(adapter2); // 同一个实例
    });

    it('应该更新现有适配器的选项', () => {
      const adapter1 = factory.createAdapter(DatabaseType.POSTGRESQL);
      const options: MikroOrmAdapterOptions = { debug: true };

      const adapter2 = factory.createAdapter(DatabaseType.POSTGRESQL, options);

      expect(adapter1).toBe(adapter2);
      expect(adapter2.getOptions().debug).toBe(true);
    });
  });

  describe('适配器获取', () => {
    it('应该获取已创建的适配器', () => {
      factory.createAdapter(DatabaseType.POSTGRESQL);
      const adapter = factory.getAdapter(DatabaseType.POSTGRESQL);

      expect(adapter).toBeDefined();
      expect(adapter?.supportedDatabaseType).toBe(DatabaseType.POSTGRESQL);
    });

    it('应该返回null当适配器不存在', () => {
      const adapter = factory.getAdapter(DatabaseType.MYSQL);
      expect(adapter).toBeNull();
    });
  });

  describe('适配器注册', () => {
    it('应该注册自定义适配器', () => {
      const customAdapter = factory.createAdapter(DatabaseType.POSTGRESQL);
      factory.registerAdapter(DatabaseType.POSTGRESQL, customAdapter);

      const retrievedAdapter = factory.getAdapter(DatabaseType.POSTGRESQL);
      expect(retrievedAdapter).toBe(customAdapter);
    });

    it('应该验证适配器支持指定的数据库类型', () => {
      const postgresqlAdapter = factory.createAdapter(DatabaseType.POSTGRESQL);

      expect(() => {
        factory.registerAdapter(DatabaseType.MONGODB, postgresqlAdapter);
      }).toThrow('适配器不支持数据库类型: mongodb');
    });
  });

  describe('支持的数据库类型', () => {
    it('应该返回支持的数据库类型列表', () => {
      const supportedTypes = factory.getSupportedDatabaseTypes();

      expect(supportedTypes).toContain(DatabaseType.POSTGRESQL);
      expect(supportedTypes).toContain(DatabaseType.MONGODB);
      expect(supportedTypes.length).toBe(2);
    });

    it('应该检查是否支持指定的数据库类型', () => {
      expect(factory.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(true);
      expect(factory.supportsDatabaseType(DatabaseType.MONGODB)).toBe(true);
      expect(factory.supportsDatabaseType(DatabaseType.MYSQL)).toBe(false);
      expect(factory.supportsDatabaseType(DatabaseType.SQLITE)).toBe(false);
    });
  });

  describe('所有适配器', () => {
    it('应该获取所有适配器', () => {
      factory.createAdapter(DatabaseType.POSTGRESQL);
      factory.createAdapter(DatabaseType.MONGODB);

      const allAdapters = factory.getAllAdapters();

      expect(allAdapters.size).toBe(2);
      expect(allAdapters.has(DatabaseType.POSTGRESQL)).toBe(true);
      expect(allAdapters.has(DatabaseType.MONGODB)).toBe(true);
    });
  });

  describe('默认选项', () => {
    it('应该获取默认选项', () => {
      const defaultOptions = factory.getDefaultOptions();

      expect(defaultOptions.debug).toBe(false);
      expect(defaultOptions.logging).toBe(true);
      expect(defaultOptions.connectTimeout).toBe(30000);
      expect(defaultOptions.queryTimeout).toBe(30000);
      expect(defaultOptions.pool?.min).toBe(5);
      expect(defaultOptions.pool?.max).toBe(20);
    });

    it('应该更新默认选项', () => {
      const newOptions: Partial<MikroOrmAdapterOptions> = {
        debug: true,
        connectTimeout: 60000,
        pool: { min: 10, max: 30 },
      };

      factory.updateDefaultOptions(newOptions);

      const updatedOptions = factory.getDefaultOptions();
      expect(updatedOptions.debug).toBe(true);
      expect(updatedOptions.connectTimeout).toBe(60000);
      expect(updatedOptions.pool?.min).toBe(10);
      expect(updatedOptions.pool?.max).toBe(30);
    });

    it('应该更新所有现有适配器的选项', () => {
      const adapter1 = factory.createAdapter(DatabaseType.POSTGRESQL);
      const adapter2 = factory.createAdapter(DatabaseType.MONGODB);

      const newOptions: Partial<MikroOrmAdapterOptions> = { debug: true };
      factory.updateDefaultOptions(newOptions);

      expect(adapter1.getOptions().debug).toBe(true);
      expect(adapter2.getOptions().debug).toBe(true);
    });
  });

  describe('适配器管理', () => {
    it('应该清除适配器缓存', () => {
      factory.createAdapter(DatabaseType.POSTGRESQL);
      factory.createAdapter(DatabaseType.MONGODB);

      expect(factory.getSupportedDatabaseTypes().length).toBe(2);

      factory.clearAdapters();

      expect(factory.getSupportedDatabaseTypes().length).toBe(0);
    });

    it('应该移除指定的适配器', () => {
      factory.createAdapter(DatabaseType.POSTGRESQL);
      factory.createAdapter(DatabaseType.MONGODB);

      expect(factory.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(true);

      const removed = factory.removeAdapter(DatabaseType.POSTGRESQL);
      expect(removed).toBe(true);
      expect(factory.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(false);
      expect(factory.supportsDatabaseType(DatabaseType.MONGODB)).toBe(true);
    });

    it('应该返回false当移除不存在的适配器', () => {
      const removed = factory.removeAdapter(DatabaseType.MYSQL);
      expect(removed).toBe(false);
    });
  });

  describe('适配器统计', () => {
    it('应该获取适配器统计信息', () => {
      factory.createAdapter(DatabaseType.POSTGRESQL);
      factory.createAdapter(DatabaseType.MONGODB);

      const stats = factory.getAdapterStats();

      expect(stats.totalAdapters).toBe(2);
      expect(stats.supportedTypes).toContain(DatabaseType.POSTGRESQL);
      expect(stats.supportedTypes).toContain(DatabaseType.MONGODB);
      expect(stats.adapterNames).toContain('PostgreSQL MikroORM Adapter');
      expect(stats.adapterNames).toContain('MongoDB MikroORM Adapter');
    });
  });

  describe('自定义选项', () => {
    it('应该使用自定义选项创建适配器', () => {
      const customOptions: MikroOrmAdapterOptions = {
        debug: true,
        logging: false,
        connectTimeout: 60000,
        queryTimeout: 45000,
        pool: { min: 10, max: 30 },
      };

      const adapter = factory.createAdapter(DatabaseType.POSTGRESQL, customOptions);
      const options = adapter.getOptions();

      expect(options.debug).toBe(true);
      expect(options.logging).toBe(false);
      expect(options.connectTimeout).toBe(60000);
      expect(options.queryTimeout).toBe(45000);
      expect(options.pool?.min).toBe(10);
      expect(options.pool?.max).toBe(30);
    });

    it('应该合并默认选项和自定义选项', () => {
      const customOptions: MikroOrmAdapterOptions = {
        debug: true,
        connectTimeout: 60000,
      };

      const adapter = factory.createAdapter(DatabaseType.MONGODB, customOptions);
      const options = adapter.getOptions();

      expect(options.debug).toBe(true);
      expect(options.connectTimeout).toBe(60000);
      expect(options.logging).toBe(true); // 默认值
      expect(options.queryTimeout).toBe(30000); // 默认值
    });
  });

  describe('预创建适配器', () => {
    it('应该在构造函数中预创建默认适配器', () => {
      const newFactory = new MikroOrmAdapterFactory();

      expect(newFactory.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(true);
      expect(newFactory.supportsDatabaseType(DatabaseType.MONGODB)).toBe(true);
      expect(newFactory.getSupportedDatabaseTypes().length).toBe(2);
    });
  });
});
