import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from './bus/command-bus';
import { QueryBus } from './bus/query-bus';
import { BaseCommand } from './base/base-command';
import { BaseQuery } from './base/base-query';
import { BaseCommandHandler } from './base/base-command-handler';
import { BaseQueryHandler } from './base/base-query-handler';

/**
 * @class TestCommand
 * @description 测试用的命令类
 */
class TestCommand extends BaseCommand {
  public readonly commandType = 'TestCommand';
  public readonly testData: string;

  constructor(testData: string, options?: { userId?: string; tenantId?: string; correlationId?: string }) {
    super(options);
    this.testData = testData;
  }

  public validate(): boolean {
    return this.testData && this.testData.length > 0;
  }
}

/**
 * @class TestQuery
 * @description 测试用的查询类
 */
class TestQuery extends BaseQuery<string> {
  public readonly queryType = 'TestQuery';
  public readonly searchTerm: string;

  constructor(searchTerm: string, options?: { userId?: string; tenantId?: string; correlationId?: string }) {
    super(options);
    this.searchTerm = searchTerm;
  }

  public validate(): boolean {
    return this.searchTerm && this.searchTerm.length > 0;
  }
}

/**
 * @class TestCommandHandler
 * @description 测试用的命令处理器类
 */
class TestCommandHandler extends BaseCommandHandler<TestCommand, string> {
  public readonly commandType = 'TestCommand';

  protected async handleCommand(command: TestCommand): Promise<string> {
    return `Processed: ${command.testData}`;
  }
}

/**
 * @class TestQueryHandler
 * @description 测试用的查询处理器类
 */
class TestQueryHandler extends BaseQueryHandler<TestQuery, string> {
  public readonly queryType = 'TestQuery';

  protected async handleQuery(query: TestQuery): Promise<string> {
    return `Found: ${query.searchTerm}`;
  }
}

/**
 * @describe CQRS Infrastructure
 * @description CQRS基础设施的集成测试套件
 */
describe('CQRS Infrastructure', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let testCommandHandler: TestCommandHandler;
  let testQueryHandler: TestQueryHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandBus, QueryBus],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    testCommandHandler = new TestCommandHandler();
    testQueryHandler = new TestQueryHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test 应该成功创建CQRS基础设施组件
   */
  it('should create CQRS infrastructure components', () => {
    expect(commandBus).toBeDefined();
    expect(queryBus).toBeDefined();
    expect(testCommandHandler).toBeDefined();
    expect(testQueryHandler).toBeDefined();
  });

  /**
   * @test 应该成功执行命令
   */
  it('should execute command successfully', async () => {
    commandBus.registerHandler('TestCommand', testCommandHandler);

    const command = new TestCommand('test data', {
      userId: 'user-123',
      tenantId: 'tenant-456',
      correlationId: 'correlation-789',
    });

    const result = await commandBus.execute(command);
    expect(result).toBe('Processed: test data');
  });

  /**
   * @test 应该成功执行查询
   */
  it('should execute query successfully', async () => {
    queryBus.registerHandler('TestQuery', testQueryHandler);

    const query = new TestQuery('search term', {
      userId: 'user-123',
      tenantId: 'tenant-456',
      correlationId: 'correlation-789',
    });

    const result = await queryBus.execute(query);
    expect(result).toBe('Found: search term');
  });

  /**
   * @test 应该处理命令验证失败
   */
  it('should handle command validation failure', async () => {
    commandBus.registerHandler('TestCommand', testCommandHandler);

    const invalidCommand = new TestCommand('', {
      userId: 'user-123',
      tenantId: 'tenant-456',
    });

    // 重写validate方法使其返回false
    invalidCommand.validate = () => false;

    await expect(commandBus.execute(invalidCommand)).rejects.toThrow('Command validation failed: TestCommand');
  });

  /**
   * @test 应该处理查询验证失败
   */
  it('should handle query validation failure', async () => {
    queryBus.registerHandler('TestQuery', testQueryHandler);

    const invalidQuery = new TestQuery('', {
      userId: 'user-123',
      tenantId: 'tenant-456',
    });

    // 重写validate方法使其返回false
    invalidQuery.validate = () => false;

    await expect(queryBus.execute(invalidQuery)).rejects.toThrow('Query validation failed: TestQuery');
  });

  /**
   * @test 应该处理未注册的命令处理器
   */
  it('should handle unregistered command handler', async () => {
    const command = new TestCommand('test data');

    await expect(commandBus.execute(command)).rejects.toThrow('No handler registered for command type: TestCommand');
  });

  /**
   * @test 应该处理未注册的查询处理器
   */
  it('should handle unregistered query handler', async () => {
    const query = new TestQuery('search term');

    await expect(queryBus.execute(query)).rejects.toThrow('No handler registered for query type: TestQuery');
  });

  /**
   * @test 应该支持命令处理器的注册和注销
   */
  it('should support command handler registration and unregistration', () => {
    expect(commandBus.hasHandler('TestCommand')).toBe(false);

    commandBus.registerHandler('TestCommand', testCommandHandler);
    expect(commandBus.hasHandler('TestCommand')).toBe(true);

    commandBus.unregisterHandler('TestCommand');
    expect(commandBus.hasHandler('TestCommand')).toBe(false);
  });

  /**
   * @test 应该支持查询处理器的注册和注销
   */
  it('should support query handler registration and unregistration', () => {
    expect(queryBus.hasHandler('TestQuery')).toBe(false);

    queryBus.registerHandler('TestQuery', testQueryHandler);
    expect(queryBus.hasHandler('TestQuery')).toBe(true);

    queryBus.unregisterHandler('TestQuery');
    expect(queryBus.hasHandler('TestQuery')).toBe(false);
  });

  /**
   * @test 应该返回正确的处理器数量
   */
  it('should return correct handler counts', () => {
    expect(commandBus.getHandlerCount()).toBe(0);
    expect(queryBus.getHandlerCount()).toBe(0);

    commandBus.registerHandler('TestCommand', testCommandHandler);
    queryBus.registerHandler('TestQuery', testQueryHandler);

    expect(commandBus.getHandlerCount()).toBe(1);
    expect(queryBus.getHandlerCount()).toBe(1);
  });

  /**
   * @test 应该返回已注册的命令和查询类型
   */
  it('should return registered command and query types', () => {
    commandBus.registerHandler('TestCommand', testCommandHandler);
    queryBus.registerHandler('TestQuery', testQueryHandler);

    const registeredCommands = commandBus.getRegisteredCommands();
    const registeredQueries = queryBus.getRegisteredQueries();

    expect(registeredCommands).toContain('TestCommand');
    expect(registeredQueries).toContain('TestQuery');
  });

  /**
   * @test 应该支持查询缓存
   */
  it('should support query caching', async () => {
    queryBus.registerHandler('TestQuery', testQueryHandler);

    const query = new TestQuery('search term');

    // 第一次执行
    const result1 = await queryBus.execute(query);
    expect(result1).toBe('Found: search term');

    // 第二次执行应该从缓存返回
    const result2 = await queryBus.execute(query);
    expect(result2).toBe('Found: search term');

    // 验证缓存大小
    expect(queryBus.getCacheSize()).toBeGreaterThan(0);
  });

  /**
   * @test 应该支持缓存清理
   */
  it('should support cache clearing', async () => {
    queryBus.registerHandler('TestQuery', testQueryHandler);

    const query = new TestQuery('search term');
    await queryBus.execute(query);

    expect(queryBus.getCacheSize()).toBeGreaterThan(0);

    queryBus.clearCache();
    expect(queryBus.getCacheSize()).toBe(0);
  });
});
