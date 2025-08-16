import { Logger } from '@nestjs/common';
import type { ICommand } from '../interfaces/command.interface';
import type { ICommandHandler } from '../interfaces/command-handler.interface';

/**
 * @abstract BaseCommandHandler
 * @description
 * CQRS架构中命令处理器的基类，提供了命令处理器的通用实现和默认行为。
 * 
 * 主要原理与机制如下：
 * 1. 模板方法模式：定义了命令处理的流程，子类可以重写特定步骤。
 * 2. 依赖注入：通过NestJS的依赖注入系统获取所需的依赖。
 * 3. 日志记录：提供统一的日志记录机制，支持审计和调试。
 * 4. 异常处理：提供统一的异常处理机制，确保系统的稳定性。
 * 
 * 功能与职责：
 * - 提供命令处理器的通用结构和行为
 * - 实现统一的日志记录
 * - 提供统一的异常处理
 * - 支持命令处理的监控和追踪
 * - 确保命令处理的一致性
 */
export abstract class BaseCommandHandler<TCommand extends ICommand = ICommand, TResult = void>
  implements ICommandHandler<TCommand, TResult> {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * @property {string} commandType
   * @description 该处理器能够处理的命令类型，由子类实现
   */
  public abstract readonly commandType: string;

  /**
   * @method execute
   * @description 执行命令的核心方法，实现了模板方法模式
   * 
   * @param command - 要执行的命令对象
   * @returns Promise<TResult> 命令执行的结果
   * 
   * 主要职责：
   * 1. 记录命令执行的开始
   * 2. 验证命令参数
   * 3. 执行业务逻辑
   * 4. 处理异常
   * 5. 记录命令执行的结束
   * 6. 返回执行结果
   */
  public async execute(command: TCommand): Promise<TResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting command execution: ${this.commandType}`, {
        commandId: command.commandId,
        userId: command.userId,
        tenantId: command.tenantId,
      });

      // 验证命令参数
      await this.validateCommand(command);

      // 执行业务逻辑
      const result = await this.handleCommand(command);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Command execution completed: ${this.commandType}`, {
        commandId: command.commandId,
        executionTime,
        result: result !== undefined ? 'success' : 'void',
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Command execution failed: ${this.commandType}`, {
        commandId: command.commandId,
        executionTime,
        error: error.message,
        stack: error.stack,
      });

      // 重新抛出异常，让上层处理
      throw error;
    }
  }

  /**
   * @protected
   * @method validateCommand
   * @description 验证命令参数，子类可以重写此方法
   * 
   * @param command - 要验证的命令对象
   * @returns Promise<void>
   * 
   * 主要职责：
   * 1. 验证命令参数的完整性
   * 2. 检查业务规则的符合性
   * 3. 验证用户权限
   * 4. 抛出验证异常（如果验证失败）
   */
  protected async validateCommand(command: TCommand): Promise<void> {
    // 默认实现：调用命令的validate方法
    if (!command.validate()) {
      throw new Error(`Command validation failed: ${this.commandType}`);
    }
  }

  /**
   * @protected
   * @abstract
   * @method handleCommand
   * @description 处理命令的核心业务逻辑，子类必须实现此方法
   * 
   * @param command - 要处理的命令对象
   * @returns Promise<TResult> 处理结果
   * 
   * 主要职责：
   * 1. 执行业务逻辑
   * 2. 调用领域服务
   * 3. 更新领域状态
   * 4. 发布领域事件
   * 5. 返回处理结果
   */
  protected abstract handleCommand(command: TCommand): Promise<TResult>;

  /**
   * @protected
   * @method logCommandExecution
   * @description 记录命令执行的详细信息
   * 
   * @param command - 命令对象
   * @param result - 执行结果
   * @param executionTime - 执行时间
   * 
   * 主要职责：
   * 1. 记录命令执行的详细信息
   * 2. 支持审计和监控
   * 3. 提供调试信息
   */
  protected logCommandExecution(
    command: TCommand,
    result: TResult,
    executionTime: number
  ): void {
    this.logger.log(`Command executed: ${this.commandType}`, {
      commandId: command.commandId,
      userId: command.userId,
      tenantId: command.tenantId,
      executionTime,
      result: result !== undefined ? 'success' : 'void',
    });
  }

  /**
   * @protected
   * @method logCommandError
   * @description 记录命令执行的错误信息
   * 
   * @param command - 命令对象
   * @param error - 错误对象
   * @param executionTime - 执行时间
   * 
   * 主要职责：
   * 1. 记录命令执行的错误信息
   * 2. 支持错误追踪和调试
   * 3. 提供错误上下文信息
   */
  protected logCommandError(
    command: TCommand,
    error: Error,
    executionTime: number
  ): void {
    this.logger.error(`Command execution error: ${this.commandType}`, {
      commandId: command.commandId,
      userId: command.userId,
      tenantId: command.tenantId,
      executionTime,
      error: error.message,
      stack: error.stack,
    });
  }
}
