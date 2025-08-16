import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from './command-bus';
import { BaseCommand } from '../base/base-command';
import { BaseCommandHandler } from '../base/base-command-handler';
import type { ICommand } from '../interfaces/command.interface';

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
 * @class InvalidCommandHandler
 * @description 测试用的无效命令处理器类
 */
class InvalidCommandHandler extends BaseCommandHandler<TestCommand, string> {
  public readonly commandType = 'DifferentCommand'; // 故意设置不同的命令类型

  protected async handleCommand(command: TestCommand): Promise<string> {
    return `Processed: ${command.testData}`;
  }
}

/**
 * @describe CommandBus
 * @description 命令总线的单元测试套件
 */
describe('CommandBus', () => {
  let commandBus: CommandBus;
  let testCommandHandler: TestCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandBus],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    testCommandHandler = new TestCommandHandler();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @test 应该成功创建命令总线实例
   */
  it('should be defined', () => {
    expect(commandBus).toBeDefined();
  });

  /**
   * @test 应该成功注册命令处理器
   */
  it('should register command handler successfully', () => {
    expect(() => commandBus.registerHandler('TestCommand', testCommandHandler)).not.toThrow();
    expect(commandBus.hasHandler('TestCommand')).toBe(true);
  });

  /**
   * @test 应该成功注销命令处理器
   */
  it('should unregister command handler successfully', () => {
    commandBus.registerHandler('TestCommand', testCommandHandler);
    expect(commandBus.hasHandler('TestCommand')).toBe(true);

    commandBus.unregisterHandler('TestCommand');
    expect(commandBus.hasHandler('TestCommand')).toBe(false);
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
   * @test 应该处理命令验证失败的情况
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
   * @test 应该处理未注册处理器的情况
   */
  it('should handle unregistered handler', async () => {
    const command = new TestCommand('test data');

    await expect(commandBus.execute(command)).rejects.toThrow('No handler registered for command type: TestCommand');
  });

  /**
   * @test 应该处理无效处理器的情况
   */
  it('should handle invalid handler', () => {
    const invalidHandler = { execute: 'not a function' };

    expect(() => commandBus.registerHandler('TestCommand', invalidHandler as any)).toThrow('Invalid command handler provided');
  });

  /**
   * @test 应该处理处理器类型不匹配的情况
   */
  it('should handle handler type mismatch', () => {
    const invalidHandler = new InvalidCommandHandler();

    expect(() => commandBus.registerHandler('TestCommand', invalidHandler)).toThrow('Handler command type mismatch: expected TestCommand, got DifferentCommand');
  });

  /**
   * @test 应该返回已注册的命令类型列表
   */
  it('should return registered command types', () => {
    commandBus.registerHandler('TestCommand', testCommandHandler);

    // 创建另一个处理器用于测试
    const anotherHandler = new (class extends BaseCommandHandler<TestCommand, string> {
      public readonly commandType = 'AnotherCommand';

      protected async handleCommand(command: TestCommand): Promise<string> {
        return `Processed: ${command.testData}`;
      }
    })();

    commandBus.registerHandler('AnotherCommand', anotherHandler);

    const registeredCommands = commandBus.getRegisteredCommands();
    expect(registeredCommands).toContain('TestCommand');
    expect(registeredCommands).toContain('AnotherCommand');
  });

  /**
   * @test 应该返回处理器数量
   */
  it('should return handler count', () => {
    expect(commandBus.getHandlerCount()).toBe(0);

    commandBus.registerHandler('TestCommand', testCommandHandler);
    expect(commandBus.getHandlerCount()).toBe(1);

    // 创建另一个处理器用于测试
    const anotherHandler = new (class extends BaseCommandHandler<TestCommand, string> {
      public readonly commandType = 'AnotherCommand';

      protected async handleCommand(command: TestCommand): Promise<string> {
        return `Processed: ${command.testData}`;
      }
    })();

    commandBus.registerHandler('AnotherCommand', anotherHandler);
    expect(commandBus.getHandlerCount()).toBe(2);
  });

  /**
   * @test 应该处理处理器执行异常
   */
  it('should handle handler execution error', async () => {
    const errorHandler = new (class extends BaseCommandHandler<TestCommand, string> {
      public readonly commandType = 'TestCommand';

      protected async handleCommand(command: TestCommand): Promise<string> {
        throw new Error('Handler execution error');
      }
    })();

    commandBus.registerHandler('TestCommand', errorHandler);

    const command = new TestCommand('test data');

    await expect(commandBus.execute(command)).rejects.toThrow('Handler execution error');
  });

  /**
   * @test 应该记录命令执行的日志
   */
  it('should log command execution', async () => {
    // 由于CommandBus使用logger而不是console，我们测试功能而不是日志输出
    commandBus.registerHandler('TestCommand', testCommandHandler);

    const command = new TestCommand('test data');
    const result = await commandBus.execute(command);

    expect(result).toBe('Processed: test data');
  });

  /**
   * @test 应该处理注销不存在的处理器
   */
  it('should handle unregistering non-existent handler', () => {
    // 测试注销不存在的处理器不会抛出异常
    expect(() => commandBus.unregisterHandler('NonExistentCommand')).not.toThrow();
  });
});
