import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationEncryptionService } from './configuration-encryption.service';
import { EncryptionAlgorithm } from '../interfaces/configuration-encryption.interface';

describe('ConfigurationEncryptionService', () => {
  let service: ConfigurationEncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigurationEncryptionService],
    }).compile();

    service = module.get<ConfigurationEncryptionService>(ConfigurationEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt values correctly', async () => {
      const testValue = { key: 'value', number: 123, boolean: true };

      // 加密
      const encryptionResult = await service.encrypt(testValue);
      expect(encryptionResult.encryptedData).toBeDefined();
      expect(encryptionResult.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
      expect(encryptionResult.keyId).toBeDefined();
      expect(encryptionResult.encryptedAt).toBeInstanceOf(Date);
      expect(encryptionResult.originalSize).toBeGreaterThan(0);
      expect(encryptionResult.encryptedSize).toBeGreaterThan(0);

      // 解密
      const decryptionResult = await service.decrypt(encryptionResult.encryptedData);
      expect(decryptionResult.decryptedData).toEqual(testValue);
      expect(decryptionResult.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
      expect(decryptionResult.keyId).toBe(encryptionResult.keyId);
      expect(decryptionResult.decryptedAt).toBeInstanceOf(Date);
    });

    it('should handle different data types', async () => {
      const testCases = [
        'simple string',
        12345,
        true,
        { nested: { object: 'value' } },
        ['array', 'of', 'strings'],
        null,
      ];

      for (const testCase of testCases) {
        const encrypted = await service.encrypt(testCase);
        const decrypted = await service.decrypt(encrypted.encryptedData);
        expect(decrypted.decryptedData).toEqual(testCase);
      }

      // 特殊处理 undefined，因为 JSON.stringify 会将其转换为 null
      const encrypted = await service.encrypt(undefined);
      const decrypted = await service.decrypt(encrypted.encryptedData);
      expect(decrypted.decryptedData).toBeNull();
    });
  });

  describe('key management', () => {
    it('should generate keys', async () => {
      const key = await service.generateKey(EncryptionAlgorithm.AES_256_GCM);
      expect(key.id).toBeDefined();
      expect(key.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
      expect(key.type).toBe('symmetric');
      expect(key.material).toBeInstanceOf(Buffer);
      expect(key.isActive).toBe(true);
      expect(key.purpose).toBe('both');
    });

    it('should get keys', async () => {
      const key = await service.generateKey(EncryptionAlgorithm.AES_256_GCM);
      const retrievedKey = await service.getKey(key.id);
      expect(retrievedKey).toEqual(key);
    });
  });

  describe('statistics', () => {
    it('should provide encryption stats', async () => {
      // 清除缓存以确保每次都是新的加密操作
      service.clearCache();

      // 执行一些加密操作
      await service.encrypt('test1');
      await service.encrypt('test2');

      const stats = await service.getStats();
      expect(stats.totalEncryptions).toBeGreaterThanOrEqual(2);
      expect(stats.encryptionFailures).toBe(0);
      expect(stats.averageEncryptionTime).toBeGreaterThan(0);
      expect(stats.activeKeys).toBeGreaterThan(0);
    });
  });
});
