import { Tenant } from './tenant.entity';
import { TenantId } from '../value-objects/tenant-id';
import { TenantCode } from '../value-objects/tenant-code';
import { TenantName } from '../value-objects/tenant-name';
import { TenantStatus } from '../value-objects/tenant-status';
import { UserId } from '../../../../users/management/domain/value-objects/user-id';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantRenamedEvent } from '../events/tenant-renamed.event';
import { TenantStatusChangedEvent } from '../events/tenant-status-changed.event';
import { TenantAdminChangedEvent } from '../events/tenant-admin-changed.event';

describe('Tenant Entity', () => {
  let tenant: Tenant;
  let tenantId: TenantId;
  let tenantCode: TenantCode;
  let tenantName: TenantName;
  let adminId: UserId;

  beforeEach(() => {
    tenantId = new TenantId('550e8400-e29b-41d4-a716-446655440000');
    tenantCode = new TenantCode('test-tenant');
    tenantName = new TenantName('Test Tenant');
    adminId = new UserId('550e8400-e29b-41d4-a716-446655440001');
  });

  describe('create', () => {
    it('should create a new tenant with correct properties', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId, 'Test description', 'test.com');

      expect(tenant.id.value).toBeDefined();
      expect(tenant.code.value).toBe('test-tenant');
      expect(tenant.name.value).toBe('Test Tenant');
      expect(tenant.adminId.value).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(tenant.description).toBe('Test description');
      expect(tenant.domain).toBe('test.com');
      expect(tenant.status.value).toBe('ACTIVE');
      expect(tenant.config).toEqual({});
      expect(tenant.createdAt).toBeInstanceOf(Date);
      expect(tenant.updatedAt).toBeInstanceOf(Date);
    });

    it('should publish TenantCreatedEvent when created', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);

      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantCreatedEvent);
      expect(tenant.uncommittedEvents[0].eventType).toBe('TenantCreated');
    });

    it('should create tenant without optional parameters', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);

      expect(tenant.description).toBeUndefined();
      expect(tenant.domain).toBeUndefined();
    });
  });

  describe('rename', () => {
    beforeEach(() => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      tenant.markEventsAsCommitted();
    });

    it('should rename tenant with new name', () => {
      const newName = new TenantName('New Tenant Name');
      const renamedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.rename(newName, renamedBy);

      expect(tenant.name.value).toBe('New Tenant Name');
      expect(tenant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should publish TenantRenamedEvent when renamed', () => {
      const newName = new TenantName('New Tenant Name');
      const renamedBy = '550e8400-e29b-41d4-a716-446655440003';

      tenant.rename(newName, renamedBy);

      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantRenamedEvent);
      expect(tenant.uncommittedEvents[0].eventType).toBe('TenantRenamed');
    });

    it('should not rename if name is the same', () => {
      const sameName = new TenantName('Test Tenant');
      const renamedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.rename(sameName, renamedBy);

      expect(tenant.uncommittedEvents).toHaveLength(0);
      expect(tenant.updatedAt).toEqual(originalUpdatedAt);
    });
  });

  describe('changeStatus', () => {
    beforeEach(() => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      tenant.markEventsAsCommitted();
    });

    it('should change tenant status', () => {
      const newStatus = TenantStatus.INACTIVE;
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.changeStatus(newStatus, changedBy);

      expect(tenant.status.value).toBe('INACTIVE');
      expect(tenant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should publish TenantStatusChangedEvent when status changed', () => {
      const newStatus = TenantStatus.INACTIVE;
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';

      tenant.changeStatus(newStatus, changedBy);

      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantStatusChangedEvent);
      expect(tenant.uncommittedEvents[0].eventType).toBe('TenantStatusChanged');
    });

    it('should not change status if status is the same', () => {
      const sameStatus = TenantStatus.ACTIVE;
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.changeStatus(sameStatus, changedBy);

      expect(tenant.uncommittedEvents).toHaveLength(0);
      expect(tenant.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should throw error when trying to deactivate system tenant', () => {
      const systemTenant = Tenant.create(
        new TenantCode('SYSTEM'),
        new TenantName('System Tenant'),
        adminId
      );
      systemTenant.markEventsAsCommitted();

      expect(() => {
        systemTenant.changeStatus(TenantStatus.INACTIVE, '550e8400-e29b-41d4-a716-446655440003');
      }).toThrow('System tenant cannot be deactivated');
    });
  });

  describe('changeAdmin', () => {
    beforeEach(() => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      tenant.markEventsAsCommitted();
    });

    it('should change tenant admin', () => {
      const newAdminId = new UserId('550e8400-e29b-41d4-a716-446655440002');
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.changeAdmin(newAdminId, changedBy);

      expect(tenant.adminId.value).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(tenant.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should publish TenantAdminChangedEvent when admin changed', () => {
      const newAdminId = new UserId('550e8400-e29b-41d4-a716-446655440002');
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';

      tenant.changeAdmin(newAdminId, changedBy);

      expect(tenant.uncommittedEvents).toHaveLength(1);
      expect(tenant.uncommittedEvents[0]).toBeInstanceOf(TenantAdminChangedEvent);
      expect(tenant.uncommittedEvents[0].eventType).toBe('TenantAdminChanged');
    });

    it('should not change admin if admin is the same', () => {
      const sameAdminId = new UserId('550e8400-e29b-41d4-a716-446655440001');
      const changedBy = '550e8400-e29b-41d4-a716-446655440003';
      const originalUpdatedAt = tenant.updatedAt;

      tenant.changeAdmin(sameAdminId, changedBy);

      expect(tenant.uncommittedEvents).toHaveLength(0);
      expect(tenant.updatedAt).toEqual(originalUpdatedAt);
    });
  });

  describe('event sourcing', () => {
    it('should load from history events', () => {
      // Create tenant
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      const events = tenant.uncommittedEvents;
      tenant.markEventsAsCommitted();

      // Create new tenant instance and load from history
      const newTenant = new Tenant();
      newTenant.loadFromHistory(events);

      expect(newTenant.id.value).toBe(tenant.id.value);
      expect(newTenant.code.value).toBe(tenant.code.value);
      expect(newTenant.name.value).toBe(tenant.name.value);
      expect(newTenant.adminId.value).toBe(tenant.adminId.value);
      expect(newTenant.status.value).toBe(tenant.status.value);
    });

    it('should handle multiple events in history', () => {
      // Create tenant
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      const events = [...tenant.uncommittedEvents];
      tenant.markEventsAsCommitted();

      // Rename tenant
      tenant.rename(new TenantName('New Name'), '550e8400-e29b-41d4-a716-446655440003');
      events.push(...tenant.uncommittedEvents);
      tenant.markEventsAsCommitted();

      // Change status
      tenant.changeStatus(TenantStatus.INACTIVE, '550e8400-e29b-41d4-a716-446655440003');
      events.push(...tenant.uncommittedEvents);

      // Create new tenant instance and load from history
      const newTenant = new Tenant();
      newTenant.loadFromHistory(events);

      expect(newTenant.name.value).toBe('New Name');
      expect(newTenant.status.value).toBe('INACTIVE');
    });

    it('should create snapshot data', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId, 'Test description', 'test.com');

      const snapshot = tenant.getSnapshotData();

      expect(snapshot.id).toBe(tenant.id.value);
      expect(snapshot.code).toBe(tenant.code.value);
      expect(snapshot.name).toBe(tenant.name.value);
      expect(snapshot.adminId).toBe(tenant.adminId.value);
      expect(snapshot.description).toBe(tenant.description);
      expect(snapshot.domain).toBe(tenant.domain);
      expect(snapshot.status).toBe(tenant.status.value);
      expect(snapshot.config).toEqual(tenant.config);
    });

    it('should load from snapshot data', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId, 'Test description', 'test.com');
      const snapshot = tenant.getSnapshotData();

      const newTenant = new Tenant();
      newTenant.loadFromSnapshot(snapshot);

      expect(newTenant.id.value).toBe(tenant.id.value);
      expect(newTenant.code.value).toBe(tenant.code.value);
      expect(newTenant.name.value).toBe(tenant.name.value);
      expect(newTenant.adminId.value).toBe(tenant.adminId.value);
      expect(newTenant.description).toBe(tenant.description);
      expect(newTenant.domain).toBe(tenant.domain);
      expect(newTenant.status.value).toBe(tenant.status.value);
      expect(newTenant.config).toEqual(tenant.config);
    });
  });

  describe('business rules', () => {
    it('should identify system tenant correctly', () => {
      const systemTenant = Tenant.create(
        new TenantCode('SYSTEM'),
        new TenantName('System Tenant'),
        adminId
      );

      expect(systemTenant.isSystemTenant()).toBe(true);
    });

    it('should identify non-system tenant correctly', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);

      expect(tenant.isSystemTenant()).toBe(false);
    });

    it('should check if tenant is active', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);

      expect(tenant.isActive()).toBe(true);

      tenant.changeStatus(TenantStatus.INACTIVE, 'test-user');
      expect(tenant.isActive()).toBe(false);
    });

    it('should check if tenant can be deleted', () => {
      tenant = Tenant.create(tenantCode, tenantName, adminId);
      expect(tenant.canBeDeleted()).toBe(true);

      const systemTenant = Tenant.create(
        new TenantCode('SYSTEM'),
        new TenantName('System Tenant'),
        adminId
      );
      expect(systemTenant.canBeDeleted()).toBe(false);
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      tenant = Tenant.create(tenantCode, tenantName, adminId, 'Test description', 'test.com');
    });

    it('should return correct values for all getters', () => {
      expect(tenant.id).toBeInstanceOf(TenantId);
      expect(tenant.code).toBeInstanceOf(TenantCode);
      expect(tenant.name).toBeInstanceOf(TenantName);
      expect(tenant.adminId).toBeInstanceOf(UserId);
      expect(tenant.status).toBeInstanceOf(TenantStatus);
      expect(tenant.description).toBe('Test description');
      expect(tenant.domain).toBe('test.com');
      expect(tenant.config).toEqual({});
      expect(tenant.createdAt).toBeInstanceOf(Date);
      expect(tenant.updatedAt).toBeInstanceOf(Date);
    });

    it('should return immutable config object', () => {
      const config = tenant.config;
      config.test = 'value';

      expect(tenant.config).toEqual({});
    });
  });
});
