/**
 * @interface IQuery
 * @description
 * CQRS架构中的查询接口，定义了所有查询对象必须遵循的基础契约。
 * 
 * 主要原理与机制如下：
 * 1. 查询分离：查询对象专门用于数据读取操作，与命令对象分离，实现读写分离。
 * 2. 不可变性：查询对象一旦创建就不应该被修改，确保查询结果的一致性。
 * 3. 序列化支持：查询对象需要支持序列化，以便在分布式系统中传输。
 * 4. 元数据：每个查询都包含必要的元数据，如查询ID、时间戳、用户信息等。
 * 
 * 功能与职责：
 * - 定义查询对象的标准结构
 * - 确保查询对象的一致性和可预测性
 * - 支持查询的验证、路由和处理
 * - 提供查询的审计和追踪能力
 */
export interface IQuery<TResult = any> {
  /**
   * @property {string} queryId
   * @description 查询的唯一标识符，用于追踪和缓存
   */
  readonly queryId: string;

  /**
   * @property {string} queryType
   * @description 查询的类型名称，用于路由到正确的处理器
   */
  readonly queryType: string;

  /**
   * @property {Date} timestamp
   * @description 查询创建的时间戳，用于审计和缓存失效
   */
  readonly timestamp: Date;

  /**
   * @property {string} userId
   * @description 执行查询的用户ID，用于权限控制和审计
   */
  readonly userId?: string;

  /**
   * @property {string} tenantId
   * @description 查询所属的租户ID，用于多租户隔离
   */
  readonly tenantId?: string;

  /**
   * @property {string} correlationId
   * @description 关联ID，用于追踪相关的查询和响应
   */
  readonly correlationId?: string;

  /**
   * @property {TResult} resultType
   * @description 查询结果的类型，用于类型安全和文档生成
   */
  readonly resultType?: new () => TResult;
}
