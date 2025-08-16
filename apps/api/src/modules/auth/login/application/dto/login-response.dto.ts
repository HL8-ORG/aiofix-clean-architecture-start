/**
 * @file login-response.dto.ts
 * @description 登录响应数据传输对象
 * 
 * 该DTO定义了用户登录用例的输出数据结构，包含登录成功后的所有信息。
 * 遵循Clean Architecture原则，作为用例层的输出契约。
 * 
 * 主要功能：
 * - 定义登录响应的数据结构
 * - 包含用户信息和令牌信息
 * - 提供会话管理信息
 * - 支持安全审计
 * 
 * 架构特点：
 * - 遵循DTO设计模式
 * - 包含完整的响应信息
 * - 支持扩展性设计
 * - 提供清晰的类型定义
 */

/**
 * @interface UserInfo
 * @description 用户信息接口
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱地址 */
  email: string;
  /** 租户ID */
  tenantId?: string;
  /** 用户角色列表 */
  roles: string[];
  /** 用户权限列表 */
  permissions: string[];
  /** 用户状态 */
  status?: string;
  /** 最后登录时间 */
  lastLoginAt?: Date;
  /** 多因子认证是否启用 */
  mfaEnabled?: boolean;
}

/**
 * @interface SessionInfo
 * @description 会话信息接口
 */
export interface SessionInfo {
  /** 会话ID */
  id: string;
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间 */
  expiresAt: Date;
  /** 最后活跃时间 */
  lastActiveAt?: Date;
  /** 设备信息 */
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
  };
  /** 地理位置信息 */
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * @interface TokenInfo
 * @description 令牌信息接口
 */
export interface TokenInfo {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间（秒） */
  expiresIn: number;
  /** 令牌创建时间 */
  createdAt: Date;
  /** 令牌过期时间 */
  expiresAt: Date;
}

/**
 * @class LoginResponseDto
 * @description 登录响应数据传输对象类
 * 
 * 该DTO封装了用户登录成功后的所有信息，包括用户信息、令牌信息、
 * 会话信息和安全上下文等。是登录用例的输出契约。
 * 
 * 主要原理与机制如下：
 * 1. 定义登录响应的完整数据结构
 * 2. 提供类型安全和数据验证
 * 3. 包含用户信息和权限信息
 * 4. 提供令牌和会话管理信息
 * 5. 支持安全审计和监控
 * 
 * 响应结构：
 * - 用户基本信息
 * - 用户权限和角色
 * - JWT令牌信息
 * - 会话管理信息
 * - 安全审计信息
 * 
 * 安全特性：
 * - 敏感信息加密传输
 * - 令牌安全生成
 * - 会话安全管理
 * - 权限信息完整
 */
export class LoginResponseDto {
  /**
   * @property success
   * @description 登录是否成功
   */
  readonly success: boolean;

  /**
   * @property user
   * @description 用户信息
   */
  readonly user: UserInfo;

  /**
   * @property tokens
   * @description 令牌信息
   */
  readonly tokens: TokenInfo;

  /**
   * @property session
   * @description 会话信息
   */
  readonly session: SessionInfo;

  /**
   * @property metadata
   * @description 元数据信息
   */
  readonly metadata: {
    /** 登录时间 */
    loginTime: Date;
    /** 服务器时间 */
    serverTime: Date;
    /** 响应时间（毫秒） */
    responseTime: number;
    /** 安全级别 */
    securityLevel: 'low' | 'medium' | 'high';
    /** 是否需要多因子认证 */
    requiresMfa: boolean;
    /** 会话超时时间（秒） */
    sessionTimeout: number;
  };

  /**
   * @property security
   * @description 安全信息
   */
  readonly security: {
    /** 登录IP地址 */
    loginIp: string;
    /** 用户代理 */
    userAgent: string;
    /** 地理位置 */
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
    /** 设备指纹 */
    deviceFingerprint?: string;
    /** 风险评估 */
    riskLevel: 'low' | 'medium' | 'high';
    /** 异常检测结果 */
    anomalyDetected: boolean;
  };

  /**
   * @constructor
   * @description
   * 构造函数，初始化登录响应DTO的所有属性
   * 
   * @param {Partial<LoginResponseDto>} data - 登录响应数据
   */
  constructor(data: Partial<LoginResponseDto>) {
    this.success = data.success || false;
    this.user = data.user || {
      id: '',
      username: '',
      email: '',
      roles: [],
      permissions: [],
    };
    this.tokens = data.tokens || {
      accessToken: '',
      refreshToken: '',
      tokenType: 'Bearer',
      expiresIn: 3600,
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    this.session = data.session || {
      id: '',
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    this.metadata = data.metadata || {
      loginTime: new Date(),
      serverTime: new Date(),
      responseTime: 0,
      securityLevel: 'medium',
      requiresMfa: false,
      sessionTimeout: 3600,
    };
    this.security = data.security || {
      loginIp: '',
      userAgent: '',
      riskLevel: 'low',
      anomalyDetected: false,
    };
  }

  /**
   * @function validate
   * @description
   * 验证登录响应数据的有效性
   * 
   * 验证规则：
   * 1. 用户信息必须完整
   * 2. 令牌信息必须有效
   * 3. 会话信息必须完整
   * 4. 元数据信息必须合理
   * 5. 安全信息必须完整
   * 
   * @returns {boolean} 返回验证结果
   */
  validate(): boolean {
    // 验证用户信息
    if (!this.user.id || !this.user.username || !this.user.email) {
      return false;
    }

    // 验证令牌信息
    if (!this.tokens.accessToken || !this.tokens.refreshToken) {
      return false;
    }

    if (this.tokens.expiresIn <= 0) {
      return false;
    }

    // 验证会话信息
    if (!this.session.id) {
      return false;
    }

    if (this.session.expiresAt <= this.session.createdAt) {
      return false;
    }

    // 验证元数据信息
    if (!this.metadata.loginTime || !this.metadata.serverTime) {
      return false;
    }

    if (this.metadata.responseTime < 0) {
      return false;
    }

    // 验证安全信息
    if (!this.security.loginIp || !this.security.userAgent) {
      return false;
    }

    return true;
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
      success: this.success,
      user: {
        id: this.user.id,
        username: this.user.username,
        email: this.user.email,
        tenantId: this.user.tenantId,
        roles: this.user.roles,
        permissions: this.user.permissions,
        status: this.user.status,
        lastLoginAt: this.user.lastLoginAt,
        mfaEnabled: this.user.mfaEnabled,
      },
      tokens: {
        accessToken: this.tokens.accessToken,
        refreshToken: this.tokens.refreshToken,
        tokenType: this.tokens.tokenType,
        expiresIn: this.tokens.expiresIn,
        createdAt: this.tokens.createdAt,
        expiresAt: this.tokens.expiresAt,
      },
      session: {
        id: this.session.id,
        createdAt: this.session.createdAt,
        expiresAt: this.session.expiresAt,
        lastActiveAt: this.session.lastActiveAt,
        deviceInfo: this.session.deviceInfo,
        location: this.session.location,
      },
      metadata: {
        loginTime: this.metadata.loginTime,
        serverTime: this.metadata.serverTime,
        responseTime: this.metadata.responseTime,
        securityLevel: this.metadata.securityLevel,
        requiresMfa: this.metadata.requiresMfa,
        sessionTimeout: this.metadata.sessionTimeout,
      },
      security: {
        loginIp: this.security.loginIp,
        userAgent: this.security.userAgent,
        location: this.security.location,
        deviceFingerprint: this.security.deviceFingerprint,
        riskLevel: this.security.riskLevel,
        anomalyDetected: this.security.anomalyDetected,
      },
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
      success: this.success,
      user: {
        id: this.user.id,
        username: this.user.username,
        email: this.user.email,
        tenantId: this.user.tenantId,
        roles: this.user.roles,
        permissions: this.user.permissions,
        status: this.user.status,
        lastLoginAt: this.user.lastLoginAt,
        mfaEnabled: this.user.mfaEnabled,
      },
      session: {
        id: this.session.id,
        createdAt: this.session.createdAt,
        expiresAt: this.session.expiresAt,
        lastActiveAt: this.session.lastActiveAt,
        deviceInfo: this.session.deviceInfo,
        location: this.session.location,
      },
      metadata: {
        loginTime: this.metadata.loginTime,
        serverTime: this.metadata.serverTime,
        responseTime: this.metadata.responseTime,
        securityLevel: this.metadata.securityLevel,
        requiresMfa: this.metadata.requiresMfa,
        sessionTimeout: this.metadata.sessionTimeout,
      },
      security: {
        loginIp: this.security.loginIp,
        userAgent: this.security.userAgent,
        location: this.security.location,
        deviceFingerprint: this.security.deviceFingerprint,
        riskLevel: this.security.riskLevel,
        anomalyDetected: this.security.anomalyDetected,
      },
    };
  }

  /**
   * @function isTokenExpired
   * @description
   * 检查访问令牌是否已过期
   * 
   * @returns {boolean} 返回是否过期
   */
  isTokenExpired(): boolean {
    return new Date() > this.tokens.expiresAt;
  }

  /**
   * @function isSessionExpired
   * @description
   * 检查会话是否已过期
   * 
   * @returns {boolean} 返回是否过期
   */
  isSessionExpired(): boolean {
    return new Date() > this.session.expiresAt;
  }

  /**
   * @function getRemainingTokenTime
   * @description
   * 获取令牌剩余有效时间（秒）
   * 
   * @returns {number} 返回剩余时间
   */
  getRemainingTokenTime(): number {
    const now = new Date();
    const remaining = this.tokens.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * @function getRemainingSessionTime
   * @description
   * 获取会话剩余有效时间（秒）
   * 
   * @returns {number} 返回剩余时间
   */
  getRemainingSessionTime(): number {
    const now = new Date();
    const remaining = this.session.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}
