/**
 * @file authz.module.ts
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

// 导入应用层模块
import { PermissionApplicationModule } from './permissions/application/application.module';
import { RoleApplicationModule } from './roles/application/application.module';

// TODO: 导入其他子领域模块
// import { PoliciesModule } from './policies/policies.module';
// import { CaslModule } from './casl/casl.module';
// import { ObacModule } from './obac/obac.module';

@Module({
  imports: [
    // 应用层模块
    PermissionApplicationModule,
    RoleApplicationModule,

    // TODO: 添加其他子领域模块
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
    // 导出应用层服务
    PermissionApplicationModule,
    RoleApplicationModule,

    // TODO: 导出其他子领域接口
  ],
})
export class AuthzModule { }
