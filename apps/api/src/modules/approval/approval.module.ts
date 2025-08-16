/**
 * @file approval.module.ts
 * @description 审批领域主模块
 * 
 * 该模块整合审批领域的所有子领域模块，包括：
 * - 申请管理 (management)
 * - 审批规则 (rules)
 * - 审批历史 (history)
 * 
 * 遵循DDD和Clean Architecture原则，通过依赖注入管理各子领域间的协作。
 */

import { Module } from '@nestjs/common';

// TODO: 导入各子领域模块
// import { ManagementModule } from './management/management.module';
// import { RulesModule } from './rules/rules.module';
// import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    // TODO: 添加各子领域模块
    // ManagementModule,
    // RulesModule,
    // HistoryModule,
  ],
  controllers: [
    // TODO: 添加审批领域控制器
  ],
  providers: [
    // TODO: 添加审批领域服务
  ],
  exports: [
    // TODO: 导出审批领域公共接口
  ],
})
export class ApprovalModule { }
