import {
  DatabaseConfig,
  DatabaseType,
  ConnectionPoolConfig,
  SSLConfig,
  ValidationResult,
  ConnectionTestResult
} from '../interfaces/database-config.interface';

/**
 * @class MongoDBConfig
 * @description
 * MongoDB数据库配置实现
 * 
 * 主要功能：
 * 1. MongoDB特定的配置选项
 * 2. 副本集和分片集群支持
 * 3. 认证和授权配置
 * 4. 连接池和性能优化
 * 
 * 使用示例：
 * ```typescript
 * const config = new MongoDBConfig({
 *   host: 'localhost',
 *   port: 27017,
 *   database: 'iam_system',
 *   username: 'admin',
 *   password: 'password',
 *   authSource: 'admin',
 *   replicaSet: 'rs0'
 * });
 * ```
 */
export class MongoDBConfig implements DatabaseConfig {
  public readonly type: DatabaseType = DatabaseType.MONGODB;
  public readonly host: string;
  public readonly port: number;
  public readonly database: string;
  public readonly username: string;
  public readonly password: string;
  public readonly pool?: ConnectionPoolConfig;
  public readonly ssl?: SSLConfig;
  public readonly options?: Record<string, any>;
  public readonly debug?: boolean;
  public readonly connectTimeout?: number;
  public readonly queryTimeout?: number;

  // MongoDB特定配置
  public readonly authSource?: string;
  public readonly replicaSet?: string;
  public readonly readPreference?: string;
  public readonly writeConcern?: string;
  public readonly maxPoolSize?: number;
  public readonly minPoolSize?: number;
  public readonly maxIdleTimeMS?: number;
  public readonly serverSelectionTimeoutMS?: number;
  public readonly heartbeatFrequencyMS?: number;

  constructor(options: Partial<MongoDBConfig>) {
    this.host = options.host || 'localhost';
    this.port = options.port || 27017;
    this.database = options.database || 'test';
    this.username = options.username || '';
    this.password = options.password || '';
    this.pool = options.pool || this.getDefaultPoolConfig();
    this.ssl = options.ssl;
    this.options = options.options || this.getDefaultOptions();
    this.debug = options.debug || false;
    this.connectTimeout = options.connectTimeout || 30000;
    this.queryTimeout = options.queryTimeout || 30000;

    // MongoDB特定配置
    this.authSource = options.authSource || 'admin';
    this.replicaSet = options.replicaSet;
    this.readPreference = options.readPreference || 'primary';
    this.writeConcern = options.writeConcern || 'majority';
    this.maxPoolSize = options.maxPoolSize || 10;
    this.minPoolSize = options.minPoolSize || 0;
    this.maxIdleTimeMS = options.maxIdleTimeMS || 30000;
    this.serverSelectionTimeoutMS = options.serverSelectionTimeoutMS || 30000;
    this.heartbeatFrequencyMS = options.heartbeatFrequencyMS || 10000;
  }

  /**
   * 获取默认连接池配置
   */
  private getDefaultPoolConfig(): ConnectionPoolConfig {
    return {
      min: 0,
      max: 10,
      acquireTimeout: 30000,
      idleTimeout: 30000,
      lifetime: 300000,
      waitForConnections: true,
      queueLimit: 0,
    };
  }

  /**
   * 获取默认MongoDB选项
   */
  private getDefaultOptions(): Record<string, any> {
    return {
      // 连接选项
      connectTimeoutMS: this.connectTimeout,
      socketTimeoutMS: this.queryTimeout,

      // 连接池选项
      maxPoolSize: this.maxPoolSize,
      minPoolSize: this.minPoolSize,
      maxIdleTimeMS: this.maxIdleTimeMS,

      // 服务器选择选项
      serverSelectionTimeoutMS: this.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: this.heartbeatFrequencyMS,

      // 读写偏好
      readPreference: this.readPreference,
      writeConcern: this.writeConcern,

      // 认证选项
      authSource: this.authSource,

      // 副本集选项
      ...(this.replicaSet && { replicaSet: this.replicaSet }),

      // 重试选项
      retryWrites: true,
      retryReads: true,

      // 压缩选项
      compressors: ['zlib'],

      // 其他选项
      directConnection: !this.replicaSet,
      maxConnecting: 2,
    };
  }

  /**
   * 获取MikroORM配置
   */
  toMikroOrmConfig(): Record<string, any> {
    const config: Record<string, any> = {
      driver: 'mongo',
      host: this.host,
      port: this.port,
      dbName: this.database,
      user: this.username,
      password: this.password,
      debug: this.debug,
      options: this.options,
    };

    // 添加认证源
    if (this.authSource) {
      config.authSource = this.authSource;
    }

    // 添加副本集配置
    if (this.replicaSet) {
      config.replicaSet = this.replicaSet;
    }

    // 添加SSL配置
    if (this.ssl?.enabled) {
      config.ssl = {
        rejectUnauthorized: this.ssl.rejectUnauthorized ?? true,
        ca: this.ssl.ca,
        cert: this.ssl.cert,
        key: this.ssl.key,
      };
    }

    return config;
  }

  /**
   * 获取连接字符串
   */
  getConnectionString(): string {
    const params = new URLSearchParams();

    // 添加认证源
    if (this.authSource && this.authSource !== 'admin') {
      params.append('authSource', this.authSource);
    }

    // 添加副本集
    if (this.replicaSet) {
      params.append('replicaSet', this.replicaSet);
    }

    // 添加读写偏好
    if (this.readPreference && this.readPreference !== 'primary') {
      params.append('readPreference', this.readPreference);
    }

    // 添加写入关注
    if (this.writeConcern && this.writeConcern !== 'majority') {
      params.append('w', this.writeConcern);
    }

    // 添加连接池大小
    if (this.maxPoolSize && this.maxPoolSize !== 10) {
      params.append('maxPoolSize', this.maxPoolSize.toString());
    }

    // 添加SSL配置
    if (this.ssl?.enabled) {
      params.append('ssl', 'true');
      if (this.ssl.rejectUnauthorized === false) {
        params.append('sslValidate', 'false');
      }
    }

    const queryString = params.toString();
    const credentials = this.username && this.password
      ? `${this.username}:${this.password}@`
      : '';
    const baseUrl = `mongodb://${credentials}${this.host}:${this.port}/${this.database}`;

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * 验证配置
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!this.host) {
      errors.push('数据库主机不能为空');
    }

    if (!this.port || this.port < 1 || this.port > 65535) {
      errors.push('数据库端口必须在1-65535之间');
    }

    if (!this.database) {
      errors.push('数据库名称不能为空');
    }

    // MongoDB用户名和密码可以为空（本地认证）
    if (this.username && !this.password) {
      warnings.push('配置了用户名但未配置密码');
    }

    if (!this.username && this.password) {
      errors.push('配置了密码但未配置用户名');
    }

    // 验证连接池配置
    if (this.maxPoolSize && this.minPoolSize && this.minPoolSize > this.maxPoolSize) {
      errors.push('连接池最小连接数不能大于最大连接数');
    }

    if (this.maxPoolSize && this.maxPoolSize > 100) {
      warnings.push('连接池最大连接数超过100，可能影响性能');
    }

    // 验证超时配置
    if (this.connectTimeout && this.connectTimeout < 1000) {
      warnings.push('连接超时时间过短，可能导致连接失败');
    }

    if (this.queryTimeout && this.queryTimeout < 1000) {
      warnings.push('查询超时时间过短，可能导致查询失败');
    }

    // 验证读写偏好
    const validReadPreferences = ['primary', 'primaryPreferred', 'secondary', 'secondaryPreferred', 'nearest'];
    if (this.readPreference && !validReadPreferences.includes(this.readPreference)) {
      errors.push(`无效的读取偏好: ${this.readPreference}`);
    }

    // 验证写入关注
    const validWriteConcerns = ['majority', '1', '2', '3', '4', '5'];
    if (this.writeConcern && !validWriteConcerns.includes(this.writeConcern)) {
      errors.push(`无效的写入关注: ${this.writeConcern}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 克隆配置
   */
  clone(overrides: Partial<MongoDBConfig>): MongoDBConfig {
    return new MongoDBConfig({
      host: this.host,
      port: this.port,
      database: this.database,
      username: this.username,
      password: this.password,
      pool: this.pool,
      ssl: this.ssl,
      options: this.options,
      debug: this.debug,
      connectTimeout: this.connectTimeout,
      queryTimeout: this.queryTimeout,
      authSource: this.authSource,
      replicaSet: this.replicaSet,
      readPreference: this.readPreference,
      writeConcern: this.writeConcern,
      maxPoolSize: this.maxPoolSize,
      minPoolSize: this.minPoolSize,
      maxIdleTimeMS: this.maxIdleTimeMS,
      serverSelectionTimeoutMS: this.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: this.heartbeatFrequencyMS,
      ...overrides,
    });
  }

  /**
   * 转换为环境变量格式
   */
  toEnvironmentVariables(): Record<string, string> {
    return {
      DB_TYPE: this.type,
      DB_HOST: this.host,
      DB_PORT: this.port.toString(),
      DB_NAME: this.database,
      DB_USERNAME: this.username,
      DB_PASSWORD: this.password,
      DB_AUTH_SOURCE: this.authSource || 'admin',
      DB_REPLICA_SET: this.replicaSet || '',
      DB_READ_PREFERENCE: this.readPreference || 'primary',
      DB_WRITE_CONCERN: this.writeConcern || 'majority',
      DB_MAX_POOL_SIZE: this.maxPoolSize?.toString() || '10',
      DB_MIN_POOL_SIZE: this.minPoolSize?.toString() || '0',
      DB_DEBUG: this.debug?.toString() || 'false',
      DB_CONNECT_TIMEOUT: this.connectTimeout?.toString() || '30000',
      DB_QUERY_TIMEOUT: this.queryTimeout?.toString() || '30000',
    };
  }

  /**
   * 从环境变量创建配置
   */
  static fromEnvironment(): MongoDBConfig {
    return new MongoDBConfig({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '27017', 10),
      database: process.env.DB_NAME || 'test',
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      authSource: process.env.DB_AUTH_SOURCE || 'admin',
      replicaSet: process.env.DB_REPLICA_SET || undefined,
      readPreference: process.env.DB_READ_PREFERENCE || 'primary',
      writeConcern: process.env.DB_WRITE_CONCERN || 'majority',
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '0', 10),
      debug: process.env.DB_DEBUG === 'true',
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    });
  }
}
