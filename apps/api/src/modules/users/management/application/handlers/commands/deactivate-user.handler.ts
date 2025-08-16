import { Injectable, NotFoundException } from '@nestjs/common';
import type { ICommandHandler } from '../command-handler.interface';
import { DeactivateUserCommand } from '../../commands/deactivate-user.command';
import { UserDto } from '../../dto/user.dto';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id';

/**
 * @class DeactivateUserHandler
 * @description
 * 停用用户命令处理器。该处理器负责处理停用用户的业务逻辑，
 * 包括用户状态验证、业务规则检查和状态更新操作。
 * 
 * 主要原理与机制如下：
 * 1. 通过用户ID查找目标用户，确保用户存在且可操作
 * 2. 验证用户当前状态是否允许停用操作（如检查是否为系统管理员等）
 * 3. 调用领域实体的停用方法，触发相关的业务规则验证
 * 4. 保存更新后的用户状态到仓储
 * 5. 返回更新后的用户DTO，供上层应用使用
 * 
 * 业务规则：
 * - 用户必须存在才能执行停用操作
 * - 系统管理员用户不能被停用
 * - 已停用的用户不能重复停用
 * - 停用操作会触发用户状态变更事件
 * 
 * @implements {ICommandHandler<DeactivateUserCommand, UserDto>}
 */
@Injectable()
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand, UserDto> {
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
   * 执行停用用户命令的核心方法。该方法负责处理停用用户的完整业务流程，
   * 包括参数验证、业务逻辑处理和结果返回。
   * 
   * 执行流程：
   * 1. 将字符串用户ID转换为值对象，确保类型安全
   * 2. 通过仓储查找用户，验证用户存在性
   * 3. 调用用户实体的停用方法，执行业务规则验证
   * 4. 保存更新后的用户状态
   * 5. 将用户实体转换为DTO并返回
   * 
   * @param {DeactivateUserCommand} command - 停用用户命令，包含要停用的用户ID
   * @returns {Promise<UserDto>} 返回停用后的用户DTO对象
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {Error} 当用户状态不允许停用时抛出异常
   */
  async execute(command: DeactivateUserCommand): Promise<UserDto> {
    // 将字符串ID转换为值对象，确保类型安全
    const userId = UserId.create(command.userId);

    // 通过仓储查找用户，验证用户存在性
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`用户不存在: ${command.userId}`);
    }

    // 调用用户实体的停用方法，执行业务规则验证和状态更新
    user.deactivate();

    // 保存更新后的用户状态到仓储
    await this.userRepository.save(user);

    // 将用户实体转换为DTO并返回
    return this.toUserDto(user);
  }

  /**
   * @function toUserDto
   * @description
   * 将用户领域实体转换为数据传输对象(DTO)。该方法负责数据格式转换，
   * 将领域层的内部数据结构转换为应用层可用的标准格式。
   * 
   * 转换规则：
   * - 将值对象的value属性提取为普通字符串
   * - 将复杂对象属性转换为简单类型
   * - 确保返回的数据结构符合API契约
   * 
   * @param {any} user - 用户领域实体对象
   * @returns {UserDto} 转换后的用户DTO对象
   * @private
   */
  private toUserDto(user: any): UserDto {
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
