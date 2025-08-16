import { Injectable, NotFoundException } from '@nestjs/common';
import { ICommandHandler } from '../command-handler.interface';
import { ResetPasswordCommand } from '../../commands/reset-password.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';
import { Password } from '../../../domain/value-objects/password';

/**
 * 重置密码命令处理器
 * 处理重置用户密码的业务逻辑
 * 
 * 主要职责：
 * 1. 验证用户是否存在
 * 2. 验证新密码的复杂度要求
 * 3. 更新用户密码
 * 4. 处理密码历史记录
 * 5. 发布密码重置事件
 */
@Injectable()
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(command: ResetPasswordCommand): Promise<void> {
    const userId = UserId.create(command.userId);

    // 查找用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 创建新密码
    const newPassword = Password.create(command.newPassword);

    // 重置用户密码
    user.resetPassword(newPassword);

    // 保存用户
    await this.userRepository.save(user);
  }
}
