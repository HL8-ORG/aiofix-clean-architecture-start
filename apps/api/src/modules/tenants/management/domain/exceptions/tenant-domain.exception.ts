/**
 * @class TenantDomainException
 * @description 租户领域异常基类
 * 
 * 用于表示租户管理领域中的业务异常，包括：
 * - 租户创建异常
 * - 租户更新异常
 * - 租户状态变更异常
 * - 租户管理员变更异常
 */
export class TenantDomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TenantDomainException';
  }
}

/**
 * @class TenantNotFoundException
 * @description 租户未找到异常
 */
export class TenantNotFoundException extends TenantDomainException {
  constructor(tenantId: string) {
    super(
      `Tenant with id '${tenantId}' not found`,
      'TENANT_NOT_FOUND',
      { tenantId }
    );
    this.name = 'TenantNotFoundException';
  }
}

/**
 * @class TenantCodeAlreadyExistsException
 * @description 租户代码已存在异常
 */
export class TenantCodeAlreadyExistsException extends TenantDomainException {
  constructor(code: string) {
    super(
      `Tenant code '${code}' already exists`,
      'TENANT_CODE_ALREADY_EXISTS',
      { code }
    );
    this.name = 'TenantCodeAlreadyExistsException';
  }
}

/**
 * @class TenantNameAlreadyExistsException
 * @description 租户名称已存在异常
 */
export class TenantNameAlreadyExistsException extends TenantDomainException {
  constructor(name: string) {
    super(
      `Tenant name '${name}' already exists`,
      'TENANT_NAME_ALREADY_EXISTS',
      { name }
    );
    this.name = 'TenantNameAlreadyExistsException';
  }
}

/**
 * @class TenantDomainAlreadyExistsException
 * @description 租户域名已存在异常
 */
export class TenantDomainAlreadyExistsException extends TenantDomainException {
  constructor(domain: string) {
    super(
      `Domain '${domain}' is already in use`,
      'TENANT_DOMAIN_ALREADY_EXISTS',
      { domain }
    );
    this.name = 'TenantDomainAlreadyExistsException';
  }
}

/**
 * @class TenantAdminAlreadyExistsException
 * @description 租户管理员已存在异常
 */
export class TenantAdminAlreadyExistsException extends TenantDomainException {
  constructor(adminId: string) {
    super(
      `User '${adminId}' is already an admin of another tenant`,
      'TENANT_ADMIN_ALREADY_EXISTS',
      { adminId }
    );
    this.name = 'TenantAdminAlreadyExistsException';
  }
}

/**
 * @class SystemTenantCannotBeDeactivatedException
 * @description 系统租户不能被停用异常
 */
export class SystemTenantCannotBeDeactivatedException extends TenantDomainException {
  constructor() {
    super(
      'System tenant cannot be deactivated',
      'SYSTEM_TENANT_CANNOT_BE_DEACTIVATED'
    );
    this.name = 'SystemTenantCannotBeDeactivatedException';
  }
}

/**
 * @class SystemTenantCannotBeDeletedException
 * @description 系统租户不能被删除异常
 */
export class SystemTenantCannotBeDeletedException extends TenantDomainException {
  constructor() {
    super(
      'System tenant cannot be deleted',
      'SYSTEM_TENANT_CANNOT_BE_DELETED'
    );
    this.name = 'SystemTenantCannotBeDeletedException';
  }
}

/**
 * @class InvalidTenantStatusTransitionException
 * @description 无效的租户状态转换异常
 */
export class InvalidTenantStatusTransitionException extends TenantDomainException {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Invalid status transition from '${fromStatus}' to '${toStatus}'`,
      'INVALID_TENANT_STATUS_TRANSITION',
      { fromStatus, toStatus }
    );
    this.name = 'InvalidTenantStatusTransitionException';
  }
}

/**
 * @class InvalidTenantDomainException
 * @description 无效的租户域名异常
 */
export class InvalidTenantDomainException extends TenantDomainException {
  constructor(domain: string, reason: string) {
    super(
      `Invalid domain '${domain}': ${reason}`,
      'INVALID_TENANT_DOMAIN',
      { domain, reason }
    );
    this.name = 'InvalidTenantDomainException';
  }
}

/**
 * @class TenantCannotBeDeletedException
 * @description 租户不能被删除异常
 */
export class TenantCannotBeDeletedException extends TenantDomainException {
  constructor(tenantId: string, reason: string) {
    super(
      `Tenant '${tenantId}' cannot be deleted: ${reason}`,
      'TENANT_CANNOT_BE_DELETED',
      { tenantId, reason }
    );
    this.name = 'TenantCannotBeDeletedException';
  }
}
