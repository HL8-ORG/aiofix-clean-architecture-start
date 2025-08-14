/**
 * @file tenants.module.ts
 * @description 租户领域主模块
 * 
 * 该模块整合租户领域的所有子领域模块，包括：
 * - 租户管理 (management)
 * - 租户计费 (billing)
 * - 租户设置 (settings)
 * - 租户申请 (applications)
 * - 租户变更 (tenant-change)
 * 
 * 遵循DDD和Clean Architecture原则，通过依赖注入管理各子领域间的协作。
 */

import { Module } from '@nestjs/common';

// TODO: 导入各子领域模块
// import { TenantManagementModule } from './management/tenant-management.module';
// import { TenantBillingModule } from './billing/tenant-billing.module';
// import { TenantSettingsModule } from './settings/tenant-settings.module';
// import { TenantApplicationsModule } from './applications/tenant-applications.module';
// import { TenantChangeModule } from './tenant-change/tenant-change.module';

@Module({
  imports: [
    // TODO: 添加各子领域模块
    // TenantManagementModule,
    // TenantBillingModule,
    // TenantSettingsModule,
    // TenantApplicationsModule,
    // TenantChangeModule,
  ],
  controllers: [
    // TODO: 添加租户领域控制器
  ],
  providers: [
    // TODO: 添加租户领域服务
  ],
  exports: [
    // TODO: 导出租户领域公共接口
  ],
})
export class TenantsModule { }
