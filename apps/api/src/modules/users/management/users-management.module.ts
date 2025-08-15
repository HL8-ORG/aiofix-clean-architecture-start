import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserEntity } from './infrastructure/postgresql/entities/user.entity';
import { UserRepository } from './infrastructure/postgresql/repositories/user.repository';
import { UserDomainService } from './domain/services/user-domain.service';
import { UserMapper } from './infrastructure/postgresql/mappers/user.mapper';

/**
 * @class UsersManagementModule
 * @description 用户管理模块
 * 
 * 核心职责：
 * 1. 配置用户管理相关的依赖注入
 * 2. 注册用户管理相关的服务
 * 3. 配置数据库实体映射
 * 4. 提供用户管理功能
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity])
  ],
  providers: [
    UserRepository,
    UserDomainService,
    UserMapper,
    {
      provide: 'IUserRepository',
      useClass: UserRepository
    }
  ],
  exports: [
    UserRepository,
    UserDomainService,
    UserMapper,
    'IUserRepository'
  ]
})
export class UsersManagementModule { }
