import { Injectable, NotFoundException } from '@nestjs/common';
import type { ICommandHandler } from '../command-handler.interface';
import { DeleteUserCommand } from '../../commands/delete-user.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';

/**
 * 删除用户命令处理器
 * 处理删除用户的业务逻辑
 * 
 * 主要职责：
 * 1. 验证用户是否存在
 * 2. 执行软删除或硬删除逻辑
 * 3. 处理相关的业务规则（如检查用户是否有未完成的业务）
 * 4. 发布相关领域事件
 */
@Injectable()
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(command: DeleteUserCommand): Promise<void> {
    const userId = UserId.create(command.userId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 检查用户是否可以删除（业务规则验证）
    // 系统管理员用户不能被删除
    if (user.roles.includes('system-admin')) {
      throw new Error('系统管理员用户不能被删除');
    }

    // 执行删除操作
    await this.userRepository.delete(userId.value);
  }
}
