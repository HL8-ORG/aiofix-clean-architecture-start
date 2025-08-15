/**
 * @file index.ts
 * @description 租户管理领域异常索引文件
 * 
 * 导出所有租户相关的领域异常
 */

export { TenantDomainException } from './tenant-domain.exception';
export { TenantNotFoundException } from './tenant-domain.exception';
export { TenantCodeAlreadyExistsException } from './tenant-domain.exception';
export { TenantNameAlreadyExistsException } from './tenant-domain.exception';
export { TenantDomainAlreadyExistsException } from './tenant-domain.exception';
export { TenantAdminAlreadyExistsException } from './tenant-domain.exception';
export { SystemTenantCannotBeDeactivatedException } from './tenant-domain.exception';
export { SystemTenantCannotBeDeletedException } from './tenant-domain.exception';
export { InvalidTenantStatusTransitionException } from './tenant-domain.exception';
export { InvalidTenantDomainException } from './tenant-domain.exception';
export { TenantCannotBeDeletedException } from './tenant-domain.exception';
