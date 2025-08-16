import { Injectable, Logger } from '@nestjs/common';
import type { ICommand } from '../interfaces/command.interface';
import type { ICommandHandler } from '../interfaces/command-handler.interface';
import type { ICommandBus } from '../interfaces/command-bus.interface';

/**
 * @class CommandBus
 * @description
 * CQRS架构中命令总线的具体实现，负责命令的路由、执行和异常处理。
 * 
 * 主要原理与机制如下：
 * 1. 注册表模式：维护命令类型到处理器的映射关系，支持动态注册和注销。
 * 2. 路由机制：根据命令类型自动路由到对应的处理器，实现命令和处理的解耦。
 * 3. 异常处理：提供统一的异常处理机制，确保系统的稳定性和可观测性。
 * 4. 日志记录：记录命令执行的详细信息，支持审计和调试。
 * 
 * 功能与职责：
 * - 管理命令处理器的注册和注销
 * - 路由命令到正确的处理器
 * - 提供统一的异常处理
 * - 记录命令执行的日志
 * - 支持命令执行的监控和追踪
 */
@Injectable()
export class CommandBus implements ICommandBus {
  private readonly logger = new Logger(CommandBus.name);
  private readonly handlers = new Map<string, ICommandHandler>();

  /**
   * @method execute
   * @description 执行命令的核心方法
   * 
   * @param command - 要执行的命令对象
   * @returns Promise<TResult> 命令执行的结果
   * 
   * 主要职责：
   * 1. 验证命令的有效性
   * 2. 查找对应的命令处理器
   * 3. 执行命令并处理异常
   * 4. 记录执行日志
   * 5. 返回执行结果
   */
  public async execute<TResult = void>(command: ICommand): Promise<TResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Executing command: ${command.commandType}`, {
        commandId: command.commandId,
        userId: command.userId,
        tenantId: command.tenantId,
      });

      // 验证命令
      if (!command.validate()) {
        throw new Error(`Command validation failed: ${command.commandType}`);
      }

      // 查找处理器
      const handler = this.handlers.get(command.commandType);
      if (!handler) {
        throw new Error(`No handler registered for command type: ${command.commandType}`);
      }

      // 执行命令
      const result = await handler.execute(command);

      const executionTime = Date.now() - startTime;
      this.logger.debug(`Command executed successfully: ${command.commandType}`, {
        commandId: command.commandId,
        executionTime,
        result: result !== undefined ? 'success' : 'void',
      });

      return result as TResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Command execution failed: ${command.commandType}`, {
        commandId: command.commandId,
        executionTime,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * @method registerHandler
   * @description 注册命令处理器
   * 
   * @param commandType - 命令类型
   * @param handler - 命令处理器
   * 
   * 主要职责：
   * 1. 验证处理器和命令类型的匹配性
   * 2. 注册处理器到映射表
   * 3. 记录注册日志
   */
  public registerHandler(commandType: string, handler: ICommandHandler): void {
    if (!handler || typeof handler.execute !== 'function') {
      throw new Error('Invalid command handler provided');
    }

    if (handler.commandType !== commandType) {
      throw new Error(`Handler command type mismatch: expected ${commandType}, got ${handler.commandType}`);
    }

    this.handlers.set(commandType, handler);
    this.logger.debug(`Command handler registered: ${commandType}`);
  }

  /**
   * @method unregisterHandler
   * @description 注销命令处理器
   * 
   * @param commandType - 命令类型
   * 
   * 主要职责：
   * 1. 从映射表中移除处理器
   * 2. 记录注销日志
   */
  public unregisterHandler(commandType: string): void {
    const removed = this.handlers.delete(commandType);
    if (removed) {
      this.logger.debug(`Command handler unregistered: ${commandType}`);
    } else {
      this.logger.warn(`No handler found to unregister: ${commandType}`);
    }
  }

  /**
   * @method hasHandler
   * @description 检查是否有对应的命令处理器
   * 
   * @param commandType - 命令类型
   * @returns boolean 是否存在处理器
   * 
   * 主要职责：
   * 1. 检查指定命令类型是否有注册的处理器
   * 2. 返回检查结果
   */
  public hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }

  /**
   * @method getRegisteredCommands
   * @description 获取所有已注册的命令类型
   * 
   * @returns string[] 已注册的命令类型列表
   * 
   * 主要职责：
   * 1. 返回所有已注册的命令类型
   * 2. 支持调试和监控
   */
  public getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * @method getHandlerCount
   * @description 获取已注册的处理器数量
   * 
   * @returns number 处理器数量
   * 
   * 主要职责：
   * 1. 返回已注册的处理器数量
   * 2. 支持系统监控
   */
  public getHandlerCount(): number {
    return this.handlers.size;
  }
}
