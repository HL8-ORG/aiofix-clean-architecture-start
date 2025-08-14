import {
  DatabaseType,
  PostgreSQLConfig,
  MongoDBConfig,
  DatabaseConfigFactoryImpl
} from './index';

describe('Database Configuration', () => {
  describe('PostgreSQLConfig', () => {
    it('should create PostgreSQL config with default values', () => {
      const config = new PostgreSQLConfig({});

      expect(config.type).toBe(DatabaseType.POSTGRESQL);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('postgres');
      expect(config.username).toBe('postgres');
      expect(config.password).toBe('');
      expect(config.debug).toBe(false);
    });

    it('should create PostgreSQL config with custom values', () => {
      const config = new PostgreSQLConfig({
        host: 'db.example.com',
        port: 5433,
        database: 'iam_system',
        username: 'admin',
        password: 'secret',
        debug: true,
      });

      expect(config.host).toBe('db.example.com');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('iam_system');
      expect(config.username).toBe('admin');
      expect(config.password).toBe('secret');
      expect(config.debug).toBe(true);
    });

    it('should validate PostgreSQL config correctly', () => {
      const validConfig = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const validation = validConfig.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const invalidConfig = new PostgreSQLConfig({
        host: '   ', // 空格字符串
        port: 0,
        database: '   ', // 空格字符串
        username: '   ', // 空格字符串
      });

      const validation = invalidConfig.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should generate MikroORM config', () => {
      const config = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const mikroOrmConfig = config.toMikroOrmConfig();
      expect(mikroOrmConfig.type).toBe('postgresql');
      expect(mikroOrmConfig.host).toBe('localhost');
      expect(mikroOrmConfig.port).toBe(5432);
      expect(mikroOrmConfig.dbName).toBe('test');
      expect(mikroOrmConfig.user).toBe('postgres');
      expect(mikroOrmConfig.password).toBe('password');
    });

    it('should generate connection string', () => {
      const config = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const connectionString = config.getConnectionString();
      expect(connectionString).toContain('postgresql://postgres:password@localhost:5432/test');
    });

    it('should clone config with overrides', () => {
      const originalConfig = new PostgreSQLConfig({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const clonedConfig = originalConfig.clone({
        host: 'newhost',
        port: 5433,
      });

      expect(clonedConfig.host).toBe('newhost');
      expect(clonedConfig.port).toBe(5433);
      expect(clonedConfig.database).toBe('test'); // 保持不变
      expect(clonedConfig.username).toBe('postgres'); // 保持不变
    });
  });

  describe('MongoDBConfig', () => {
    it('should create MongoDB config with default values', () => {
      const config = new MongoDBConfig({});

      expect(config.type).toBe(DatabaseType.MONGODB);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(27017);
      expect(config.database).toBe('test');
      expect(config.username).toBe('');
      expect(config.password).toBe('');
      expect(config.authSource).toBe('admin');
      expect(config.readPreference).toBe('primary');
      expect(config.writeConcern).toBe('majority');
    });

    it('should create MongoDB config with custom values', () => {
      const config = new MongoDBConfig({
        host: 'mongo.example.com',
        port: 27018,
        database: 'iam_system',
        username: 'admin',
        password: 'secret',
        authSource: 'admin',
        replicaSet: 'rs0',
        readPreference: 'secondary',
        writeConcern: '1',
      });

      expect(config.host).toBe('mongo.example.com');
      expect(config.port).toBe(27018);
      expect(config.database).toBe('iam_system');
      expect(config.username).toBe('admin');
      expect(config.password).toBe('secret');
      expect(config.authSource).toBe('admin');
      expect(config.replicaSet).toBe('rs0');
      expect(config.readPreference).toBe('secondary');
      expect(config.writeConcern).toBe('1');
    });

    it('should validate MongoDB config correctly', () => {
      const validConfig = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'admin',
        password: 'password',
      });

      const validation = validConfig.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect MongoDB validation errors', () => {
      const invalidConfig = new MongoDBConfig({
        host: '',
        port: 0,
        database: '',
        readPreference: 'invalid',
        writeConcern: 'invalid',
      });

      const validation = invalidConfig.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should generate MikroORM config', () => {
      const config = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'admin',
        password: 'password',
        authSource: 'admin',
      });

      const mikroOrmConfig = config.toMikroOrmConfig();
      expect(mikroOrmConfig.type).toBe('mongo');
      expect(mikroOrmConfig.host).toBe('localhost');
      expect(mikroOrmConfig.port).toBe(27017);
      expect(mikroOrmConfig.dbName).toBe('test');
      expect(mikroOrmConfig.user).toBe('admin');
      expect(mikroOrmConfig.password).toBe('password');
      expect(mikroOrmConfig.authSource).toBe('admin');
    });

    it('should generate connection string', () => {
      const config = new MongoDBConfig({
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'admin',
        password: 'password',
        authSource: 'admin',
      });

      const connectionString = config.getConnectionString();
      expect(connectionString).toContain('mongodb://admin:password@localhost:27017/test');
    });
  });

  describe('DatabaseConfigFactoryImpl', () => {
    let factory: DatabaseConfigFactoryImpl;

    beforeEach(() => {
      factory = new DatabaseConfigFactoryImpl();
    });

    it('should create PostgreSQL config', () => {
      const config = factory.createConfig(DatabaseType.POSTGRESQL, {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      expect(config).toBeInstanceOf(PostgreSQLConfig);
      expect(config.type).toBe(DatabaseType.POSTGRESQL);
    });

    it('should create MongoDB config', () => {
      const config = factory.createConfig(DatabaseType.MONGODB, {
        host: 'localhost',
        port: 27017,
        database: 'test',
        username: 'admin',
        password: 'password',
      });

      expect(config).toBeInstanceOf(MongoDBConfig);
      expect(config.type).toBe(DatabaseType.MONGODB);
    });

    it('should throw error for unsupported database type', () => {
      expect(() => {
        factory.createConfig(DatabaseType.MYSQL, {});
      }).toThrow('MySQL配置暂未实现');
    });

    it('should validate config correctly', () => {
      const config = factory.createConfig(DatabaseType.POSTGRESQL, {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const validation = factory.validateConfig(config);
      expect(validation.isValid).toBe(true);
    });

    it('should get supported database types', () => {
      const supportedTypes = factory.getSupportedDatabaseTypes();
      expect(supportedTypes).toContain(DatabaseType.POSTGRESQL);
      expect(supportedTypes).toContain(DatabaseType.MONGODB);
      expect(supportedTypes).not.toContain(DatabaseType.MYSQL);
    });

    it('should check if database type is supported', () => {
      expect(factory.isDatabaseTypeSupported(DatabaseType.POSTGRESQL)).toBe(true);
      expect(factory.isDatabaseTypeSupported(DatabaseType.MONGODB)).toBe(true);
      expect(factory.isDatabaseTypeSupported(DatabaseType.MYSQL)).toBe(false);
    });

    it('should get default config', () => {
      const pgConfig = factory.getDefaultConfig(DatabaseType.POSTGRESQL);
      expect(pgConfig).toBeInstanceOf(PostgreSQLConfig);

      const mongoConfig = factory.getDefaultConfig(DatabaseType.MONGODB);
      expect(mongoConfig).toBeInstanceOf(MongoDBConfig);
    });

    it('should merge configs correctly', () => {
      const baseConfig = factory.createConfig(DatabaseType.POSTGRESQL, {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'postgres',
        password: 'password',
      });

      const mergedConfig = factory.mergeConfig(baseConfig, {
        host: 'newhost',
        port: 5433,
      });

      expect(mergedConfig.host).toBe('newhost');
      expect(mergedConfig.port).toBe(5433);
      expect(mergedConfig.database).toBe('test'); // 保持不变
    });

    it('should throw error when merging different database types', () => {
      const pgConfig = factory.createConfig(DatabaseType.POSTGRESQL, {});
      const mongoConfig = factory.createConfig(DatabaseType.MONGODB, {});

      expect(() => {
        factory.mergeConfig(pgConfig, { type: DatabaseType.MONGODB });
      }).toThrow('无法合并不同类型的数据库配置');
    });
  });
});
