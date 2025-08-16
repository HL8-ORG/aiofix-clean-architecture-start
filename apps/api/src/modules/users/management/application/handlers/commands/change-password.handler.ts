import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ICommandHandler } from '../command-handler.interface';
import { ChangePasswordCommand } from '../../commands/change-password.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';
import { Password } from '../../../domain/value-objects/password';

/**
 * @class ChangePasswordHandler
 * @description
 * 修改密码命令处理器。该处理器负责处理用户密码修改的业务逻辑，
 * 包括原密码验证、新密码复杂度检查和密码更新操作。
 * 
 * 主要原理与机制如下：
 * 1. 通过用户ID查找目标用户，确保用户存在且可操作
 * 2. 验证用户提供的原密码是否正确，确保安全性
 * 3. 验证新密码的复杂度要求，确保密码强度
 * 4. 调用领域实体的密码修改方法，触发相关的业务规则验证
 * 5. 保存更新后的用户密码到仓储
 * 6. 发布密码修改事件，用于审计和通知
 * 
 * 业务规则：
 * - 用户必须存在才能执行密码修改操作
 * - 原密码必须正确才能修改密码
 * - 新密码必须符合复杂度要求
 * - 新密码不能与最近使用的密码相同
 * - 密码修改操作会触发密码变更事件
 * 
 * @implements {ICommandHandler<ChangePasswordCommand, void>}
 */
@Injectable()
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, void> {
  /**
   * @constructor
   * @description
   * 构造函数，注入用户仓储依赖
   * 
   * @param {IUserRepository} userRepository - 用户仓储接口，用于数据持久化操作
   */
  constructor(
    private readonly userRepository: IUserRepository,
  ) { }

  /**
   * @function execute
   * @description
   * 执行修改密码命令的核心方法。该方法负责处理修改密码的完整业务流程，
   * 包括参数验证、业务逻辑处理和结果返回。
   * 
   * 执行流程：
   * 1. 将字符串用户ID转换为值对象，确保类型安全
   * 2. 通过仓储查找用户，验证用户存在性
   * 3. 验证用户提供的原密码是否正确
   * 4. 创建新密码对象，验证密码复杂度
   * 5. 调用用户实体的密码修改方法，执行业务规则验证
   * 6. 保存更新后的用户密码
   * 
   * @param {ChangePasswordCommand} command - 修改密码命令，包含用户ID和密码信息
   * @returns {Promise<void>} 返回一个Promise，表示密码修改操作完成
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {BadRequestException} 当原密码不正确时抛出异常
   * @throws {Error} 当新密码不符合复杂度要求时抛出异常
   */
  async execute(command: ChangePasswordCommand): Promise<void> {
    // 将字符串ID转换为值对象，确保类型安全
    const userId = UserId.create(command.userId);

    // 通过仓储查找用户，验证用户存在性
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 验证原密码是否正确
    const isOldPasswordCorrect = user.password.verify(command.changePasswordDto.oldPassword);
    if (!isOldPasswordCorrect) {
      throw new BadRequestException('原密码不正确');
    }

    // 创建新密码对象，验证密码复杂度
    const newPassword = Password.create(command.changePasswordDto.newPassword);

    // 调用用户实体的密码修改方法，执行业务规则验证
    user.changePassword(newPassword);

    // 保存更新后的用户密码到仓储
    await this.userRepository.save(user);
  }
}
