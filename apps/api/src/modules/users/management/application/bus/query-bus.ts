import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IQueryBus } from './query-bus.interface';
import type { IQuery } from '@/shared/application/interfaces/query.interface';
import { IQueryHandler } from '../handlers/query-handler.interface';

/**
 * 查询总线实现
 * 负责将查询路由到对应的处理器
 */
@Injectable()
export class QueryBus implements IQueryBus {
  private handlers = new Map<string, Type<IQueryHandler>>();

  constructor(private readonly moduleRef: ModuleRef) { }

  /**
   * 注册查询处理器
   */
  register<T extends IQuery>(
    queryType: string,
    handler: Type<IQueryHandler<T, any>>,
  ): void {
    this.handlers.set(queryType, handler);
  }

  /**
   * 执行查询
   */
  async execute<T extends IQuery = IQuery, R = any>(query: T): Promise<R> {
    const queryType = query.constructor.name;
    const handlerType = this.handlers.get(queryType);

    if (!handlerType) {
      throw new Error(`No handler found for query: ${queryType}`);
    }

    const handler = this.moduleRef.get(handlerType, { strict: false });
    return await handler.execute(query);
  }
}
