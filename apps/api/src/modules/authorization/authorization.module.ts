/**
 * @file authorization.module.ts
 * @description 授权领域主模块
 * 
 * 该模块整合授权领域的所有子领域模块，包括：
 * - 权限管理 (permissions)
 * - 角色管理 (roles)
 * - 策略管理 (policies)
 * - CASL集成 (casl)
 * - 基于组织的访问控制 (obac)
 * 
 * 遵循DDD和Clean Architecture原则，通过依赖注入管理各子领域间的协作。
 */

import { Module } from '@nestjs/common';

// TODO: 导入各子领域模块
// import { PermissionsModule } from './permissions/permissions.module';
// import { RolesModule } from './roles/roles.module';
// import { PoliciesModule } from './policies/policies.module';
// import { CaslModule } from './casl/casl.module';
// import { ObacModule } from './obac/obac.module';

@Module({
  imports: [
    // TODO: 添加各子领域模块
    // PermissionsModule,
    // RolesModule,
    // PoliciesModule,
    // CaslModule,
    // ObacModule,
  ],
  controllers: [
    // TODO: 添加授权领域控制器
  ],
  providers: [
    // TODO: 添加授权领域服务
  ],
  exports: [
    // TODO: 导出授权领域公共接口
  ],
})
export class AuthorizationModule { }
