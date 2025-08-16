import { CommandBus } from './bus/command-bus';
import { QueryBus } from './bus/query-bus';
import { BaseCommand } from './base/base-command';
import { BaseQuery } from './base/base-query';

/**
 * @describe Simple CQRS Test
 * @description 简单的CQRS基础设施测试
 */
describe('Simple CQRS Test', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(() => {
    commandBus = new CommandBus();
    queryBus = new QueryBus();
  });

  /**
   * @test 应该成功创建CQRS基础设施组件
   */
  it('should create CQRS infrastructure components', () => {
    expect(commandBus).toBeDefined();
    expect(queryBus).toBeDefined();
  });

  /**
   * @test 应该支持基本的命令和查询基类
   */
  it('should support basic command and query base classes', () => {
    const command = new (class extends BaseCommand {
      public readonly commandType = 'TestCommand';
    })();

    const query = new (class extends BaseQuery<string> {
      public readonly queryType = 'TestQuery';
    })();

    expect(command.commandId).toBeDefined();
    expect(command.timestamp).toBeDefined();
    expect(query.queryId).toBeDefined();
    expect(query.timestamp).toBeDefined();
  });

  /**
   * @test 应该支持命令总线的基本操作
   */
  it('should support basic command bus operations', () => {
    expect(commandBus.getHandlerCount()).toBe(0);
    expect(commandBus.hasHandler('TestCommand')).toBe(false);
    expect(commandBus.getRegisteredCommands()).toEqual([]);
  });

  /**
   * @test 应该支持查询总线的基本操作
   */
  it('should support basic query bus operations', () => {
    expect(queryBus.getHandlerCount()).toBe(0);
    expect(queryBus.hasHandler('TestQuery')).toBe(false);
    expect(queryBus.getRegisteredQueries()).toEqual([]);
    expect(queryBus.getCacheSize()).toBe(0);
  });
});
