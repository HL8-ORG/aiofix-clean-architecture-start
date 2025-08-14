// 配置管理接口
export type {
  IConfigurationService,
  ConfigValue,
  ConfigKey,
  ConfigOptions,
  ConfigChangeEvent,
  ConfigValidationResult,
  ConfigCacheInfo,
  ConfigStats,
} from './interfaces/configuration.interface';

export {
  ConfigSource,
  ConfigScope,
} from './interfaces/configuration.interface';

// 配置验证器接口
export type {
  IConfigurationValidator,
  ValidationRule,
  ValidationSchema,
  ValidationContext,
  ValidationError,
  ValidationResult,
} from './interfaces/configuration-validator.interface';

// 配置加密服务接口
export type {
  IConfigurationEncryptionService,
  EncryptionKey,
  EncryptionOptions,
  EncryptionResult,
  DecryptionResult,
  KeyRotationResult,
  EncryptionStats,
} from './interfaces/configuration-encryption.interface';

export {
  EncryptionAlgorithm,
} from './interfaces/configuration-encryption.interface';

// 配置缓存服务接口
export type {
  IConfigurationCacheService,
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheEvent,
  CacheLayer,
} from './interfaces/configuration-cache.interface';

export {
  CacheStrategy,
  CacheEvictionPolicy,
} from './interfaces/configuration-cache.interface';
