/**
 * @file users.module.ts
 * @description 用户领域主模块
 * 
 * 该模块整合用户领域的所有子领域模块，包括：
 * - 用户管理 (management)
 * - 用户档案 (profiles)
 * - 用户偏好 (preferences)
 * - 用户注册 (registration)
 * - 用户租户变更 (tenant-change)
 * 
 * 遵循DDD和Clean Architecture原则，通过依赖注入管理各子领域间的协作。
 */

import { Module } from '@nestjs/common';

// TODO: 导入各子领域模块
// import { UserManagementModule } from './management/user-management.module';
// import { UserProfilesModule } from './profiles/user-profiles.module';
// import { UserPreferencesModule } from './preferences/user-preferences.module';
// import { UserRegistrationModule } from './registration/user-registration.module';
// import { UserTenantChangeModule } from './tenant-change/user-tenant-change.module';

@Module({
  imports: [
    // TODO: 添加各子领域模块
    // UserManagementModule,
    // UserProfilesModule,
    // UserPreferencesModule,
    // UserRegistrationModule,
    // UserTenantChangeModule,
  ],
  controllers: [
    // TODO: 添加用户领域控制器
  ],
  providers: [
    // TODO: 添加用户领域服务
  ],
  exports: [
    // TODO: 导出用户领域公共接口
  ],
})
export class UsersModule { }
