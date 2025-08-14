import { DatabaseConfig } from './configs/database.config';

describe('DatabaseConfig Application', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getPostgreSQLConfig', () => {
    it('should create PostgreSQL config from environment variables', () => {
      process.env.DATABASE_HOST = 'test-host';
      process.env.DATABASE_PORT = '5433';
      process.env.DATABASE_NAME = 'test_db';
      process.env.DATABASE_USER = 'test_user';
      process.env.DATABASE_PASSWORD = 'test_password';
      process.env.NODE_ENV = 'development';

      const config = DatabaseConfig.getPostgreSQLConfig();

      expect(config.host).toBe('test-host');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('test_db');
      expect(config.username).toBe('test_user');
      expect(config.password).toBe('test_password');
      expect(config.debug).toBe(true);
    });

    it('should create PostgreSQL config from DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5433/dbname?debug=true';

      const config = DatabaseConfig.getPostgreSQLConfig();

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('dbname');
      expect(config.username).toBe('user');
      expect(config.password).toBe('pass');
      expect(config.debug).toBe(true);
    });

    it('should use default values when environment variables are not set', () => {
      const config = DatabaseConfig.getPostgreSQLConfig();

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('iam_db');
      expect(config.username).toBe('postgres');
      expect(config.password).toBe('postgres');
    });
  });

  describe('getMongoDBConfig', () => {
    it('should create MongoDB config from environment variables', () => {
      process.env.DATABASE_HOST = 'mongo-host';
      process.env.DATABASE_PORT = '27018';
      process.env.DATABASE_NAME = 'mongo_db';
      process.env.DATABASE_USER = 'mongo_user';
      process.env.DATABASE_PASSWORD = 'mongo_password';
      process.env.DB_AUTH_SOURCE = 'admin';
      process.env.DB_REPLICA_SET = 'rs0';

      const config = DatabaseConfig.getMongoDBConfig();

      expect(config.host).toBe('mongo-host');
      expect(config.port).toBe(27018);
      expect(config.database).toBe('mongo_db');
      expect(config.username).toBe('mongo_user');
      expect(config.password).toBe('mongo_password');
      expect(config.authSource).toBe('admin');
      expect(config.replicaSet).toBe('rs0');
    });

    it('should create MongoDB config from DATABASE_URL', () => {
      process.env.DATABASE_URL = 'mongodb://user:pass@localhost:27018/dbname?authSource=admin&replicaSet=rs0';

      const config = DatabaseConfig.getMongoDBConfig();

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(27018);
      expect(config.database).toBe('dbname');
      expect(config.username).toBe('user');
      expect(config.password).toBe('pass');
      expect(config.authSource).toBe('admin');
      expect(config.replicaSet).toBe('rs0');
    });
  });

  describe('getConfig', () => {
    it('should return PostgreSQL config by default', () => {
      const config = DatabaseConfig.getConfig();
      expect(config.type).toBe('postgresql');
    });

    it('should return PostgreSQL config when DATABASE_TYPE is postgresql', () => {
      process.env.DATABASE_TYPE = 'postgresql';
      const config = DatabaseConfig.getConfig();
      expect(config.type).toBe('postgresql');
    });

    it('should return PostgreSQL config when DATABASE_TYPE is postgres', () => {
      process.env.DATABASE_TYPE = 'postgres';
      const config = DatabaseConfig.getConfig();
      expect(config.type).toBe('postgresql');
    });

    it('should return MongoDB config when DATABASE_TYPE is mongodb', () => {
      process.env.DATABASE_TYPE = 'mongodb';
      const config = DatabaseConfig.getConfig();
      expect(config.type).toBe('mongodb');
    });

    it('should return MongoDB config when DATABASE_TYPE is mongo', () => {
      process.env.DATABASE_TYPE = 'mongo';
      const config = DatabaseConfig.getConfig();
      expect(config.type).toBe('mongodb');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return development config when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const config = DatabaseConfig.getEnvironmentConfig();
      expect(config.type).toBe('postgresql');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(25432);
      expect(config.database).toBe('iam_db');
      expect(config.debug).toBe(true);
    });

    it('should return test config when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const config = DatabaseConfig.getEnvironmentConfig();
      expect(config.type).toBe('postgresql');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(25432);
      expect(config.database).toBe('iam_test_db');
      expect(config.debug).toBe(false);
    });

    it('should return production config when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_HOST = 'prod-host';
      process.env.DATABASE_PORT = '5432';
      process.env.DATABASE_NAME = 'prod_db';
      process.env.DATABASE_USER = 'prod_user';
      process.env.DATABASE_PASSWORD = 'prod_password';

      const config = DatabaseConfig.getEnvironmentConfig();
      expect(config.type).toBe('postgresql');
      expect(config.host).toBe('prod-host');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('prod_db');
      expect(config.username).toBe('prod_user');
      expect(config.password).toBe('prod_password');
      expect(config.debug).toBe(false);
      expect(config.ssl?.enabled).toBe(true);
    });

    it('should return development config when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const config = DatabaseConfig.getEnvironmentConfig();
      expect(config.type).toBe('postgresql');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(25432);
      expect(config.database).toBe('iam_db');
    });
  });

  describe('URL parsing', () => {
    it('should parse PostgreSQL URL with query parameters', () => {
      const url = 'postgresql://user:pass@localhost:5433/dbname?debug=true&connect_timeout=60000&query_timeout=45000';

      // 模拟环境变量
      process.env.DATABASE_URL = url;

      const config = DatabaseConfig.getPostgreSQLConfig();

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('dbname');
      expect(config.username).toBe('user');
      expect(config.password).toBe('pass');
      expect(config.debug).toBe(true);
      expect(config.connectTimeout).toBe(60000);
      expect(config.queryTimeout).toBe(45000);
    });

    it('should parse MongoDB URL with query parameters', () => {
      const url = 'mongodb://user:pass@localhost:27018/dbname?authSource=admin&replicaSet=rs0&readPreference=secondary&w=1&maxPoolSize=20&minPoolSize=5';

      // 模拟环境变量
      process.env.DATABASE_URL = url;

      const config = DatabaseConfig.getMongoDBConfig();

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(27018);
      expect(config.database).toBe('dbname');
      expect(config.username).toBe('user');
      expect(config.password).toBe('pass');
      expect(config.authSource).toBe('admin');
      expect(config.replicaSet).toBe('rs0');
      expect(config.readPreference).toBe('secondary');
      expect(config.writeConcern).toBe('1');
      expect(config.maxPoolSize).toBe(20);
      expect(config.minPoolSize).toBe(5);
    });

    it('should throw error for invalid PostgreSQL URL', () => {
      process.env.DATABASE_URL = 'invalid-url';

      expect(() => {
        DatabaseConfig.getPostgreSQLConfig();
      }).toThrow('无效的PostgreSQL连接字符串');
    });

    it('should throw error for invalid MongoDB URL', () => {
      process.env.DATABASE_URL = 'invalid-url';

      expect(() => {
        DatabaseConfig.getMongoDBConfig();
      }).toThrow('无效的MongoDB连接字符串');
    });
  });
});
