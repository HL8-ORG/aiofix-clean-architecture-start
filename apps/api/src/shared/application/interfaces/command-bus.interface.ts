import type { ICommand } from './command.interface';

/**
 * @interface ICommandBus
 * @description
 * CQRS架构中的命令总线接口，定义了命令发送和路由的标准契约。
 * 
 * 主要原理与机制如下：
 * 1. 中介者模式：命令总线作为中介者，解耦命令发送者和命令处理器。
 * 2. 路由机制：根据命令类型自动路由到对应的处理器。
 * 3. 异步处理：支持命令的异步执行，提高系统响应性。
 * 4. 事务管理：提供命令执行的事务边界管理。
 * 
 * 功能与职责：
 * - 接收和分发命令
 * - 路由命令到正确的处理器
 * - 管理命令执行的事务
 * - 处理命令执行的异常
 * - 提供命令执行的监控和日志
 */
export interface ICommandBus {
  /**
   * @method execute
   * @description 执行命令的核心方法
   * 
   * @param command - 要执行的命令对象
   * @returns Promise<TResult> 命令执行的结果
   * 
   * 主要职责：
   * 1. 验证命令的有效性
   * 2. 路由命令到正确的处理器
   * 3. 管理命令执行的事务
   * 4. 处理执行异常
   * 5. 返回执行结果
   */
  execute<TResult = void>(command: ICommand): Promise<TResult>;

  /**
   * @method registerHandler
   * @description 注册命令处理器
   * 
   * @param commandType - 命令类型
   * @param handler - 命令处理器
   * 
   * 主要职责：
   * 1. 注册命令类型和处理器的映射关系
   * 2. 验证处理器的有效性
   * 3. 支持处理器的动态注册和移除
   */
  registerHandler(commandType: string, handler: any): void;

  /**
   * @method unregisterHandler
   * @description 注销命令处理器
   * 
   * @param commandType - 命令类型
   * 
   * 主要职责：
   * 1. 移除命令类型和处理器的映射关系
   * 2. 清理相关的资源
   */
  unregisterHandler(commandType: string): void;

  /**
   * @method hasHandler
   * @description 检查是否有对应的命令处理器
   * 
   * @param commandType - 命令类型
   * @returns boolean 是否存在处理器
   * 
   * 主要职责：
   * 1. 检查指定命令类型是否有注册的处理器
   * 2. 支持命令执行前的预检查
   */
  hasHandler(commandType: string): boolean;
}
