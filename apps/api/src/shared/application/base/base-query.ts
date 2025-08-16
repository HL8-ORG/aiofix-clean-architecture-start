import { v4 as uuidv4 } from 'uuid';
import type { IQuery } from '../interfaces/query.interface';

/**
 * @abstract BaseQuery
 * @description
 * CQRS架构中查询对象的基类，提供了查询对象的通用实现和默认行为。
 * 
 * 主要原理与机制如下：
 * 1. 模板方法模式：定义了查询对象的创建和执行流程，子类可以重写特定步骤。
 * 2. 不可变性：通过readonly属性和构造函数确保查询对象一旦创建就不被修改。
 * 3. 元数据管理：自动生成和管理查询的元数据，如ID、时间戳等。
 * 4. 类型安全：通过泛型提供类型安全的查询实现。
 * 
 * 功能与职责：
 * - 提供查询对象的通用结构和行为
 * - 自动生成和管理查询元数据
 * - 确保查询对象的不可变性
 * - 支持查询的序列化和反序列化
 * - 提供查询验证的基础框架
 */
export abstract class BaseQuery<TResult = any> implements IQuery<TResult> {
  /**
   * @property {string} queryId
   * @description 查询的唯一标识符，自动生成
   */
  public readonly queryId: string;

  /**
   * @property {string} queryType
   * @description 查询的类型名称，由子类实现
   */
  public abstract readonly queryType: string;

  /**
   * @property {Date} timestamp
   * @description 查询创建的时间戳
   */
  public readonly timestamp: Date;

  /**
   * @property {string} userId
   * @description 执行查询的用户ID
   */
  public readonly userId?: string;

  /**
   * @property {string} tenantId
   * @description 查询所属的租户ID
   */
  public readonly tenantId?: string;

  /**
   * @property {string} correlationId
   * @description 关联ID，用于追踪相关的查询和响应
   */
  public readonly correlationId?: string;

  /**
   * @property {new () => TResult} resultType
   * @description 查询结果的类型，用于类型安全和文档生成
   */
  public readonly resultType?: new () => TResult;

  /**
   * @constructor
   * @description 创建查询对象的构造函数
   * 
   * @param options - 查询选项，包含用户ID、租户ID、关联ID、结果类型等
   * 
   * 主要职责：
   * 1. 自动生成查询ID和时间戳
   * 2. 设置查询的元数据
   * 3. 调用子类的初始化方法
   */
  constructor(options?: {
    userId?: string;
    tenantId?: string;
    correlationId?: string;
    resultType?: new () => TResult;
  }) {
    this.queryId = uuidv4();
    this.timestamp = new Date();
    this.userId = options?.userId;
    this.tenantId = options?.tenantId;
    this.correlationId = options?.correlationId;
    this.resultType = options?.resultType;
  }

  /**
   * @method validate
   * @description 验证查询的有效性，子类可以重写此方法
   * 
   * @returns boolean 验证结果
   * 
   * 主要职责：
   * 1. 验证查询参数的完整性
   * 2. 检查查询权限
   * 3. 返回验证结果
   */
  public validate(): boolean {
    return true;
  }

  /**
   * @method toJSON
   * @description 将查询对象序列化为JSON格式
   * 
   * @returns object JSON对象
   * 
   * 主要职责：
   * 1. 将查询对象转换为可序列化的格式
   * 2. 保留所有必要的元数据
   * 3. 支持查询的传输和缓存
   */
  public toJSON(): object {
    return {
      queryId: this.queryId,
      queryType: this.queryType,
      timestamp: this.timestamp.toISOString(),
      userId: this.userId,
      tenantId: this.tenantId,
      correlationId: this.correlationId,
    };
  }

  /**
   * @method getCacheKey
   * @description 生成查询的缓存键，子类可以重写此方法
   * 
   * @returns string 缓存键
   * 
   * 主要职责：
   * 1. 基于查询参数生成唯一的缓存键
   * 2. 支持查询结果的缓存
   * 3. 确保缓存键的唯一性
   */
  public getCacheKey(): string {
    return `${this.queryType}:${this.queryId}`;
  }
}
