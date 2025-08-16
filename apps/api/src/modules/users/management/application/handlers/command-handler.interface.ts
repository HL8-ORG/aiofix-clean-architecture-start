import type { ICommand } from '@/shared/application/interfaces/command.interface';

/**
 * 命令处理器接口
 * 所有命令处理器都应该实现这个接口
 */
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = any> {
  /**
   * 处理命令
   * @param command 要处理的命令
   * @returns 处理结果
   */
  execute(command: TCommand): Promise<TResult>;
}
