import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigurationService } from './configuration.service';
import { IConfigurationValidator } from '../interfaces/configuration-validator.interface';
import { IConfigurationCacheService } from '../interfaces/configuration-cache.interface';
import { IConfigurationEncryptionService } from '../interfaces/configuration-encryption.interface';
import { ConfigScope, ConfigSource } from '../interfaces/configuration.interface';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let mockValidator: jest.Mocked<IConfigurationValidator>;
  let mockCacheService: jest.Mocked<IConfigurationCacheService>;
  let mockEncryptionService: jest.Mocked<IConfigurationEncryptionService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockValidatorImpl = {
      validate: jest.fn(),
      validateBatch: jest.fn(),
      createStringSchema: jest.fn(),
      createNumberSchema: jest.fn(),
      createBooleanSchema: jest.fn(),
      createArraySchema: jest.fn(),
      createObjectSchema: jest.fn(),
      addRule: jest.fn(),
      removeRule: jest.fn(),
      getRule: jest.fn(),
      listRules: jest.fn(),
    };

    const mockCacheServiceImpl = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
      getStats: jest.fn(),
    };

    const mockEncryptionServiceImpl = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      encryptBatch: jest.fn(),
      decryptBatch: jest.fn(),
      generateKey: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      getKey: jest.fn(),
      getAllKeys: jest.fn(),
      activateKey: jest.fn(),
      deactivateKey: jest.fn(),
      deleteKey: jest.fn(),
      rotateKey: jest.fn(),
      autoRotateKey: jest.fn(),
      isKeyExpired: jest.fn(),
      getExpiringKeys: jest.fn(),
      validateEncryptedValue: jest.fn(),
      getSupportedAlgorithms: jest.fn(),
      isAlgorithmSupported: jest.fn(),
      getAlgorithmInfo: jest.fn(),
      getStats: jest.fn(),
      clearCache: jest.fn(),
      enableCache: jest.fn(),
      getCacheInfo: jest.fn(),
      backupKeys: jest.fn(),
      restoreKeys: jest.fn(),
    };

    const mockEventEmitterImpl = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listenerCount: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      eventNames: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigurationService,
          useFactory: () => new ConfigurationService(
            mockValidatorImpl as any,
            mockCacheServiceImpl as any,
            mockEncryptionServiceImpl as any,
            mockEventEmitterImpl as any
          ),
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
    mockValidator = mockValidatorImpl as any;
    mockCacheService = mockCacheServiceImpl as any;
    mockEncryptionService = mockEncryptionServiceImpl as any;
    mockEventEmitter = mockEventEmitterImpl as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
