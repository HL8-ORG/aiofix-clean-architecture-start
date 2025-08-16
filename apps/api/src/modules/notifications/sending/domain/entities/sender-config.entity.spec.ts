import { SenderConfig, ConfigKey, ConfigValue } from './sender-config.entity';
import { SenderType, SenderTypeEnum } from '../value-objects/sender-type';

describe('SenderConfig', () => {
  describe('constructor', () => {
    it('should create a valid SenderConfig', () => {
      const config = new SenderConfig(
        new ConfigKey('testKey'),
        new ConfigValue('testValue'),
        false,
        'Test description',
        { test: 'metadata' }
      );

      expect(config.key.value).toBe('testKey');
      expect(config.value.value).toBe('testValue');
      expect(config.isEncrypted).toBe(false);
      expect(config.description).toBe('Test description');
      expect(config.metadata).toEqual({ test: 'metadata' });
    });

    it('should create a valid SenderConfig with encrypted value', () => {
      const config = new SenderConfig(
        new ConfigKey('password'),
        new ConfigValue('secret123'),
        true,
        'Encrypted password'
      );

      expect(config.isEncrypted).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should return the configuration value', () => {
      const config = new SenderConfig(
        new ConfigKey('apiKey'),
        new ConfigValue('abc123'),
        false
      );

      expect(config.getValue()).toBe('abc123');
    });

    it('should return encrypted value (placeholder for decryption logic)', () => {
      const config = new SenderConfig(
        new ConfigKey('password'),
        new ConfigValue('encrypted_value'),
        true
      );

      expect(config.getValue()).toBe('encrypted_value');
    });
  });

  describe('toPlainObject', () => {
    it('should return plain object with non-encrypted value', () => {
      const config = new SenderConfig(
        new ConfigKey('apiKey'),
        new ConfigValue('abc123'),
        false,
        'API Key',
        { type: 'string' }
      );

      const plainObject = config.toPlainObject();

      expect(plainObject).toEqual({
        key: 'apiKey',
        value: 'abc123',
        isEncrypted: false,
        description: 'API Key',
        metadata: { type: 'string' }
      });
    });

    it('should mask encrypted value in plain object', () => {
      const config = new SenderConfig(
        new ConfigKey('password'),
        new ConfigValue('secret123'),
        true,
        'Password'
      );

      const plainObject = config.toPlainObject();

      expect(plainObject.value).toBe('***');
      expect(plainObject.isEncrypted).toBe(true);
    });
  });

  describe('validateForType', () => {
    describe('EMAIL type validation', () => {
      it('should validate valid email configuration', () => {
        const emailType = new SenderType(SenderTypeEnum.EMAIL);

        const hostConfig = new SenderConfig(
          new ConfigKey('host'),
          new ConfigValue('smtp.gmail.com'),
          false
        );
        expect(hostConfig.validateForType(emailType)).toBe(true);

        const portConfig = new SenderConfig(
          new ConfigKey('port'),
          new ConfigValue('587'),
          false
        );
        expect(portConfig.validateForType(emailType)).toBe(true);

        const fromConfig = new SenderConfig(
          new ConfigKey('from'),
          new ConfigValue('test@example.com'),
          false
        );
        expect(fromConfig.validateForType(emailType)).toBe(true);
      });

      it('should reject invalid email configuration', () => {
        const emailType = new SenderType(SenderTypeEnum.EMAIL);

        const invalidPortConfig = new SenderConfig(
          new ConfigKey('port'),
          new ConfigValue('invalid'),
          false
        );
        expect(invalidPortConfig.validateForType(emailType)).toBe(false);

        const invalidFromConfig = new SenderConfig(
          new ConfigKey('from'),
          new ConfigValue('invalid-email'),
          false
        );
        expect(invalidFromConfig.validateForType(emailType)).toBe(false);
      });
    });

    describe('SMS type validation', () => {
      it('should validate valid SMS configuration', () => {
        const smsType = new SenderType(SenderTypeEnum.SMS);

        const apiKeyConfig = new SenderConfig(
          new ConfigKey('apiKey'),
          new ConfigValue('abc123'),
          false
        );
        expect(apiKeyConfig.validateForType(smsType)).toBe(true);

        const apiSecretConfig = new SenderConfig(
          new ConfigKey('apiSecret'),
          new ConfigValue('secret123'),
          true
        );
        expect(apiSecretConfig.validateForType(smsType)).toBe(true);
      });

      it('should reject empty SMS configuration values', () => {
        const smsType = new SenderType(SenderTypeEnum.SMS);

        const emptyConfig = new SenderConfig(
          new ConfigKey('apiKey'),
          new ConfigValue(''),
          false
        );
        expect(emptyConfig.validateForType(smsType)).toBe(false);
      });
    });

    describe('WEBHOOK type validation', () => {
      it('should validate valid webhook URL', () => {
        const webhookType = new SenderType(SenderTypeEnum.WEBHOOK);

        const validUrlConfig = new SenderConfig(
          new ConfigKey('url'),
          new ConfigValue('https://api.example.com/webhook'),
          false
        );
        expect(validUrlConfig.validateForType(webhookType)).toBe(true);
      });

      it('should reject invalid webhook URL', () => {
        const webhookType = new SenderType(SenderTypeEnum.WEBHOOK);

        const invalidUrlConfig = new SenderConfig(
          new ConfigKey('url'),
          new ConfigValue('not-a-url'),
          false
        );
        expect(invalidUrlConfig.validateForType(webhookType)).toBe(false);
      });
    });

    describe('SLACK type validation', () => {
      it('should validate valid Slack configuration', () => {
        const slackType = new SenderType(SenderTypeEnum.SLACK);

        const tokenConfig = new SenderConfig(
          new ConfigKey('token'),
          new ConfigValue('xoxb-1234567890'),
          true
        );
        expect(tokenConfig.validateForType(slackType)).toBe(true);

        const channelConfig = new SenderConfig(
          new ConfigKey('channel'),
          new ConfigValue('#general'),
          false
        );
        expect(channelConfig.validateForType(slackType)).toBe(true);
      });
    });

    describe('DISCORD type validation', () => {
      it('should validate valid Discord webhook URL', () => {
        const discordType = new SenderType(SenderTypeEnum.DISCORD);

        const validWebhookConfig = new SenderConfig(
          new ConfigKey('webhookUrl'),
          new ConfigValue('https://discord.com/api/webhooks/1234567890/abcdef'),
          false
        );
        expect(validWebhookConfig.validateForType(discordType)).toBe(true);
      });

      it('should reject invalid Discord webhook URL', () => {
        const discordType = new SenderType(SenderTypeEnum.DISCORD);

        const invalidWebhookConfig = new SenderConfig(
          new ConfigKey('webhookUrl'),
          new ConfigValue('not-a-discord-webhook'),
          false
        );
        expect(invalidWebhookConfig.validateForType(discordType)).toBe(false);
      });
    });
  });

  describe('isRequired', () => {
    it('should identify required EMAIL configuration keys', () => {
      const emailType = new SenderType(SenderTypeEnum.EMAIL);
      const requiredKeys = ['host', 'port', 'username', 'password', 'from'];

      requiredKeys.forEach(key => {
        const config = new SenderConfig(
          new ConfigKey(key),
          new ConfigValue('value'),
          false
        );
        expect(config.isRequired(emailType)).toBe(true);
      });

      const optionalConfig = new SenderConfig(
        new ConfigKey('optionalKey'),
        new ConfigValue('value'),
        false
      );
      expect(optionalConfig.isRequired(emailType)).toBe(false);
    });

    it('should identify required SMS configuration keys', () => {
      const smsType = new SenderType(SenderTypeEnum.SMS);
      const requiredKeys = ['apiKey', 'apiSecret', 'endpoint'];

      requiredKeys.forEach(key => {
        const config = new SenderConfig(
          new ConfigKey(key),
          new ConfigValue('value'),
          false
        );
        expect(config.isRequired(smsType)).toBe(true);
      });
    });

    it('should identify required PUSH configuration keys', () => {
      const pushType = new SenderType(SenderTypeEnum.PUSH);
      const requiredKeys = ['appId', 'appKey', 'masterSecret'];

      requiredKeys.forEach(key => {
        const config = new SenderConfig(
          new ConfigKey(key),
          new ConfigValue('value'),
          false
        );
        expect(config.isRequired(pushType)).toBe(true);
      });
    });

    it('should identify required WEBHOOK configuration keys', () => {
      const webhookType = new SenderType(SenderTypeEnum.WEBHOOK);

      const urlConfig = new SenderConfig(
        new ConfigKey('url'),
        new ConfigValue('https://example.com'),
        false
      );
      expect(urlConfig.isRequired(webhookType)).toBe(true);

      const optionalConfig = new SenderConfig(
        new ConfigKey('optionalKey'),
        new ConfigValue('value'),
        false
      );
      expect(optionalConfig.isRequired(webhookType)).toBe(false);
    });
  });
});

describe('ConfigKey', () => {
  describe('constructor', () => {
    it('should create a valid ConfigKey', () => {
      const configKey = new ConfigKey('valid_key');
      expect(configKey.value).toBe('valid_key');
    });

    it('should create a valid ConfigKey with dot notation', () => {
      const configKey = new ConfigKey('nested.config.key');
      expect(configKey.value).toBe('nested.config.key');
    });

    it('should throw error for empty string', () => {
      expect(() => new ConfigKey('')).toThrow();
    });

    it('should throw error for whitespace only string', () => {
      expect(() => new ConfigKey('   ')).toThrow();
    });

    it('should throw error for invalid characters', () => {
      expect(() => new ConfigKey('invalid-key!')).toThrow();
      expect(() => new ConfigKey('invalid key')).toThrow();
      expect(() => new ConfigKey('invalid@key')).toThrow();
    });

    it('should throw error for key too long', () => {
      const longKey = 'a'.repeat(101);
      expect(() => new ConfigKey(longKey)).toThrow();
    });
  });
});

describe('ConfigValue', () => {
  describe('constructor', () => {
    it('should create a valid ConfigValue', () => {
      const configValue = new ConfigValue('valid_value');
      expect(configValue.value).toBe('valid_value');
    });

    it('should create a valid ConfigValue with special characters', () => {
      const configValue = new ConfigValue('value with spaces and @#$%');
      expect(configValue.value).toBe('value with spaces and @#$%');
    });

    it('should throw error for value too long', () => {
      const longValue = 'a'.repeat(1001);
      expect(() => new ConfigValue(longValue)).toThrow();
    });
  });
});
