import { SenderStatus, SenderStatusEnum } from './sender-status';

describe('SenderStatus', () => {
  describe('constructor', () => {
    it('should create a valid SenderStatus with ACTIVE', () => {
      const status = new SenderStatus(SenderStatusEnum.ACTIVE);
      expect(status.value).toBe(SenderStatusEnum.ACTIVE);
    });

    it('should create a valid SenderStatus with INACTIVE', () => {
      const status = new SenderStatus(SenderStatusEnum.INACTIVE);
      expect(status.value).toBe(SenderStatusEnum.INACTIVE);
    });

    it('should create a valid SenderStatus with MAINTENANCE', () => {
      const status = new SenderStatus(SenderStatusEnum.MAINTENANCE);
      expect(status.value).toBe(SenderStatusEnum.MAINTENANCE);
    });

    it('should create a valid SenderStatus with ERROR', () => {
      const status = new SenderStatus(SenderStatusEnum.ERROR);
      expect(status.value).toBe(SenderStatusEnum.ERROR);
    });

    it('should create a valid SenderStatus with SUSPENDED', () => {
      const status = new SenderStatus(SenderStatusEnum.SUSPENDED);
      expect(status.value).toBe(SenderStatusEnum.SUSPENDED);
    });

    it('should create a valid SenderStatus with TESTING', () => {
      const status = new SenderStatus(SenderStatusEnum.TESTING);
      expect(status.value).toBe(SenderStatusEnum.TESTING);
    });
  });

  describe('status checking methods', () => {
    it('should correctly identify ACTIVE status', () => {
      const status = new SenderStatus(SenderStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
      expect(status.isInactive()).toBe(false);
      expect(status.isMaintenance()).toBe(false);
      expect(status.isError()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isTesting()).toBe(false);
    });

    it('should correctly identify INACTIVE status', () => {
      const status = new SenderStatus(SenderStatusEnum.INACTIVE);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(true);
      expect(status.isMaintenance()).toBe(false);
      expect(status.isError()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isTesting()).toBe(false);
    });

    it('should correctly identify MAINTENANCE status', () => {
      const status = new SenderStatus(SenderStatusEnum.MAINTENANCE);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(false);
      expect(status.isMaintenance()).toBe(true);
      expect(status.isError()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isTesting()).toBe(false);
    });

    it('should correctly identify ERROR status', () => {
      const status = new SenderStatus(SenderStatusEnum.ERROR);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(false);
      expect(status.isMaintenance()).toBe(false);
      expect(status.isError()).toBe(true);
      expect(status.isSuspended()).toBe(false);
      expect(status.isTesting()).toBe(false);
    });

    it('should correctly identify SUSPENDED status', () => {
      const status = new SenderStatus(SenderStatusEnum.SUSPENDED);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(false);
      expect(status.isMaintenance()).toBe(false);
      expect(status.isError()).toBe(false);
      expect(status.isSuspended()).toBe(true);
      expect(status.isTesting()).toBe(false);
    });

    it('should correctly identify TESTING status', () => {
      const status = new SenderStatus(SenderStatusEnum.TESTING);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(false);
      expect(status.isMaintenance()).toBe(false);
      expect(status.isError()).toBe(false);
      expect(status.isSuspended()).toBe(false);
      expect(status.isTesting()).toBe(true);
    });
  });

  describe('canSend', () => {
    it('should return true for statuses that can send', () => {
      const canSendStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.TESTING
      ];

      canSendStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canSend()).toBe(true);
      });
    });

    it('should return false for statuses that cannot send', () => {
      const cannotSendStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED
      ];

      cannotSendStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canSend()).toBe(false);
      });
    });
  });

  describe('canActivate', () => {
    it('should return true for statuses that can be activated', () => {
      const canActivateStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.SUSPENDED,
        SenderStatusEnum.TESTING
      ];

      canActivateStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canActivate()).toBe(true);
      });
    });

    it('should return false for statuses that cannot be activated', () => {
      const cannotActivateStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR
      ];

      cannotActivateStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canActivate()).toBe(false);
      });
    });
  });

  describe('canDeactivate', () => {
    it('should return true for statuses that can be deactivated', () => {
      const canDeactivateStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.TESTING
      ];

      canDeactivateStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canDeactivate()).toBe(true);
      });
    });

    it('should return false for statuses that cannot be deactivated', () => {
      const cannotDeactivateStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED
      ];

      cannotDeactivateStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canDeactivate()).toBe(false);
      });
    });
  });

  describe('canSuspend', () => {
    it('should return true for statuses that can be suspended', () => {
      const canSuspendStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.TESTING
      ];

      canSuspendStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canSuspend()).toBe(true);
      });
    });

    it('should return false for statuses that cannot be suspended', () => {
      const cannotSuspendStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED
      ];

      cannotSuspendStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canSuspend()).toBe(false);
      });
    });
  });

  describe('canResume', () => {
    it('should return true for statuses that can be resumed', () => {
      const canResumeStatuses = [
        SenderStatusEnum.SUSPENDED,
        SenderStatusEnum.MAINTENANCE
      ];

      canResumeStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canResume()).toBe(true);
      });
    });

    it('should return false for statuses that cannot be resumed', () => {
      const cannotResumeStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.TESTING
      ];

      cannotResumeStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canResume()).toBe(false);
      });
    });
  });

  describe('canEnterMaintenance', () => {
    it('should return true for statuses that can enter maintenance', () => {
      const canEnterMaintenanceStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.TESTING
      ];

      canEnterMaintenanceStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canEnterMaintenance()).toBe(true);
      });
    });

    it('should return false for statuses that cannot enter maintenance', () => {
      const cannotEnterMaintenanceStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED
      ];

      cannotEnterMaintenanceStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canEnterMaintenance()).toBe(false);
      });
    });
  });

  describe('canExitMaintenance', () => {
    it('should return true for MAINTENANCE status', () => {
      const status = new SenderStatus(SenderStatusEnum.MAINTENANCE);
      expect(status.canExitMaintenance()).toBe(true);
    });

    it('should return false for non-MAINTENANCE statuses', () => {
      const nonMaintenanceStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED,
        SenderStatusEnum.TESTING
      ];

      nonMaintenanceStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canExitMaintenance()).toBe(false);
      });
    });
  });

  describe('canEnterError', () => {
    it('should return true for statuses that can enter error', () => {
      const canEnterErrorStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.TESTING
      ];

      canEnterErrorStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canEnterError()).toBe(true);
      });
    });

    it('should return false for statuses that cannot enter error', () => {
      const cannotEnterErrorStatuses = [
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.ERROR,
        SenderStatusEnum.SUSPENDED
      ];

      cannotEnterErrorStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canEnterError()).toBe(false);
      });
    });
  });

  describe('canExitError', () => {
    it('should return true for ERROR status', () => {
      const status = new SenderStatus(SenderStatusEnum.ERROR);
      expect(status.canExitError()).toBe(true);
    });

    it('should return false for non-ERROR statuses', () => {
      const nonErrorStatuses = [
        SenderStatusEnum.ACTIVE,
        SenderStatusEnum.INACTIVE,
        SenderStatusEnum.MAINTENANCE,
        SenderStatusEnum.SUSPENDED,
        SenderStatusEnum.TESTING
      ];

      nonErrorStatuses.forEach(statusEnum => {
        const status = new SenderStatus(statusEnum);
        expect(status.canExitError()).toBe(false);
      });
    });
  });

  describe('getDisplayName', () => {
    it('should return correct display name for each status', () => {
      const displayNames = {
        [SenderStatusEnum.ACTIVE]: '激活',
        [SenderStatusEnum.INACTIVE]: '非激活',
        [SenderStatusEnum.MAINTENANCE]: '维护中',
        [SenderStatusEnum.ERROR]: '错误',
        [SenderStatusEnum.SUSPENDED]: '暂停',
        [SenderStatusEnum.TESTING]: '测试中'
      };

      Object.entries(displayNames).forEach(([status, expectedName]) => {
        const senderStatus = new SenderStatus(status as SenderStatusEnum);
        expect(senderStatus.getDisplayName()).toBe(expectedName);
      });
    });
  });

  describe('getDescription', () => {
    it('should return correct description for each status', () => {
      const descriptions = {
        [SenderStatusEnum.ACTIVE]: '发送者正常运行，可以发送通知',
        [SenderStatusEnum.INACTIVE]: '发送者已停用，不能发送通知',
        [SenderStatusEnum.MAINTENANCE]: '发送者正在维护中，暂时不能发送通知',
        [SenderStatusEnum.ERROR]: '发送者出现错误，需要人工干预',
        [SenderStatusEnum.SUSPENDED]: '发送者已暂停，不能发送通知',
        [SenderStatusEnum.TESTING]: '发送者处于测试状态，可以发送测试通知'
      };

      Object.entries(descriptions).forEach(([status, expectedDescription]) => {
        const senderStatus = new SenderStatus(status as SenderStatusEnum);
        expect(senderStatus.getDescription()).toBe(expectedDescription);
      });
    });
  });

  describe('getColor', () => {
    it('should return correct color for each status', () => {
      const colors = {
        [SenderStatusEnum.ACTIVE]: '#52c41a',
        [SenderStatusEnum.INACTIVE]: '#d9d9d9',
        [SenderStatusEnum.MAINTENANCE]: '#faad14',
        [SenderStatusEnum.ERROR]: '#ff4d4f',
        [SenderStatusEnum.SUSPENDED]: '#ff7a45',
        [SenderStatusEnum.TESTING]: '#1890ff'
      };

      Object.entries(colors).forEach(([status, expectedColor]) => {
        const senderStatus = new SenderStatus(status as SenderStatusEnum);
        expect(senderStatus.getColor()).toBe(expectedColor);
      });
    });
  });
});
