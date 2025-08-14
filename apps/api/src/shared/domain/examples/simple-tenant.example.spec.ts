import { SimpleTenant, SimpleTenantCreatedEvent } from './simple-tenant.example';

describe('SimpleTenant Aggregate', () => {
  it('should create a tenant with name', () => {
    const tenant = new SimpleTenant('tenant-1', 'Acme Corp');

    expect(tenant.id).toBe('tenant-1');
    expect(tenant.name).toBe('Acme Corp');
    expect(tenant.version).toBe(1);
    expect(tenant.hasUncommittedEvents()).toBe(true);
    expect(tenant.uncommittedEvents).toHaveLength(1);
    expect(tenant.uncommittedEvents[0]).toBeInstanceOf(SimpleTenantCreatedEvent);
  });

  it('should rebuild tenant from event history', () => {
    const originalTenant = new SimpleTenant('tenant-1', 'Acme Corp');
    const events = originalTenant.uncommittedEvents;

    const rebuiltTenant = SimpleTenant.fromHistory('tenant-1', events);

    expect(rebuiltTenant.id).toBe(originalTenant.id);
    expect(rebuiltTenant.name).toBe(originalTenant.name);
    expect(rebuiltTenant.hasUncommittedEvents()).toBe(false);
    expect(rebuiltTenant.uncommittedEvents).toHaveLength(0);
  });
});
