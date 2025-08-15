/**
 * @file index.ts
 * @description 租户管理领域层索引文件
 * 
 * 导出所有租户管理领域的核心对象，包括：
 * - 实体（Entities）
 * - 值对象（Value Objects）
 * - 领域服务（Domain Services）
 * - 仓储接口（Repository Interfaces）
 * - 领域事件（Domain Events）
 */

// 实体
export { Tenant } from './entities/tenant.entity';
export { TenantApplication } from './entities/tenant-application.entity';
export { TenantDomainChangeApplication } from './entities/tenant-domain-change-application.entity';

// 值对象
export { TenantId } from './value-objects/tenant-id';
export { TenantCode } from './value-objects/tenant-code';
export { TenantName } from './value-objects/tenant-name';
export { TenantStatus, TenantStatusEnum } from './value-objects/tenant-status';
export { ApplicationId } from './value-objects/application-id';
export { ApplicationStatus } from './value-objects/application-status';

// 领域服务
export { TenantDomainService } from './services/tenant-domain.service';
export { SystemInitializationService } from './services/system-initialization.service';
export { ApplicationReviewService } from './services/application-review.service';

// 仓储接口
export { ITenantRepository } from './repositories/tenant-repository.interface';

// 领域事件
export { TenantCreatedEvent } from './events/tenant-created.event';
export { TenantRenamedEvent } from './events/tenant-renamed.event';
export { TenantStatusChangedEvent } from './events/tenant-status-changed.event';
export { TenantAdminChangedEvent } from './events/tenant-admin-changed.event';
export { TenantApplicationSubmittedEvent } from './events/tenant-application-submitted.event';
export { TenantApplicationReviewedEvent } from './events/tenant-application-reviewed.event';
export { TenantDomainChangeApplicationSubmittedEvent } from './events/tenant-domain-change-application-submitted.event';
export { TenantDomainChangeApplicationReviewedEvent } from './events/tenant-domain-change-application-reviewed.event';

// 异常
export { TenantDomainException } from './exceptions/tenant-domain.exception';
export { TenantNotFoundException } from './exceptions/tenant-domain.exception';
export { TenantCodeAlreadyExistsException } from './exceptions/tenant-domain.exception';
export { TenantNameAlreadyExistsException } from './exceptions/tenant-domain.exception';
export { SystemTenantCannotBeDeactivatedException } from './exceptions/tenant-domain.exception';
export { SystemTenantCannotBeDeletedException } from './exceptions/tenant-domain.exception';

// 类型定义
export type { TenantSnapshot } from './entities/tenant.entity';
