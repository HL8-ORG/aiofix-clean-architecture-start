import { MongodbMikroOrmAdapter } from './mongodb-mikro-orm.adapter';
import { DatabaseType } from '../../interfaces/database-config.interface';
import { MongoDBConfig } from '../../configs/mongodb.config';
import { MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

describe('MongodbMikroOrmAdapter', () => {
  let adapter: MongodbMikroOrmAdapter;
  let mongoConfig: MongoDBConfig;

  beforeEach(() => {
    adapter = new MongodbMikroOrmAdapter();
    mongoConfig = new MongoDBConfig({
      host: 'localhost',
      port: 27017,
      database: 'test_db',
      username: 'admin',
      password: 'password',
    });
  });

  describe('基本属性', () => {
    it('应该返回正确的数据库类型', () => {
      expect(adapter.supportedDatabaseType).toBe(DatabaseType.MONGODB);
    });

    it('应该返回正确的适配器名称', () => {
      expect(adapter.adapterName).toBe('MongoDB MikroORM Adapter');
    });

    it('应该支持MongoDB数据库类型', () => {
      expect(adapter.supportsDatabaseType(DatabaseType.MONGODB)).toBe(true);
    });

    it('不应该支持其他数据库类型', () => {
      expect(adapter.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(false);
      expect(adapter.supportsDatabaseType(DatabaseType.MYSQL)).toBe(false);
      expect(adapter.supportsDatabaseType(DatabaseType.SQLITE)).toBe(false);
    });
  });

  describe('配置验证', () => {
    it('应该验证MongoDB配置', () => {
      expect(adapter.validateConfig(mongoConfig)).toBe(true);
    });

    it('应该拒绝非MongoDB配置', () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      expect(adapter.validateConfig(pgConfig as any)).toBe(false);
    });
  });

  describe('MikroORM配置创建', () => {
    it('应该创建有效的MikroORM配置', () => {
      const entities = [class TestEntity { }];
      const mikroOrmConfig = adapter.createMikroOrmConfig(mongoConfig, entities);

      expect(mikroOrmConfig.host).toBe('localhost');
      expect(mikroOrmConfig.port).toBe(27017);
      expect(mikroOrmConfig.dbName).toBe('test_db');
      expect(mikroOrmConfig.user).toBe('admin');
      expect(mikroOrmConfig.password).toBe('password');
      expect(mikroOrmConfig.entities).toEqual(entities);
    });

    it('应该使用默认选项', () => {
      const mikroOrmConfig = adapter.createMikroOrmConfig(mongoConfig);
      expect(mikroOrmConfig.debug).toBe(false);
    });

    it('应该使用自定义选项', () => {
      const customOptions: MikroOrmAdapterOptions = {
        debug: true,
        logging: false,
        connectTimeout: 60000,
        queryTimeout: 45000,
      };

      const customAdapter = new MongodbMikroOrmAdapter(customOptions);
      const mikroOrmConfig = customAdapter.createMikroOrmConfig(mongoConfig);

      expect(mikroOrmConfig.debug).toBe(true);
    });

    it('应该抛出错误当配置类型不匹配', () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      expect(() => {
        adapter.createMikroOrmConfig(pgConfig as any);
      }).toThrow('配置类型不匹配，需要MongoDB配置');
    });
  });

  describe('连接字符串', () => {
    it('应该生成正确的连接字符串', () => {
      const connectionString = adapter.getConnectionString(mongoConfig);
      expect(connectionString).toContain('mongodb://admin:password@localhost:27017/test_db');
    });

    it('应该抛出错误当配置类型不匹配', () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      expect(() => {
        adapter.getConnectionString(pgConfig as any);
      }).toThrow('配置类型不匹配，需要MongoDB配置');
    });
  });

  describe('数据库特定选项', () => {
    it('应该返回MongoDB特定选项', () => {
      const options = adapter.getDatabaseSpecificOptions(mongoConfig);

      expect(options.driverOptions).toBeDefined();
      expect(options.driverOptions.connectTimeoutMS).toBe(30000);
      expect(options.driverOptions.socketTimeoutMS).toBe(30000);
      expect(options.driverOptions.maxPoolSize).toBe(10);
      expect(options.driverOptions.minPoolSize).toBe(0);
      expect(options.driverOptions.readPreference).toBe('primary');
      expect(options.driverOptions.writeConcern).toBe('majority');
      expect(options.driverOptions.authSource).toBe('admin');
      expect(options.driverOptions.retryWrites).toBe(true);
      expect(options.driverOptions.retryReads).toBe(true);
      expect(options.driverOptions.compressors).toEqual(['zlib']);
    });

    it('应该包含副本集配置当启用时', () => {
      const replicaSetConfig = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test_db',
        username: 'admin',
        password: 'password',
        replicaSet: 'rs0',
        readPreference: 'secondary',
        writeConcern: '1',
      });

      const options = adapter.getDatabaseSpecificOptions(replicaSetConfig);
      expect(options.replicaSet).toBe('rs0');
      expect(options.readPreference).toBe('secondary');
      expect(options.writeConcern).toBe('1');
      expect(options.driverOptions.replicaSet).toBe('rs0');
      expect(options.driverOptions.directConnection).toBe(false);
    });

    it('应该返回空对象当配置类型不匹配', () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      const options = adapter.getDatabaseSpecificOptions(pgConfig as any);
      expect(options).toEqual({});
    });
  });

  describe('连接参数', () => {
    it('应该返回正确的连接参数', () => {
      const params = adapter.getConnectionParameters(mongoConfig);

      expect(params.host).toBe('localhost');
      expect(params.port).toBe(27017);
      expect(params.database).toBe('test_db');
      expect(params.username).toBe('admin');
      expect(params.password).toBe('password');
      expect(params.authSource).toBe('admin');
      expect(params.readPreference).toBe('primary');
      expect(params.writeConcern).toBe('majority');
      expect(params.maxPoolSize).toBe(10);
      expect(params.minPoolSize).toBe(0);
      expect(params.retryWrites).toBe(true);
      expect(params.retryReads).toBe(true);
      expect(params.compressors).toEqual(['zlib']);
      expect(params.directConnection).toBe(true);
    });

    it('应该包含副本集参数当启用时', () => {
      const replicaSetConfig = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test_db',
        username: 'admin',
        password: 'password',
        replicaSet: 'rs0',
        readPreference: 'secondary',
        writeConcern: '1',
      });

      const params = adapter.getConnectionParameters(replicaSetConfig);
      expect(params.replicaSet).toBe('rs0');
      expect(params.readPreference).toBe('secondary');
      expect(params.writeConcern).toBe('1');
      expect(params.directConnection).toBe(false);
    });

    it('应该返回空对象当配置类型不匹配', () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      const params = adapter.getConnectionParameters(pgConfig as any);
      expect(params).toEqual({});
    });
  });

  describe('MongoDB特定方法', () => {
    it('应该获取MongoDB连接选项', () => {
      const options = adapter.getMongoDBConnectionOptions(mongoConfig);

      expect(options.host).toBe('localhost');
      expect(options.port).toBe(27017);
      expect(options.database).toBe('test_db');
      expect(options.username).toBe('admin');
      expect(options.password).toBe('password');
      expect(options.authSource).toBe('admin');
      expect(options.readPreference).toBe('primary');
      expect(options.writeConcern).toBe('majority');
      expect(options.maxPoolSize).toBe(10);
      expect(options.minPoolSize).toBe(0);
      expect(options.retryWrites).toBe(true);
      expect(options.retryReads).toBe(true);
      expect(options.compressors).toEqual(['zlib']);
    });

    it('应该获取MongoDB查询选项', () => {
      const options = adapter.getMongoDBQueryOptions(mongoConfig);

      expect(options.readPreference).toBe('primary');
      expect(options.writeConcern).toBe('majority');
      expect(options.maxTimeMS).toBe(30000);
      expect(options.retryWrites).toBe(true);
      expect(options.retryReads).toBe(true);
    });

    it('应该处理副本集配置', () => {
      const replicaSetConfig = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test_db',
        username: 'admin',
        password: 'password',
        replicaSet: 'rs0',
        readPreference: 'secondary',
        writeConcern: '1',
      });

      const connectionOptions = adapter.getMongoDBConnectionOptions(replicaSetConfig);
      expect(connectionOptions.replicaSet).toBe('rs0');
      expect(connectionOptions.readPreference).toBe('secondary');
      expect(connectionOptions.writeConcern).toBe('1');
      expect(connectionOptions.directConnection).toBe(false);

      const queryOptions = adapter.getMongoDBQueryOptions(replicaSetConfig);
      expect(queryOptions.readPreference).toBe('secondary');
      expect(queryOptions.writeConcern).toBe('1');
    });
  });

  describe('连接测试', () => {
    it('应该测试MongoDB连接', async () => {
      const result = await adapter.testConnection(mongoConfig);

      expect(result.success).toBe(true);
      expect(result.connectionTime).toBeDefined();
      expect(typeof result.connectionTime).toBe('number');
    });

    it('应该拒绝非MongoDB配置', async () => {
      const pgConfig = {
        type: DatabaseType.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      };

      const result = await adapter.testConnection(pgConfig as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe('配置类型不匹配，需要MongoDB配置');
    });

    it('应该处理配置验证失败', async () => {
      const invalidConfig = new MongoDBConfig({
        host: '',
        port: 0,
        database: '',
        username: '',
        password: 'password', // 有密码但没有用户名，这会导致验证失败
      });

      const result = await adapter.testConnection(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('配置验证失败');
    });
  });

  describe('选项管理', () => {
    it('应该获取当前选项', () => {
      const options = adapter.getOptions();
      expect(options.debug).toBe(false);
      expect(options.logging).toBe(true);
      expect(options.connectTimeout).toBe(30000);
      expect(options.queryTimeout).toBe(30000);
      expect(options.pool?.min).toBe(0);
      expect(options.pool?.max).toBe(10);
    });

    it('应该更新选项', () => {
      adapter.updateOptions({
        debug: true,
        connectTimeout: 60000,
        pool: { min: 5, max: 20 },
      });

      const options = adapter.getOptions();
      expect(options.debug).toBe(true);
      expect(options.connectTimeout).toBe(60000);
      expect(options.pool?.min).toBe(5);
      expect(options.pool?.max).toBe(20);
      expect(options.logging).toBe(true); // 保持不变
    });
  });
});
