import type { ICommand } from '@/shared/application/interfaces/command.interface';

/**
 * 命令总线接口
 * 用于发送命令到对应的处理器
 */
export interface ICommandBus {
  /**
   * 发送命令
   * @param command 要发送的命令
   * @returns 处理结果
   */
  execute<T extends ICommand = ICommand, R = any>(command: T): Promise<R>;
}
