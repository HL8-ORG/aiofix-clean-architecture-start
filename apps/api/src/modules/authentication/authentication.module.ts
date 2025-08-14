/**
 * @file authentication.module.ts
 * @description 认证领域主模块
 * 
 * 该模块整合认证领域的所有子领域模块，包括：
 * - 登录管理 (login)
 * - 密码管理 (password)
 * - 多因子认证 (mfa)
 * - 会话管理 (sessions)
 * 
 * 遵循DDD和Clean Architecture原则，通过依赖注入管理各子领域间的协作。
 */

import { Module } from '@nestjs/common';

// TODO: 导入各子领域模块
// import { LoginModule } from './login/login.module';
// import { PasswordModule } from './password/password.module';
// import { MfaModule } from './mfa/mfa.module';
// import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    // TODO: 添加各子领域模块
    // LoginModule,
    // PasswordModule,
    // MfaModule,
    // SessionsModule,
  ],
  controllers: [
    // TODO: 添加认证领域控制器
  ],
  providers: [
    // TODO: 添加认证领域服务
  ],
  exports: [
    // TODO: 导出认证领域公共接口
  ],
})
export class AuthenticationModule { }
