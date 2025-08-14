import { PostgresqlMikroOrmAdapter } from './postgresql-mikro-orm.adapter';
import { DatabaseType } from '../../interfaces/database-config.interface';
import { PostgreSQLConfig } from '../../configs/postgresql.config';
import { MikroOrmAdapterOptions } from '../interfaces/mikro-orm-adapter.interface';

describe('PostgresqlMikroOrmAdapter', () => {
  let adapter: PostgresqlMikroOrmAdapter;
  let pgConfig: PostgreSQLConfig;

  beforeEach(() => {
    adapter = new PostgresqlMikroOrmAdapter();
    pgConfig = new PostgreSQLConfig({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'postgres',
      password: 'password',
    });
  });

  describe('基本属性', () => {
    it('应该返回正确的数据库类型', () => {
      expect(adapter.supportedDatabaseType).toBe(DatabaseType.POSTGRESQL);
    });

    it('应该返回正确的适配器名称', () => {
      expect(adapter.adapterName).toBe('PostgreSQL MikroORM Adapter');
    });

    it('应该支持PostgreSQL数据库类型', () => {
      expect(adapter.supportsDatabaseType(DatabaseType.POSTGRESQL)).toBe(true);
    });

    it('不应该支持其他数据库类型', () => {
      expect(adapter.supportsDatabaseType(DatabaseType.MONGODB)).toBe(false);
      expect(adapter.supportsDatabaseType(DatabaseType.MYSQL)).toBe(false);
      expect(adapter.supportsDatabaseType(DatabaseType.SQLITE)).toBe(false);
    });
  });

  describe('配置验证', () => {
    it('应该验证PostgreSQL配置', () => {
      expect(adapter.validateConfig(pgConfig)).toBe(true);
    });

    it('应该拒绝非PostgreSQL配置', () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      expect(adapter.validateConfig(mongoConfig as any)).toBe(false);
    });
  });

  describe('MikroORM配置创建', () => {
    it('应该创建有效的MikroORM配置', () => {
      const entities = [class TestEntity { }];
      const mikroOrmConfig = adapter.createMikroOrmConfig(pgConfig, entities);

      expect(mikroOrmConfig.host).toBe('localhost');
      expect(mikroOrmConfig.port).toBe(5432);
      expect(mikroOrmConfig.dbName).toBe('test_db');
      expect(mikroOrmConfig.user).toBe('postgres');
      expect(mikroOrmConfig.password).toBe('password');
      expect(mikroOrmConfig.entities).toEqual(entities);
    });

    it('应该使用默认选项', () => {
      const mikroOrmConfig = adapter.createMikroOrmConfig(pgConfig);
      expect(mikroOrmConfig.debug).toBe(false);
    });

    it('应该使用自定义选项', () => {
      const customOptions: MikroOrmAdapterOptions = {
        debug: true,
        logging: false,
        connectTimeout: 60000,
        queryTimeout: 45000,
      };

      const customAdapter = new PostgresqlMikroOrmAdapter(customOptions);
      const mikroOrmConfig = customAdapter.createMikroOrmConfig(pgConfig);

      expect(mikroOrmConfig.debug).toBe(true);
    });

    it('应该抛出错误当配置类型不匹配', () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      expect(() => {
        adapter.createMikroOrmConfig(mongoConfig as any);
      }).toThrow('配置类型不匹配，需要PostgreSQL配置');
    });
  });

  describe('连接字符串', () => {
    it('应该生成正确的连接字符串', () => {
      const connectionString = adapter.getConnectionString(pgConfig);
      expect(connectionString).toContain('postgresql://postgres:password@localhost:5432/test_db');
    });

    it('应该抛出错误当配置类型不匹配', () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      expect(() => {
        adapter.getConnectionString(mongoConfig as any);
      }).toThrow('配置类型不匹配，需要PostgreSQL配置');
    });
  });

  describe('数据库特定选项', () => {
    it('应该返回PostgreSQL特定选项', () => {
      const options = adapter.getDatabaseSpecificOptions(pgConfig);

      expect(options.driverOptions).toBeDefined();
      expect(options.driverOptions.connection).toBeDefined();
      expect(options.driverOptions.connection.application_name).toBe('IAM-System');
      expect(options.driverOptions.connection.client_encoding).toBe('utf8');
      expect(options.driverOptions.connection.timezone).toBe('UTC');
    });

    it('应该包含SSL配置当启用时', () => {
      const sslConfig = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'postgres',
        password: 'password',
        ssl: {
          enabled: true,
          rejectUnauthorized: false,
          ca: '/path/to/ca.crt',
          cert: '/path/to/cert.crt',
          key: '/path/to/key.key',
        },
      });

      const options = adapter.getDatabaseSpecificOptions(sslConfig);
      expect(options.ssl).toBeDefined();
      expect(options.ssl.rejectUnauthorized).toBe(false);
      expect(options.ssl.ca).toBe('/path/to/ca.crt');
      expect(options.ssl.cert).toBe('/path/to/cert.crt');
      expect(options.ssl.key).toBe('/path/to/key.key');
    });

    it('应该返回空对象当配置类型不匹配', () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      const options = adapter.getDatabaseSpecificOptions(mongoConfig as any);
      expect(options).toEqual({});
    });
  });

  describe('连接参数', () => {
    it('应该返回正确的连接参数', () => {
      const params = adapter.getConnectionParameters(pgConfig);

      expect(params.host).toBe('localhost');
      expect(params.port).toBe(5432);
      expect(params.database).toBe('test_db');
      expect(params.user).toBe('postgres');
      expect(params.password).toBe('password');
      expect(params.ssl).toBe(false);
      expect(params.application_name).toBe('IAM-System');
      expect(params.client_encoding).toBe('utf8');
      expect(params.timezone).toBe('UTC');
    });

    it('应该包含SSL参数当启用时', () => {
      const sslConfig = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'postgres',
        password: 'password',
        ssl: {
          enabled: true,
          rejectUnauthorized: false,
          ca: '/path/to/ca.crt',
          cert: '/path/to/cert.crt',
          key: '/path/to/key.key',
        },
      });

      const params = adapter.getConnectionParameters(sslConfig);
      expect(params.ssl).toBeDefined();
      expect(params.ssl.rejectUnauthorized).toBe(false);
      expect(params.ssl.ca).toBe('/path/to/ca.crt');
      expect(params.ssl.cert).toBe('/path/to/cert.crt');
      expect(params.ssl.key).toBe('/path/to/key.key');
    });

    it('应该返回空对象当配置类型不匹配', () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      const params = adapter.getConnectionParameters(mongoConfig as any);
      expect(params).toEqual({});
    });
  });

  describe('连接测试', () => {
    it('应该测试PostgreSQL连接', async () => {
      const result = await adapter.testConnection(pgConfig);

      expect(result.success).toBe(true);
      expect(result.connectionTime).toBeDefined();
      expect(typeof result.connectionTime).toBe('number');
    });

    it('应该拒绝非PostgreSQL配置', async () => {
      const mongoConfig = {
        type: DatabaseType.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: '',
        password: '',
      };

      const result = await adapter.testConnection(mongoConfig as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe('配置类型不匹配，需要PostgreSQL配置');
    });

    it('应该处理配置验证失败', async () => {
      const invalidConfig = new PostgreSQLConfig({
        host: '   ',
        port: 0,
        database: '   ',
        username: '   ',
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
    });

    it('应该更新选项', () => {
      adapter.updateOptions({
        debug: true,
        connectTimeout: 60000,
      });

      const options = adapter.getOptions();
      expect(options.debug).toBe(true);
      expect(options.connectTimeout).toBe(60000);
      expect(options.logging).toBe(true); // 保持不变
    });
  });
});
