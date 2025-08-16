import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ICommandBus } from './command-bus.interface';
import type { ICommand } from '@/shared/application/interfaces/command.interface';
import { ICommandHandler } from '../handlers/command-handler.interface';

/**
 * 命令总线实现
 * 负责将命令路由到对应的处理器
 */
@Injectable()
export class CommandBus implements ICommandBus {
  private handlers = new Map<string, Type<ICommandHandler>>();

  constructor(private readonly moduleRef: ModuleRef) { }

  /**
   * 注册命令处理器
   */
  register<T extends ICommand>(
    commandType: string,
    handler: Type<ICommandHandler<T, any>>,
  ): void {
    this.handlers.set(commandType, handler);
  }

  /**
   * 执行命令
   */
  async execute<T extends ICommand = ICommand, R = any>(command: T): Promise<R> {
    const commandType = command.constructor.name;
    const handlerType = this.handlers.get(commandType);

    if (!handlerType) {
      throw new Error(`No handler found for command: ${commandType}`);
    }

    const handler = this.moduleRef.get(handlerType, { strict: false });
    return await handler.execute(command);
  }
}
