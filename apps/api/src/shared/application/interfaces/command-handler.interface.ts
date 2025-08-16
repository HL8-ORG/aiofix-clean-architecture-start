import type { ICommand } from './command.interface';

/**
 * @interface ICommandHandler
 * @description
 * CQRS架构中的命令处理器接口，定义了所有命令处理器必须遵循的基础契约。
 * 
 * 主要原理与机制如下：
 * 1. 单一职责：每个命令处理器只负责处理特定类型的命令，遵循单一职责原则。
 * 2. 依赖注入：处理器通过依赖注入获取所需的领域服务和仓储，实现松耦合。
 * 3. 事务管理：处理器负责管理命令执行的事务边界，确保数据一致性。
 * 4. 事件发布：处理器在命令执行完成后发布相应的领域事件，实现事件驱动架构。
 * 
 * 功能与职责：
 * - 验证命令的有效性和完整性
 * - 执行业务逻辑和领域规则
 * - 管理事务和异常处理
 * - 发布领域事件
 * - 返回执行结果
 */
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = void> {
  /**
   * @method execute
   * @description 执行命令的核心方法
   * 
   * @param command - 要执行的命令对象
   * @returns Promise<TResult> 命令执行的结果
   * 
   * 主要职责：
   * 1. 验证命令参数和业务规则
   * 2. 执行业务逻辑
   * 3. 更新领域状态
   * 4. 发布领域事件
   * 5. 返回执行结果
   */
  execute(command: TCommand): Promise<TResult>;

  /**
   * @property {string} commandType
   * @description 该处理器能够处理的命令类型
   */
  readonly commandType: string;
}
