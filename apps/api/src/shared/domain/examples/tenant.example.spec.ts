import { Tenant, TenantStatus, TenantCreatedEvent, TenantRenamedEvent, TenantStatusChangedEvent } from './tenant.example';
import { BusinessRuleException, ValidationException } from '../exceptions/domain.exception';

describe('Tenant Aggregate', () => {
  describe('Creation', () => {
    it('should create a tenant with valid data', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME', 'A test tenant');

      expect(tenant.id).toBe('tenant-1');
      expect(tenant.name).toBe('Acme Corp');
      expect(tenant.code).toBe('ACME');
      expect(tenant.status).toBe(TenantStatus.ACTIVE);
      expect(tenant.description).toBe('A test tenant');
      expect(tenant.version).toBe(1);
      expect(tenant.hasUncommittedEvents()).toBe(true);
      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantCreatedEvent);
    });

    it('should normalize tenant code to uppercase', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'acme');

      expect(tenant.code).toBe('ACME');
    });

    it('should throw validation exception for invalid tenant name', () => {
      expect(() => {
        new Tenant('tenant-1', '', 'ACME');
      }).toThrow(ValidationException);
    });

    it('should throw validation exception for invalid tenant code', () => {
      expect(() => {
        new Tenant('tenant-1', 'Acme Corp', 'a');
      }).toThrow(ValidationException);
    });
  });

  describe('Renaming', () => {
    let tenant: Tenant;

    beforeEach(() => {
      tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.markEventsAsCommitted();
    });

    it('should rename tenant successfully', () => {
      tenant.rename('Acme Corporation');

      expect(tenant.name).toBe('Acme Corporation');
      expect(tenant.version).toBe(2);
      expect(tenant.hasUncommittedEvents()).toBe(true);
      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantRenamedEvent);
    });

    it('should throw business rule exception when renaming deleted tenant', () => {
      tenant.changeStatus(TenantStatus.DELETED);
      tenant.markEventsAsCommitted();

      expect(() => {
        tenant.rename('New Name');
      }).toThrow(BusinessRuleException);
    });
  });

  describe('Status Changes', () => {
    let tenant: Tenant;

    beforeEach(() => {
      tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.markEventsAsCommitted();
    });

    it('should change status from ACTIVE to INACTIVE', () => {
      tenant.changeStatus(TenantStatus.INACTIVE, 'Suspending operations');

      expect(tenant.status).toBe(TenantStatus.INACTIVE);
      expect(tenant.version).toBe(2);
      expect(tenant.hasUncommittedEvents()).toBe(true);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantStatusChangedEvent);
    });

    it('should change status from ACTIVE to SUSPENDED', () => {
      tenant.changeStatus(TenantStatus.SUSPENDED, 'Violation of terms');

      expect(tenant.status).toBe(TenantStatus.SUSPENDED);
    });

    it('should change status from ACTIVE to DELETED', () => {
      tenant.changeStatus(TenantStatus.DELETED, 'Account closure');

      expect(tenant.status).toBe(TenantStatus.DELETED);
    });

    it('should allow reactivation from INACTIVE', () => {
      tenant.changeStatus(TenantStatus.INACTIVE);
      tenant.markEventsAsCommitted();

      tenant.changeStatus(TenantStatus.ACTIVE, 'Reactivation');

      expect(tenant.status).toBe(TenantStatus.ACTIVE);
    });

    it('should allow reactivation from SUSPENDED', () => {
      tenant.changeStatus(TenantStatus.SUSPENDED);
      tenant.markEventsAsCommitted();

      tenant.changeStatus(TenantStatus.ACTIVE, 'Suspension lifted');

      expect(tenant.status).toBe(TenantStatus.ACTIVE);
    });

    it('should throw business rule exception for invalid status transition', () => {
      tenant.changeStatus(TenantStatus.DELETED);
      tenant.markEventsAsCommitted();

      expect(() => {
        tenant.changeStatus(TenantStatus.ACTIVE);
      }).toThrow(BusinessRuleException);
    });
  });

  describe('Description Updates', () => {
    let tenant: Tenant;

    beforeEach(() => {
      tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.markEventsAsCommitted();
    });

    it('should update description successfully', () => {
      tenant.updateDescription('Updated description');

      expect(tenant.description).toBe('Updated description');
    });

    it('should throw business rule exception when updating deleted tenant description', () => {
      tenant.changeStatus(TenantStatus.DELETED);
      tenant.markEventsAsCommitted();

      expect(() => {
        tenant.updateDescription('New description');
      }).toThrow(BusinessRuleException);
    });
  });

  describe('State Queries', () => {
    let tenant: Tenant;

    beforeEach(() => {
      tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.markEventsAsCommitted();
    });

    it('should return true for active tenant', () => {
      expect(tenant.isActive()).toBe(true);
    });

    it('should return false for inactive tenant', () => {
      tenant.changeStatus(TenantStatus.INACTIVE);
      expect(tenant.isActive()).toBe(false);
    });

    it('should return false for deleted tenant', () => {
      tenant.changeStatus(TenantStatus.DELETED);
      expect(tenant.isDeleted()).toBe(true);
    });
  });

  describe('Event Sourcing', () => {
    it('should rebuild tenant from event history', () => {
      // 创建租户并执行一些操作
      const originalTenant = new Tenant('tenant-1', 'Acme Corp', 'ACME', 'Original description');
      originalTenant.rename('Acme Corporation');
      originalTenant.changeStatus(TenantStatus.INACTIVE, 'Suspending operations');
      originalTenant.updateDescription('Updated description');

      // 获取事件历史
      const events = originalTenant.uncommittedEvents;

      // 从事件历史重建租户
      const rebuiltTenant = Tenant.fromHistory('tenant-1', events);

      // 验证重建的租户状态
      expect(rebuiltTenant.id).toBe(originalTenant.id);
      expect(rebuiltTenant.name).toBe(originalTenant.name);
      expect(rebuiltTenant.code).toBe(originalTenant.code);
      expect(rebuiltTenant.status).toBe(originalTenant.status);
      expect(rebuiltTenant.description).toBe(originalTenant.description);
      expect(rebuiltTenant.version).toBe(originalTenant.version);
      expect(rebuiltTenant.hasUncommittedEvents()).toBe(false);
    });

    it('should handle snapshot and restore', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME', 'Test description');
      tenant.rename('Acme Corporation');
      tenant.changeStatus(TenantStatus.INACTIVE);

      // 创建快照
      const snapshot = tenant.toSnapshot();

      // 从快照恢复
      const restoredTenant = new Tenant('tenant-1', 'Temp', 'TEMP');
      restoredTenant.fromSnapshot(snapshot);

      // 验证恢复的状态
      expect(restoredTenant.name).toBe('Acme Corporation');
      expect(restoredTenant.code).toBe('ACME');
      expect(restoredTenant.status).toBe(TenantStatus.INACTIVE);
      expect(restoredTenant.description).toBe('Test description');
    });
  });

  describe('Event Handlers', () => {
    it('should handle TenantCreatedEvent correctly', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      const event = tenant.uncommittedEvents[0] as TenantCreatedEvent;

      expect(event.name).toBe('Acme Corp');
      expect(event.code).toBe('ACME');
      expect(event.status).toBe(TenantStatus.ACTIVE);
    });

    it('should handle TenantRenamedEvent correctly', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.rename('Acme Corporation');
      const event = tenant.uncommittedEvents[1] as TenantRenamedEvent;

      expect(event.oldName).toBe('Acme Corp');
      expect(event.newName).toBe('Acme Corporation');
    });

    it('should handle TenantStatusChangedEvent correctly', () => {
      const tenant = new Tenant('tenant-1', 'Acme Corp', 'ACME');
      tenant.changeStatus(TenantStatus.INACTIVE, 'Suspending operations');
      const event = tenant.uncommittedEvents[1] as TenantStatusChangedEvent;

      expect(event.oldStatus).toBe(TenantStatus.ACTIVE);
      expect(event.newStatus).toBe(TenantStatus.INACTIVE);
      expect(event.reason).toBe('Suspending operations');
    });
  });
});
