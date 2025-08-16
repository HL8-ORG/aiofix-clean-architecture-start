/**
 * @file login-request.dto.ts
 * @description 登录请求数据传输对象
 * 
 * 该DTO定义了用户登录用例的输入数据结构，包含登录所需的所有参数。
 * 遵循Clean Architecture原则，作为用例层的输入契约。
 * 
 * 主要功能：
 * - 定义登录请求的数据结构
 * - 提供数据验证规则
 * - 支持多因子认证
 * - 支持多租户登录
 * 
 * 架构特点：
 * - 遵循DTO设计模式
 * - 包含完整的数据验证
 * - 支持扩展性设计
 * - 提供清晰的类型定义
 */

/**
 * @class LoginRequestDto
 * @description 登录请求数据传输对象类
 * 
 * 该DTO封装了用户登录所需的所有信息，包括用户凭据、多因子认证、
 * 会话配置和安全上下文等。是登录用例的输入契约。
 * 
 * 主要原理与机制如下：
 * 1. 定义登录请求的完整数据结构
 * 2. 提供数据验证和类型安全
 * 3. 支持多因子认证和会话配置
 * 4. 包含安全审计所需的信息
 * 5. 支持多租户环境下的登录
 * 
 * 数据验证规则：
 * - 用户名或邮箱不能为空
 * - 密码不能为空
 * - 用户名或邮箱长度限制
 * - 密码长度限制
 * - 多因子认证代码格式验证
 * - IP地址格式验证
 * 
 * 安全特性：
 * - 敏感信息不记录日志
 * - 支持IP地址和用户代理记录
 * - 支持会话配置和安全策略
 * - 支持多租户隔离
 */
export class LoginRequestDto {
  /**
   * @property usernameOrEmail
   * @description 用户名或邮箱地址
   * 
   * 用户可以使用用户名或邮箱地址进行登录，系统会自动识别格式。
   * 支持邮箱格式：user@example.com
   * 支持用户名格式：username
   */
  readonly usernameOrEmail: string;

  /**
   * @property password
   * @description 用户密码
   * 
   * 用户登录密码，系统会进行安全验证。
   * 密码长度：8-128个字符
   * 密码复杂度：包含字母、数字和特殊字符
   */
  readonly password: string;

  /**
   * @property tenantId
   * @description 租户ID（可选）
   * 
   * 在多租户环境中指定要登录的租户。
   * 如果不指定，系统会尝试在所有可访问的租户中查找用户。
   */
  readonly tenantId?: string;

  /**
   * @property rememberMe
   * @description 记住登录状态
   * 
   * 是否记住用户的登录状态，影响会话的过期时间。
   * true: 长期会话（30天）
   * false: 短期会话（1小时）
   */
  readonly rememberMe: boolean;

  /**
   * @property mfaCode
   * @description 多因子认证代码（可选）
   * 
   * 当用户启用多因子认证时，需要提供额外的认证代码。
   * 支持TOTP、SMS、Email等多种认证方式。
   */
  readonly mfaCode?: string;

  /**
   * @property ipAddress
   * @description 客户端IP地址
   * 
   * 用于安全审计和异常检测。
   * 记录登录来源IP，支持地理位置分析。
   */
  readonly ipAddress?: string;

  /**
   * @property userAgent
   * @description 用户代理信息
   * 
   * 客户端浏览器或应用的信息。
   * 用于安全审计和设备识别。
   */
  readonly userAgent?: string;

  /**
   * @property deviceId
   * @description 设备ID（可选）
   * 
   * 客户端设备的唯一标识符。
   * 用于设备管理和安全策略。
   */
  readonly deviceId?: string;

  /**
   * @property location
   * @description 地理位置信息（可选）
   * 
   * 用户的地理位置信息。
   * 用于安全审计和异常检测。
   */
  readonly location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  /**
   * @property sessionConfig
   * @description 会话配置（可选）
   * 
   * 自定义会话配置参数。
   * 支持会话超时、并发限制等配置。
   */
  readonly sessionConfig?: {
    timeout?: number; // 会话超时时间（秒）
    maxConcurrent?: number; // 最大并发会话数
    allowedDevices?: string[]; // 允许的设备类型
  };

  /**
   * @constructor
   * @description
   * 构造函数，初始化登录请求DTO的所有属性
   * 
   * @param {Partial<LoginRequestDto>} data - 登录请求数据
   */
  constructor(data: Partial<LoginRequestDto>) {
    this.usernameOrEmail = data.usernameOrEmail || '';
    this.password = data.password || '';
    this.tenantId = data.tenantId;
    this.rememberMe = data.rememberMe || false;
    this.mfaCode = data.mfaCode;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.deviceId = data.deviceId;
    this.location = data.location;
    this.sessionConfig = data.sessionConfig;
  }

  /**
   * @function validate
   * @description
   * 验证登录请求数据的有效性
   * 
   * 验证规则：
   * 1. 用户名或邮箱不能为空且长度合理
   * 2. 密码不能为空且长度合理
   * 3. 多因子认证代码格式正确（如果提供）
   * 4. IP地址格式正确（如果提供）
   * 5. 租户ID格式正确（如果提供）
   * 
   * @returns {boolean} 返回验证结果
   */
  validate(): boolean {
    // 验证用户名或邮箱
    if (!this.usernameOrEmail || this.usernameOrEmail.trim().length === 0) {
      return false;
    }

    if (this.usernameOrEmail.length > 100) {
      return false;
    }

    // 验证密码
    if (!this.password || this.password.length === 0) {
      return false;
    }

    if (this.password.length > 128) {
      return false;
    }

    // 验证多因子认证代码
    if (this.mfaCode && !this.validateMfaCode(this.mfaCode)) {
      return false;
    }

    // 验证IP地址
    if (this.ipAddress && !this.validateIpAddress(this.ipAddress)) {
      return false;
    }

    // 验证租户ID
    if (this.tenantId && !this.validateTenantId(this.tenantId)) {
      return false;
    }

    return true;
  }

  /**
   * @function validateMfaCode
   * @description
   * 验证多因子认证代码格式
   * 
   * @param {string} mfaCode - 多因子认证代码
   * @returns {boolean} 返回验证结果
   */
  private validateMfaCode(mfaCode: string): boolean {
    // TOTP代码通常是6位数字
    const totpPattern = /^\d{6}$/;

    // SMS代码通常是4-8位数字
    const smsPattern = /^\d{4,8}$/;

    return totpPattern.test(mfaCode) || smsPattern.test(mfaCode);
  }

  /**
   * @function validateIpAddress
   * @description
   * 验证IP地址格式
   * 
   * @param {string} ipAddress - IP地址
   * @returns {boolean} 返回验证结果
   */
  private validateIpAddress(ipAddress: string): boolean {
    // IPv4地址格式
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6地址格式（简化验证）
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Pattern.test(ipAddress) || ipv6Pattern.test(ipAddress);
  }

  /**
   * @function validateTenantId
   * @description
   * 验证租户ID格式
   * 
   * @param {string} tenantId - 租户ID
   * @returns {boolean} 返回验证结果
   */
  private validateTenantId(tenantId: string): boolean {
    // UUID格式验证
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidPattern.test(tenantId);
  }

  /**
   * @function toPlainObject
   * @description
   * 转换为普通对象，用于序列化
   * 
   * @returns {object} 返回普通对象
   */
  toPlainObject(): object {
    return {
      usernameOrEmail: this.usernameOrEmail,
      tenantId: this.tenantId,
      rememberMe: this.rememberMe,
      hasMfaCode: !!this.mfaCode,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      deviceId: this.deviceId,
      location: this.location,
      sessionConfig: this.sessionConfig,
    };
  }

  /**
   * @function getLogSafeData
   * @description
   * 获取安全的日志数据（不包含敏感信息）
   * 
   * @returns {object} 返回安全的日志数据
   */
  getLogSafeData(): object {
    return {
      usernameOrEmail: this.usernameOrEmail,
      tenantId: this.tenantId,
      rememberMe: this.rememberMe,
      hasMfaCode: !!this.mfaCode,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      deviceId: this.deviceId,
      location: this.location,
      sessionConfig: this.sessionConfig,
    };
  }
}
