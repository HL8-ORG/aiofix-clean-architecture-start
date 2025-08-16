import { v4 as uuidv4 } from 'uuid';
import type { ICommand } from '../interfaces/command.interface';

/**
 * @abstract BaseCommand
 * @description
 * CQRS架构中命令对象的基类，提供了命令对象的通用实现和默认行为。
 * 
 * 主要原理与机制如下：
 * 1. 模板方法模式：定义了命令对象的创建和执行流程，子类可以重写特定步骤。
 * 2. 不可变性：通过readonly属性和构造函数确保命令对象一旦创建就不被修改。
 * 3. 元数据管理：自动生成和管理命令的元数据，如ID、时间戳等。
 * 4. 类型安全：通过泛型提供类型安全的命令实现。
 * 
 * 功能与职责：
 * - 提供命令对象的通用结构和行为
 * - 自动生成和管理命令元数据
 * - 确保命令对象的不可变性
 * - 支持命令的序列化和反序列化
 * - 提供命令验证的基础框架
 */
export abstract class BaseCommand implements ICommand {
  /**
   * @property {string} commandId
   * @description 命令的唯一标识符，自动生成
   */
  public readonly commandId: string;

  /**
   * @property {string} commandType
   * @description 命令的类型名称，由子类实现
   */
  public abstract readonly commandType: string;

  /**
   * @property {Date} timestamp
   * @description 命令创建的时间戳
   */
  public readonly timestamp: Date;

  /**
   * @property {string} userId
   * @description 执行命令的用户ID
   */
  public readonly userId?: string;

  /**
   * @property {string} tenantId
   * @description 命令所属的租户ID
   */
  public readonly tenantId?: string;

  /**
   * @property {string} correlationId
   * @description 关联ID，用于追踪相关的命令和事件
   */
  public readonly correlationId?: string;

  /**
   * @constructor
   * @description 创建命令对象的构造函数
   * 
   * @param options - 命令选项，包含用户ID、租户ID、关联ID等
   * 
   * 主要职责：
   * 1. 自动生成命令ID和时间戳
   * 2. 设置命令的元数据
   * 3. 调用子类的初始化方法
   */
  constructor(options?: {
    userId?: string;
    tenantId?: string;
    correlationId?: string;
  }) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
    this.userId = options?.userId;
    this.tenantId = options?.tenantId;
    this.correlationId = options?.correlationId;
  }

  /**
   * @method validate
   * @description 验证命令的有效性，子类可以重写此方法
   * 
   * @returns boolean 验证结果
   * 
   * 主要职责：
   * 1. 验证命令参数的完整性
   * 2. 检查业务规则的符合性
   * 3. 返回验证结果
   */
  public validate(): boolean {
    return true;
  }

  /**
   * @method toJSON
   * @description 将命令对象序列化为JSON格式
   * 
   * @returns object JSON对象
   * 
   * 主要职责：
   * 1. 将命令对象转换为可序列化的格式
   * 2. 保留所有必要的元数据
   * 3. 支持命令的传输和存储
   */
  public toJSON(): object {
    return {
      commandId: this.commandId,
      commandType: this.commandType,
      timestamp: this.timestamp.toISOString(),
      userId: this.userId,
      tenantId: this.tenantId,
      correlationId: this.correlationId,
    };
  }
}
