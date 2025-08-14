/**
 * @enum EncryptionAlgorithm
 * @description
 * 加密算法枚举，定义支持的加密算法。
 */
export enum EncryptionAlgorithm {
  /** AES-256-GCM */
  AES_256_GCM = 'aes-256-gcm',
  /** AES-256-CBC */
  AES_256_CBC = 'aes-256-cbc',
  /** ChaCha20-Poly1305 */
  CHACHA20_POLY1305 = 'chacha20-poly1305',
  /** RSA-OAEP */
  RSA_OAEP = 'rsa-oaep',
  /** RSA-PKCS1 */
  RSA_PKCS1 = 'rsa-pkcs1',
}

/**
 * @interface EncryptionKey
 * @description
 * 加密密钥接口，定义加密密钥的信息。
 */
export interface EncryptionKey {
  /** 密钥ID */
  readonly id: string;
  /** 密钥类型 */
  readonly type: 'symmetric' | 'asymmetric';
  /** 密钥算法 */
  readonly algorithm: EncryptionAlgorithm;
  /** 密钥材料 */
  readonly material: Buffer;
  /** 密钥版本 */
  readonly version: number;
  /** 创建时间 */
  readonly createdAt: Date;
  /** 过期时间 */
  readonly expiresAt?: Date;
  /** 是否活跃 */
  readonly isActive: boolean;
  /** 密钥用途 */
  readonly purpose: 'encrypt' | 'decrypt' | 'both';
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface EncryptionOptions
 * @description
 * 加密选项接口，定义加密的选项参数。
 */
export interface EncryptionOptions {
  /** 加密算法 */
  algorithm?: EncryptionAlgorithm;
  /** 密钥ID */
  keyId?: string;
  /** 初始化向量 */
  iv?: Buffer;
  /** 认证标签 */
  authTag?: Buffer;
  /** 填充方式 */
  padding?: 'pkcs7' | 'none';
  /** 编码方式 */
  encoding?: 'base64' | 'hex' | 'utf8';
  /** 压缩 */
  compress?: boolean;
  /** 自定义选项 */
  custom?: Record<string, any>;
}

/**
 * @interface EncryptionResult
 * @description
 * 加密结果接口，定义加密的结果信息。
 */
export interface EncryptionResult {
  /** 加密后的数据 */
  readonly encryptedData: string;
  /** 使用的算法 */
  readonly algorithm: EncryptionAlgorithm;
  /** 使用的密钥ID */
  readonly keyId: string;
  /** 初始化向量 */
  readonly iv?: Buffer;
  /** 认证标签 */
  readonly authTag?: Buffer;
  /** 加密时间 */
  readonly encryptedAt: Date;
  /** 数据大小 */
  readonly originalSize: number;
  /** 加密后大小 */
  readonly encryptedSize: number;
  /** 压缩率 */
  readonly compressionRatio?: number;
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface DecryptionResult
 * @description
 * 解密结果接口，定义解密的结果信息。
 */
export interface DecryptionResult<T = any> {
  /** 解密后的数据 */
  readonly decryptedData: T;
  /** 使用的算法 */
  readonly algorithm: EncryptionAlgorithm;
  /** 使用的密钥ID */
  readonly keyId: string;
  /** 解密时间 */
  readonly decryptedAt: Date;
  /** 数据大小 */
  readonly encryptedSize: number;
  /** 解密后大小 */
  readonly decryptedSize: number;
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface KeyRotationResult
 * @description
 * 密钥轮换结果接口，定义密钥轮换的结果信息。
 */
export interface KeyRotationResult {
  /** 旧密钥ID */
  readonly oldKeyId: string;
  /** 新密钥ID */
  readonly newKeyId: string;
  /** 轮换时间 */
  readonly rotatedAt: Date;
  /** 轮换的配置数量 */
  readonly rotatedConfigs: number;
  /** 轮换状态 */
  readonly status: 'success' | 'partial' | 'failed';
  /** 错误信息 */
  readonly errors?: string[];
  /** 元数据 */
  readonly metadata: Record<string, any>;
}

/**
 * @interface EncryptionStats
 * @description
 * 加密统计信息接口，定义加密系统的统计信息。
 */
export interface EncryptionStats {
  /** 总加密次数 */
  readonly totalEncryptions: number;
  /** 总解密次数 */
  readonly totalDecryptions: number;
  /** 加密失败次数 */
  readonly encryptionFailures: number;
  /** 解密失败次数 */
  readonly decryptionFailures: number;
  /** 平均加密时间（毫秒） */
  readonly averageEncryptionTime: number;
  /** 平均解密时间（毫秒） */
  readonly averageDecryptionTime: number;
  /** 活跃密钥数量 */
  readonly activeKeys: number;
  /** 过期密钥数量 */
  readonly expiredKeys: number;
  /** 各算法使用次数 */
  readonly algorithmUsage: Record<EncryptionAlgorithm, number>;
  /** 密钥轮换次数 */
  readonly keyRotations: number;
}

/**
 * @interface IConfigurationEncryptionService
 * @description
 * 配置加密服务接口，定义配置加密的核心功能。
 * 
 * 主要职责：
 * 1. 配置值的加密和解密
 * 2. 加密密钥的管理
 * 3. 密钥轮换和更新
 * 4. 加密算法的选择
 * 5. 加密性能优化
 * 6. 加密安全审计
 * 
 * 设计原则：
 * - 安全性：使用强加密算法和安全密钥管理
 * - 性能：高效的加密解密算法
 * - 兼容性：支持多种加密算法和密钥类型
 * - 可扩展：易于添加新的加密算法
 * - 可审计：完整的加密操作日志
 * - 密钥管理：安全的密钥生成、存储和轮换
 */
export interface IConfigurationEncryptionService {
  /**
   * 加密配置值
   * 
   * @param value 原始值
   * @param options 加密选项
   * @returns 加密结果
   */
  encrypt(value: any, options?: EncryptionOptions): Promise<EncryptionResult>;

  /**
   * 解密配置值
   * 
   * @param encryptedValue 加密值
   * @param options 解密选项
   * @returns 解密结果
   */
  decrypt<T = any>(encryptedValue: string, options?: EncryptionOptions): Promise<DecryptionResult<T>>;

  /**
   * 批量加密配置值
   * 
   * @param values 原始值映射
   * @param options 加密选项
   * @returns 加密结果映射
   */
  encryptBatch(
    values: Record<string, any>,
    options?: EncryptionOptions
  ): Promise<Record<string, EncryptionResult>>;

  /**
   * 批量解密配置值
   * 
   * @param encryptedValues 加密值映射
   * @param options 解密选项
   * @returns 解密结果映射
   */
  decryptBatch(
    encryptedValues: Record<string, string>,
    options?: EncryptionOptions
  ): Promise<Record<string, DecryptionResult>>;

  /**
   * 生成加密密钥
   * 
   * @param algorithm 加密算法
   * @param options 密钥选项
   * @returns 加密密钥
   */
  generateKey(algorithm: EncryptionAlgorithm, options?: {
    keySize?: number;
    purpose?: 'encrypt' | 'decrypt' | 'both';
    expiresIn?: number; // 过期时间（毫秒）
    metadata?: Record<string, any>;
  }): Promise<EncryptionKey>;

  /**
   * 导入加密密钥
   * 
   * @param keyMaterial 密钥材料
   * @param algorithm 加密算法
   * @param options 导入选项
   * @returns 加密密钥
   */
  importKey(
    keyMaterial: Buffer | string,
    algorithm: EncryptionAlgorithm,
    options?: {
      keyId?: string;
      purpose?: 'encrypt' | 'decrypt' | 'both';
      expiresIn?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<EncryptionKey>;

  /**
   * 导出加密密钥
   * 
   * @param keyId 密钥ID
   * @param format 导出格式
   * @returns 导出的密钥
   */
  exportKey(keyId: string, format?: 'raw' | 'pem' | 'jwk'): Promise<string | Buffer>;

  /**
   * 获取加密密钥
   * 
   * @param keyId 密钥ID
   * @returns 加密密钥
   */
  getKey(keyId: string): Promise<EncryptionKey | null>;

  /**
   * 获取所有加密密钥
   * 
   * @param activeOnly 是否只返回活跃密钥
   * @returns 加密密钥列表
   */
  getAllKeys(activeOnly?: boolean): Promise<EncryptionKey[]>;

  /**
   * 激活加密密钥
   * 
   * @param keyId 密钥ID
   * @returns 是否成功激活
   */
  activateKey(keyId: string): Promise<boolean>;

  /**
   * 停用加密密钥
   * 
   * @param keyId 密钥ID
   * @returns 是否成功停用
   */
  deactivateKey(keyId: string): Promise<boolean>;

  /**
   * 删除加密密钥
   * 
   * @param keyId 密钥ID
   * @returns 是否成功删除
   */
  deleteKey(keyId: string): Promise<boolean>;

  /**
   * 轮换加密密钥
   * 
   * @param oldKeyId 旧密钥ID
   * @param newKeyId 新密钥ID
   * @param configs 需要轮换的配置映射
   * @returns 轮换结果
   */
  rotateKey(
    oldKeyId: string,
    newKeyId: string,
    configs: Record<string, string>
  ): Promise<KeyRotationResult>;

  /**
   * 自动轮换密钥
   * 
   * @param algorithm 加密算法
   * @param options 轮换选项
   * @returns 轮换结果
   */
  autoRotateKey(
    algorithm: EncryptionAlgorithm,
    options?: {
      keySize?: number;
      expiresIn?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<KeyRotationResult>;

  /**
   * 检查密钥是否过期
   * 
   * @param keyId 密钥ID
   * @returns 是否过期
   */
  isKeyExpired(keyId: string): Promise<boolean>;

  /**
   * 获取即将过期的密钥
   * 
   * @param threshold 阈值（毫秒）
   * @returns 即将过期的密钥列表
   */
  getExpiringKeys(threshold?: number): Promise<EncryptionKey[]>;

  /**
   * 验证加密值
   * 
   * @param encryptedValue 加密值
   * @returns 是否有效
   */
  validateEncryptedValue(encryptedValue: string): Promise<boolean>;

  /**
   * 获取支持的加密算法
   * 
   * @returns 支持的算法列表
   */
  getSupportedAlgorithms(): EncryptionAlgorithm[];

  /**
   * 检查算法是否支持
   * 
   * @param algorithm 加密算法
   * @returns 是否支持
   */
  isAlgorithmSupported(algorithm: EncryptionAlgorithm): boolean;

  /**
   * 获取算法信息
   * 
   * @param algorithm 加密算法
   * @returns 算法信息
   */
  getAlgorithmInfo(algorithm: EncryptionAlgorithm): {
    name: string;
    keySize: number;
    blockSize: number;
    securityLevel: number;
    performance: 'high' | 'medium' | 'low';
  } | null;

  /**
   * 获取加密统计信息
   * 
   * @returns 统计信息
   */
  getStats(): Promise<EncryptionStats>;

  /**
   * 清除加密缓存
   * 
   * @returns 清除的缓存数量
   */
  clearCache(): number;

  /**
   * 启用加密缓存
   * 
   * @param enabled 是否启用
   */
  enableCache(enabled: boolean): void;

  /**
   * 获取加密缓存信息
   * 
   * @returns 缓存信息
   */
  getCacheInfo(): {
    enabled: boolean;
    size: number;
    hitRate: number;
    averageAccessTime: number;
  };

  /**
   * 备份密钥
   * 
   * @param keyIds 密钥ID列表（可选，不指定则备份所有）
   * @param password 备份密码
   * @returns 备份数据
   */
  backupKeys(keyIds?: string[], password?: string): Promise<string>;

  /**
   * 恢复密钥
   * 
   * @param backupData 备份数据
   * @param password 备份密码
   * @returns 恢复的密钥数量
   */
  restoreKeys(backupData: string, password?: string): Promise<number>;
}
