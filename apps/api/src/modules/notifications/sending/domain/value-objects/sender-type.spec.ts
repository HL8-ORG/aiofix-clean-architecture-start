import { SenderType, SenderTypeEnum } from './sender-type';

describe('SenderType', () => {
  describe('constructor', () => {
    it('should create a valid SenderType with EMAIL', () => {
      const senderType = new SenderType(SenderTypeEnum.EMAIL);
      expect(senderType.value).toBe(SenderTypeEnum.EMAIL);
    });

    it('should create a valid SenderType with SMS', () => {
      const senderType = new SenderType(SenderTypeEnum.SMS);
      expect(senderType.value).toBe(SenderTypeEnum.SMS);
    });

    it('should create a valid SenderType with PUSH', () => {
      const senderType = new SenderType(SenderTypeEnum.PUSH);
      expect(senderType.value).toBe(SenderTypeEnum.PUSH);
    });

    it('should create a valid SenderType with WEBHOOK', () => {
      const senderType = new SenderType(SenderTypeEnum.WEBHOOK);
      expect(senderType.value).toBe(SenderTypeEnum.WEBHOOK);
    });

    it('should create a valid SenderType with CUSTOM', () => {
      const senderType = new SenderType(SenderTypeEnum.CUSTOM);
      expect(senderType.value).toBe(SenderTypeEnum.CUSTOM);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify EMAIL type', () => {
      const senderType = new SenderType(SenderTypeEnum.EMAIL);
      expect(senderType.isEmail()).toBe(true);
      expect(senderType.isSms()).toBe(false);
      expect(senderType.isPush()).toBe(false);
      expect(senderType.isWebhook()).toBe(false);
      expect(senderType.isCustom()).toBe(false);
    });

    it('should correctly identify SMS type', () => {
      const senderType = new SenderType(SenderTypeEnum.SMS);
      expect(senderType.isEmail()).toBe(false);
      expect(senderType.isSms()).toBe(true);
      expect(senderType.isPush()).toBe(false);
      expect(senderType.isWebhook()).toBe(false);
      expect(senderType.isCustom()).toBe(false);
    });

    it('should correctly identify PUSH type', () => {
      const senderType = new SenderType(SenderTypeEnum.PUSH);
      expect(senderType.isEmail()).toBe(false);
      expect(senderType.isSms()).toBe(false);
      expect(senderType.isPush()).toBe(true);
      expect(senderType.isWebhook()).toBe(false);
      expect(senderType.isCustom()).toBe(false);
    });

    it('should correctly identify WEBHOOK type', () => {
      const senderType = new SenderType(SenderTypeEnum.WEBHOOK);
      expect(senderType.isEmail()).toBe(false);
      expect(senderType.isSms()).toBe(false);
      expect(senderType.isPush()).toBe(false);
      expect(senderType.isWebhook()).toBe(true);
      expect(senderType.isCustom()).toBe(false);
    });

    it('should correctly identify CUSTOM type', () => {
      const senderType = new SenderType(SenderTypeEnum.CUSTOM);
      expect(senderType.isEmail()).toBe(false);
      expect(senderType.isSms()).toBe(false);
      expect(senderType.isPush()).toBe(false);
      expect(senderType.isWebhook()).toBe(false);
      expect(senderType.isCustom()).toBe(true);
    });
  });

  describe('requiresAuthentication', () => {
    it('should return true for types requiring authentication', () => {
      const typesRequiringAuth = [
        SenderTypeEnum.EMAIL,
        SenderTypeEnum.SMS,
        SenderTypeEnum.PUSH,
        SenderTypeEnum.SLACK,
        SenderTypeEnum.DINGTALK,
        SenderTypeEnum.WECHAT,
        SenderTypeEnum.TELEGRAM,
        SenderTypeEnum.DISCORD
      ];

      typesRequiringAuth.forEach(type => {
        const senderType = new SenderType(type);
        expect(senderType.requiresAuthentication()).toBe(true);
      });
    });

    it('should return false for types not requiring authentication', () => {
      const typesNotRequiringAuth = [
        SenderTypeEnum.WEBHOOK,
        SenderTypeEnum.CUSTOM
      ];

      typesNotRequiringAuth.forEach(type => {
        const senderType = new SenderType(type);
        expect(senderType.requiresAuthentication()).toBe(false);
      });
    });
  });

  describe('supportsRetry', () => {
    it('should return true for types supporting retry', () => {
      const typesSupportingRetry = [
        SenderTypeEnum.EMAIL,
        SenderTypeEnum.SMS,
        SenderTypeEnum.PUSH,
        SenderTypeEnum.WEBHOOK
      ];

      typesSupportingRetry.forEach(type => {
        const senderType = new SenderType(type);
        expect(senderType.supportsRetry()).toBe(true);
      });
    });

    it('should return false for types not supporting retry', () => {
      const typesNotSupportingRetry = [
        SenderTypeEnum.SLACK,
        SenderTypeEnum.DINGTALK,
        SenderTypeEnum.WECHAT,
        SenderTypeEnum.TELEGRAM,
        SenderTypeEnum.DISCORD,
        SenderTypeEnum.CUSTOM
      ];

      typesNotSupportingRetry.forEach(type => {
        const senderType = new SenderType(type);
        expect(senderType.supportsRetry()).toBe(false);
      });
    });
  });

  describe('getMaxRetryCount', () => {
    it('should return correct retry count for each type', () => {
      const retryCounts = {
        [SenderTypeEnum.EMAIL]: 3,
        [SenderTypeEnum.SMS]: 2,
        [SenderTypeEnum.PUSH]: 3,
        [SenderTypeEnum.WEBHOOK]: 5,
        [SenderTypeEnum.SLACK]: 2,
        [SenderTypeEnum.DINGTALK]: 2,
        [SenderTypeEnum.WECHAT]: 2,
        [SenderTypeEnum.TELEGRAM]: 2,
        [SenderTypeEnum.DISCORD]: 2,
        [SenderTypeEnum.CUSTOM]: 3
      };

      Object.entries(retryCounts).forEach(([type, expectedCount]) => {
        const senderType = new SenderType(type as SenderTypeEnum);
        expect(senderType.getMaxRetryCount()).toBe(expectedCount);
      });
    });
  });

  describe('getTimeout', () => {
    it('should return correct timeout for each type', () => {
      const timeouts = {
        [SenderTypeEnum.EMAIL]: 30000,
        [SenderTypeEnum.SMS]: 10000,
        [SenderTypeEnum.PUSH]: 15000,
        [SenderTypeEnum.WEBHOOK]: 60000,
        [SenderTypeEnum.SLACK]: 20000,
        [SenderTypeEnum.DINGTALK]: 20000,
        [SenderTypeEnum.WECHAT]: 20000,
        [SenderTypeEnum.TELEGRAM]: 20000,
        [SenderTypeEnum.DISCORD]: 20000,
        [SenderTypeEnum.CUSTOM]: 30000
      };

      Object.entries(timeouts).forEach(([type, expectedTimeout]) => {
        const senderType = new SenderType(type as SenderTypeEnum);
        expect(senderType.getTimeout()).toBe(expectedTimeout);
      });
    });
  });

  describe('getDisplayName', () => {
    it('should return correct display name for each type', () => {
      const displayNames = {
        [SenderTypeEnum.EMAIL]: '邮件',
        [SenderTypeEnum.SMS]: '短信',
        [SenderTypeEnum.PUSH]: '推送通知',
        [SenderTypeEnum.WEBHOOK]: 'Webhook',
        [SenderTypeEnum.SLACK]: 'Slack',
        [SenderTypeEnum.DINGTALK]: '钉钉',
        [SenderTypeEnum.WECHAT]: '微信',
        [SenderTypeEnum.TELEGRAM]: 'Telegram',
        [SenderTypeEnum.DISCORD]: 'Discord',
        [SenderTypeEnum.CUSTOM]: '自定义'
      };

      Object.entries(displayNames).forEach(([type, expectedName]) => {
        const senderType = new SenderType(type as SenderTypeEnum);
        expect(senderType.getDisplayName()).toBe(expectedName);
      });
    });
  });

  describe('getDescription', () => {
    it('should return correct description for each type', () => {
      const descriptions = {
        [SenderTypeEnum.EMAIL]: '通过SMTP服务器发送邮件通知',
        [SenderTypeEnum.SMS]: '通过短信网关发送短信通知',
        [SenderTypeEnum.PUSH]: '通过推送服务发送移动端通知',
        [SenderTypeEnum.WEBHOOK]: '通过HTTP请求发送Webhook通知',
        [SenderTypeEnum.SLACK]: '通过Slack API发送频道消息',
        [SenderTypeEnum.DINGTALK]: '通过钉钉API发送工作通知',
        [SenderTypeEnum.WECHAT]: '通过微信API发送企业消息',
        [SenderTypeEnum.TELEGRAM]: '通过Telegram Bot API发送消息',
        [SenderTypeEnum.DISCORD]: '通过Discord Webhook发送消息',
        [SenderTypeEnum.CUSTOM]: '自定义发送方式，需要配置发送逻辑'
      };

      Object.entries(descriptions).forEach(([type, expectedDescription]) => {
        const senderType = new SenderType(type as SenderTypeEnum);
        expect(senderType.getDescription()).toBe(expectedDescription);
      });
    });
  });
});
