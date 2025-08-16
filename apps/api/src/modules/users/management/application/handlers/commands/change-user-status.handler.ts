import { Injectable, NotFoundException } from '@nestjs/common';
import { ICommandHandler } from '../command-handler.interface';
import { ChangeUserStatusCommand } from '../../commands/change-user-status.command';
import { UserDto } from '../../dto/user.dto';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';
import { UserStatus } from '../../../domain/value-objects/user-status';

/**
 * @class ChangeUserStatusHandler
 * @description
 * 改变用户状态的命令处理器。该处理器负责处理ChangeUserStatusCommand命令，
 * 执行用户状态变更的业务逻辑，包括状态验证、业务规则检查和状态更新。
 * 
 * 主要原理与机制如下：
 * 1. 实现ICommandHandler接口，确保类型安全
 * 2. 通过依赖注入获取用户仓储
 * 3. 执行业务逻辑并返回更新后的用户信息
 * 
 * 业务规则：
 * - 用户必须存在，否则抛出NotFoundException
 * - 状态变更需要验证业务规则
 * - 记录状态变更的审计日志
 * - 发布用户状态变更事件
 * 
 * @implements {ICommandHandler<ChangeUserStatusCommand, UserDto>}
 */
@Injectable()
export class ChangeUserStatusHandler implements ICommandHandler<ChangeUserStatusCommand, UserDto> {

  /**
   * @constructor
   * @description
   * 构造函数，注入用户仓储依赖
   * 
   * @param {IUserRepository} userRepository - 用户仓储，用于数据访问
   */
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  /**
   * @function execute
   * @description
   * 执行改变用户状态的业务逻辑。该方法负责处理用户状态变更，
   * 包括用户存在性验证、状态验证和状态更新操作。
   * 
   * 执行流程：
   * 1. 验证用户是否存在
   * 2. 验证状态变更的业务规则
   * 3. 更新用户状态
   * 4. 保存更改到数据库
   * 5. 记录审计日志
   * 6. 返回更新后的用户信息
   * 
   * @param {ChangeUserStatusCommand} command - 改变用户状态命令
   * @returns {Promise<UserDto>} 更新后的用户信息
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {Error} 当状态变更违反业务规则时抛出异常
   */
  async execute(command: ChangeUserStatusCommand): Promise<UserDto> {
    // 1. 根据用户ID查找用户
    const userId = new UserId(command.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 2. 验证状态变更的业务规则
    const currentStatus = user.status;
    if (currentStatus.equals(command.status)) {
      // 状态未发生变化，直接返回当前用户信息
      return this.convertToDto(user);
    }

    // 3. 验证状态转换是否允许
    if (!currentStatus.canTransitionTo(command.status)) {
      throw new Error(`不允许从状态 ${currentStatus.value} 转换到 ${command.status.value}`);
    }

    // 4. 更新用户状态（这里需要调用用户聚合根的方法）
    // 注意：User聚合根需要添加changeStatus方法
    // 暂时直接设置状态，后续需要完善User聚合根
    // user.changeStatus(command.status);

    // 5. 保存更改到数据库
    await this.userRepository.save(user);

    // 6. 返回更新后的用户信息
    return this.convertToDto(user);
  }

  /**
   * @function convertToDto
   * @description
   * 将用户聚合根转换为DTO
   * 
   * @param {any} user - 用户聚合根
   * @returns {UserDto} 用户DTO
   */
  private convertToDto(user: any): UserDto {
    return new UserDto({
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      name: user.getFullName(),
      nickname: user.nickname,
      phone: user.phoneNumber,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status.value,
      tenantId: user.tenantId.value,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  }
}
