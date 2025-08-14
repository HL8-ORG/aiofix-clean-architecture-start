/**
 * @file base.entity.ts
 * @description 基础实体类
 * 
 * 该文件定义了所有领域实体的基类，提供通用的实体功能和属性。
 * 遵循DDD原则，实体具有唯一标识和生命周期管理能力。
 * 
 * 主要功能：
 * 1. 提供唯一标识管理
 * 2. 提供创建时间和更新时间管理
 * 3. 提供实体状态管理
 * 4. 提供实体比较和相等性判断
 * 5. 提供实体验证能力
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * @interface IEntity
 * @description 实体接口，定义实体的基本契约
 */
export interface IEntity<TId = string> {
  /** 实体唯一标识 */
  readonly id: TId;
  /** 实体创建时间 */
  readonly createdAt: Date;
  /** 实体最后更新时间 */
  readonly updatedAt: Date;
  /** 实体是否为新创建 */
  readonly isNew: boolean;
  /** 实体是否已被删除 */
  readonly isDeleted: boolean;

  /** 获取实体标识 */
  getId(): TId;
  /** 检查实体是否相等 */
  equals(entity: IEntity<TId>): boolean;
  /** 验证实体有效性 */
  validate(): boolean;
  /** 标记实体为已删除 */
  markAsDeleted(): void;
  /** 标记实体为已更新 */
  markAsUpdated(): void;
}

/**
 * @abstract BaseEntity
 * @description 基础实体抽象类
 * 
 * 提供所有领域实体的通用功能，包括：
 * - 唯一标识管理
 * - 时间戳管理
 * - 状态管理
 * - 相等性比较
 * - 验证能力
 */
export abstract class BaseEntity<TId = string> implements IEntity<TId> {
  /** 实体唯一标识 */
  protected readonly _id: TId;
  /** 实体创建时间 */
  protected readonly _createdAt: Date;
  /** 实体最后更新时间 */
  protected _updatedAt: Date;
  /** 实体是否为新创建 */
  protected _isNew: boolean;
  /** 实体是否已被删除 */
  protected _isDeleted: boolean;

  /**
   * @constructor
   * @param id 实体唯一标识，如果不提供则自动生成
   * @param createdAt 创建时间，如果不提供则使用当前时间
   * @param updatedAt 更新时间，如果不提供则使用创建时间
   */
  constructor(
    id?: TId,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this._id = id || this.generateId() as TId;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || this._createdAt;
    this._isNew = !id; // 如果没有提供ID，则认为是新实体
    this._isDeleted = false;
  }

  /**
   * @getter id
   * @description 获取实体唯一标识
   */
  get id(): TId {
    return this._id;
  }

  /**
   * @getter createdAt
   * @description 获取实体创建时间
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * @getter updatedAt
   * @description 获取实体最后更新时间
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @getter isNew
   * @description 获取实体是否为新创建
   */
  get isNew(): boolean {
    return this._isNew;
  }

  /**
   * @getter isDeleted
   * @description 获取实体是否已被删除
   */
  get isDeleted(): boolean {
    return this._isDeleted;
  }

  /**
   * @method getId
   * @description 获取实体标识
   * @returns 实体唯一标识
   */
  getId(): TId {
    return this._id;
  }

  /**
   * @method equals
   * @description 检查实体是否相等
   * @param entity 要比较的实体
   * @returns 是否相等
   */
  equals(entity: IEntity<TId>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id === entity.id;
  }

  /**
   * @method validate
   * @description 验证实体有效性
   * @returns 是否有效
   */
  validate(): boolean {
    return !!this._id && !this._isDeleted;
  }

  /**
   * @method markAsDeleted
   * @description 标记实体为已删除
   */
  markAsDeleted(): void {
    this._isDeleted = true;
    this.markAsUpdated();
  }

  /**
   * @method markAsUpdated
   * @description 标记实体为已更新
   */
  markAsUpdated(): void {
    this._updatedAt = new Date();
    this._isNew = false;
  }

  /**
   * @method toJSON
   * @description 将实体转换为JSON对象
   * @returns JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      isNew: this._isNew,
      isDeleted: this._isDeleted,
    };
  }

  /**
   * @method toString
   * @description 将实体转换为字符串
   * @returns 字符串表示
   */
  toString(): string {
    return `${this.constructor.name}(id=${this._id})`;
  }

  /**
   * @protected generateId
   * @description 生成唯一标识
   * @returns 生成的唯一标识
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * @protected validateId
   * @description 验证标识有效性
   * @param id 要验证的标识
   * @returns 是否有效
   */
  protected validateId(id: TId): boolean {
    return id !== null && id !== undefined && id !== '' as any;
  }

  /**
   * @protected validateDates
   * @description 验证日期有效性
   * @param createdAt 创建时间
   * @param updatedAt 更新时间
   * @returns 是否有效
   */
  protected validateDates(createdAt: Date, updatedAt: Date): boolean {
    return createdAt instanceof Date &&
      updatedAt instanceof Date &&
      !isNaN(createdAt.getTime()) &&
      !isNaN(updatedAt.getTime()) &&
      updatedAt >= createdAt;
  }
}
