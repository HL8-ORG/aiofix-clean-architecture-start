import {
  DatabaseConfig,
  DatabaseType,
  ConnectionPoolConfig,
  SSLConfig,
  ValidationResult,
  ConnectionTestResult
} from '../interfaces/database-config.interface';

/**
 * @class PostgreSQLConfig
 * @description
 * PostgreSQL数据库配置实现
 * 
 * 主要功能：
 * 1. PostgreSQL特定的配置选项
 * 2. 连接池优化配置
 * 3. SSL/TLS安全配置
 * 4. 性能调优参数
 * 
 * 使用示例：
 * ```typescript
 * const config = new PostgreSQLConfig({
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'iam_system',
 *   username: 'postgres',
 *   password: 'password',
 *   pool: {
 *     min: 5,
 *     max: 20,
 *     acquireTimeout: 60000,
 *     idleTimeout: 300000
 *   }
 * });
 * ```
 */
export class PostgreSQLConfig implements DatabaseConfig {
  public readonly type: DatabaseType = DatabaseType.POSTGRESQL;
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

  constructor(options: Partial<PostgreSQLConfig>) {
    this.host = options.host || 'localhost';
    this.port = options.port || 5432;
    this.database = options.database || 'postgres';
    this.username = options.username || 'postgres';
    this.password = options.password || '';
    this.pool = options.pool || this.getDefaultPoolConfig();
    this.ssl = options.ssl;
    this.options = options.options || this.getDefaultOptions();
    this.debug = options.debug || false;
    this.connectTimeout = options.connectTimeout || 30000;
    this.queryTimeout = options.queryTimeout || 30000;
  }

  /**
   * 获取默认连接池配置
   */
  private getDefaultPoolConfig(): ConnectionPoolConfig {
    return {
      min: 5,
      max: 20,
      acquireTimeout: 60000,
      idleTimeout: 300000,
      lifetime: 1800000,
      waitForConnections: true,
      queueLimit: 0,
    };
  }

  /**
   * 获取默认PostgreSQL选项
   */
  private getDefaultOptions(): Record<string, any> {
    return {
      // 字符集
      charset: 'utf8',

      // 时区
      timezone: 'UTC',

      // 连接参数
      application_name: 'IAM-System',

      // 查询参数
      statement_timeout: this.queryTimeout,

      // 连接参数
      connect_timeout: this.connectTimeout,

      // 其他PostgreSQL特定参数
      extra_search_path: ['public'],

      // 连接池参数
      pool: {
        min: this.pool?.min || 5,
        max: this.pool?.max || 20,
        acquireTimeoutMillis: this.pool?.acquireTimeout || 60000,
        idleTimeoutMillis: this.pool?.idleTimeout || 300000,
        maxLifetimeMillis: this.pool?.lifetime || 1800000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    };
  }

  /**
   * 获取MikroORM配置
   */
  toMikroOrmConfig(): Record<string, any> {
    const config: Record<string, any> = {
      driver: 'postgresql',
      host: this.host,
      port: this.port,
      dbName: this.database,
      user: this.username,
      password: this.password,
      debug: this.debug,
      options: this.options,
    };

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

    if (this.ssl?.enabled) {
      params.append('sslmode', 'require');
      if (this.ssl.rejectUnauthorized === false) {
        params.append('sslmode', 'no-verify');
      }
    }

    if (this.options?.application_name) {
      params.append('application_name', this.options.application_name);
    }

    const queryString = params.toString();
    const baseUrl = `postgresql://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`;

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * 验证配置
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!this.host || this.host.trim() === '') {
      errors.push('数据库主机不能为空');
    }

    if (!this.port || this.port < 1 || this.port > 65535) {
      errors.push('数据库端口必须在1-65535之间');
    }

    if (!this.database || this.database.trim() === '') {
      errors.push('数据库名称不能为空');
    }

    if (!this.username || this.username.trim() === '') {
      errors.push('用户名不能为空');
    }

    // 验证连接池配置
    if (this.pool) {
      if (this.pool.min && this.pool.max && this.pool.min > this.pool.max) {
        errors.push('连接池最小连接数不能大于最大连接数');
      }

      if (this.pool.max && this.pool.max > 100) {
        warnings.push('连接池最大连接数超过100，可能影响性能');
      }
    }

    // 验证SSL配置
    if (this.ssl?.enabled) {
      if (this.ssl.ca && !this.ssl.cert) {
        warnings.push('配置了CA证书但未配置客户端证书');
      }

      if (this.ssl.cert && !this.ssl.key) {
        errors.push('配置了客户端证书但未配置私钥');
      }
    }

    // 验证超时配置
    if (this.connectTimeout && this.connectTimeout < 1000) {
      warnings.push('连接超时时间过短，可能导致连接失败');
    }

    if (this.queryTimeout && this.queryTimeout < 1000) {
      warnings.push('查询超时时间过短，可能导致查询失败');
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
  clone(overrides: Partial<PostgreSQLConfig>): PostgreSQLConfig {
    return new PostgreSQLConfig({
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
      DB_DEBUG: this.debug?.toString() || 'false',
      DB_CONNECT_TIMEOUT: this.connectTimeout?.toString() || '30000',
      DB_QUERY_TIMEOUT: this.queryTimeout?.toString() || '30000',
    };
  }

  /**
   * 从环境变量创建配置
   */
  static fromEnvironment(): PostgreSQLConfig {
    return new PostgreSQLConfig({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      debug: process.env.DB_DEBUG === 'true',
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    });
  }
}
