/**
 * @interface ICommand
 * @description
 * CQRS架构中的命令接口，定义了所有命令对象必须遵循的基础契约。
 * 
 * 主要原理与机制如下：
 * 1. 命令模式：命令对象封装了要执行的操作和所需的数据，实现了命令的发送者和接收者的解耦。
 * 2. 不可变性：命令对象一旦创建就不应该被修改，确保命令的完整性和可追溯性。
 * 3. 序列化支持：命令对象需要支持序列化，以便在分布式系统中传输和存储。
 * 4. 元数据：每个命令都包含必要的元数据，如命令ID、时间戳、用户信息等。
 * 
 * 功能与职责：
 * - 定义命令对象的标准结构
 * - 确保命令对象的一致性和可预测性
 * - 支持命令的验证、路由和处理
 * - 提供命令的审计和追踪能力
 */
export interface ICommand {
  /**
   * @property {string} commandId
   * @description 命令的唯一标识符，用于追踪和去重
   */
  readonly commandId: string;

  /**
   * @property {string} commandType
   * @description 命令的类型名称，用于路由到正确的处理器
   */
  readonly commandType: string;

  /**
   * @property {Date} timestamp
   * @description 命令创建的时间戳，用于审计和排序
   */
  readonly timestamp: Date;

  /**
   * @property {string} userId
   * @description 执行命令的用户ID，用于权限控制和审计
   */
  readonly userId?: string;

  /**
   * @property {string} tenantId
   * @description 命令所属的租户ID，用于多租户隔离
   */
  readonly tenantId?: string;

  /**
   * @property {string} correlationId
   * @description 关联ID，用于追踪相关的命令和事件
   */
  readonly correlationId?: string;
}
