/**
 * @abstract DomainException
 * @description
 * 领域异常抽象基类，定义了领域异常的基本结构。
 * 
 * 主要职责：
 * 1. 提供统一的异常基类
 * 2. 支持异常分类和错误码
 * 3. 提供异常上下文信息
 * 4. 支持异常链和堆栈跟踪
 * 
 * 设计原则：
 * - 领域异常应该包含足够的上下文信息
 * - 异常应该支持国际化
 * - 异常应该包含错误码便于处理
 * - 异常应该支持异常链
 */
export abstract class DomainException extends Error {
  /**
   * 错误码
   */
  public readonly errorCode: string;

  /**
   * 错误类型
   */
  public readonly errorType: string;

  /**
   * 异常上下文
   */
  public readonly context: Record<string, any>;

  /**
   * 异常发生时间
   */
  public readonly occurredAt: Date;

  /**
   * 请求ID
   */
  public requestId?: string;

  /**
   * 租户ID
   */
  public tenantId?: string;

  /**
   * 用户ID
   */
  public userId?: string;

  /**
   * 构造函数
   * 
   * @param message 错误消息
   * @param errorCode 错误码
   * @param context 异常上下文
   * @param cause 原始异常
   */
  constructor(
    message: string,
    errorCode: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.errorType = this.constructor.name;
    this.context = context;
    this.occurredAt = new Date();
    
    // 设置异常链
    if (cause) {
      this.cause = cause;
    }

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 获取异常的详细信息
   * 
   * @returns 异常详情
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      errorType: this.errorType,
      context: this.context,
      occurredAt: this.occurredAt.toISOString(),
      requestId: this.requestId,
      tenantId: this.tenantId,
      userId: this.userId,
      stack: this.stack,
      cause: this.cause ? (this.cause as any).toJSON?.() || (this.cause as Error).message : undefined,
    };
  }

  /**
   * 设置请求上下文
   * 
   * @param requestId 请求ID
   * @param tenantId 租户ID
   * @param userId 用户ID
   */
  setRequestContext(requestId?: string, tenantId?: string, userId?: string): void {
    if (requestId) this.requestId = requestId;
    if (tenantId) this.tenantId = tenantId;
    if (userId) this.userId = userId;
  }

  /**
   * 添加上下文信息
   * 
   * @param key 键
   * @param value 值
   */
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * 获取上下文信息
   * 
   * @param key 键
   * @returns 值
   */
  getContext(key: string): any {
    return this.context[key];
  }
}

/**
 * @class ValidationException
 * @description
 * 验证异常，用于表示数据验证失败
 */
export class ValidationException extends DomainException {
  constructor(
    message: string,
    field?: string,
    value?: any,
    context: Record<string, any> = {}
  ) {
    const errorCode = 'VALIDATION_ERROR';
    const fullContext = {
      field,
      value,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class BusinessRuleException
 * @description
 * 业务规则异常，用于表示业务规则违反
 */
export class BusinessRuleException extends DomainException {
  constructor(
    message: string,
    ruleName?: string,
    context: Record<string, any> = {}
  ) {
    const errorCode = 'BUSINESS_RULE_VIOLATION';
    const fullContext = {
      ruleName,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class EntityNotFoundException
 * @description
 * 实体未找到异常，用于表示请求的实体不存在
 */
export class EntityNotFoundException extends DomainException {
  constructor(
    entityType: string,
    entityId: string,
    context: Record<string, any> = {}
  ) {
    const message = `${entityType} with id '${entityId}' not found`;
    const errorCode = 'ENTITY_NOT_FOUND';
    const fullContext = {
      entityType,
      entityId,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class ConcurrencyException
 * @description
 * 并发异常，用于表示乐观锁冲突
 */
export class ConcurrencyException extends DomainException {
  constructor(
    entityType: string,
    entityId: string,
    expectedVersion: number,
    actualVersion: number,
    context: Record<string, any> = {}
  ) {
    const message = `Concurrency conflict for ${entityType} '${entityId}': expected version ${expectedVersion}, but actual version is ${actualVersion}`;
    const errorCode = 'CONCURRENCY_CONFLICT';
    const fullContext = {
      entityType,
      entityId,
      expectedVersion,
      actualVersion,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class UnauthorizedException
 * @description
 * 未授权异常，用于表示权限不足
 */
export class UnauthorizedException extends DomainException {
  constructor(
    action: string,
    resource: string,
    context: Record<string, any> = {}
  ) {
    const message = `Unauthorized to perform '${action}' on '${resource}'`;
    const errorCode = 'UNAUTHORIZED';
    const fullContext = {
      action,
      resource,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class InvalidOperationException
 * @description
 * 无效操作异常，用于表示操作在当前状态下无效
 */
export class InvalidOperationException extends DomainException {
  constructor(
    operation: string,
    entityType: string,
    entityId: string,
    currentState: string,
    context: Record<string, any> = {}
  ) {
    const message = `Cannot perform '${operation}' on ${entityType} '${entityId}' in state '${currentState}'`;
    const errorCode = 'INVALID_OPERATION';
    const fullContext = {
      operation,
      entityType,
      entityId,
      currentState,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class DomainEventException
 * @description
 * 领域事件异常，用于表示事件处理失败
 */
export class DomainEventException extends DomainException {
  constructor(
    eventType: string,
    aggregateId: string,
    reason: string,
    context: Record<string, any> = {}
  ) {
    const message = `Failed to process event '${eventType}' for aggregate '${aggregateId}': ${reason}`;
    const errorCode = 'DOMAIN_EVENT_ERROR';
    const fullContext = {
      eventType,
      aggregateId,
      reason,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class AggregateNotFoundException
 * @description
 * 聚合根未找到异常，用于表示事件溯源中的聚合根不存在
 */
export class AggregateNotFoundException extends DomainException {
  constructor(
    aggregateType: string,
    aggregateId: string,
    context: Record<string, any> = {}
  ) {
    const message = `Aggregate '${aggregateType}' with id '${aggregateId}' not found`;
    const errorCode = 'AGGREGATE_NOT_FOUND';
    const fullContext = {
      aggregateType,
      aggregateId,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class EventStoreException
 * @description
 * 事件存储异常，用于表示事件存储操作失败
 */
export class EventStoreException extends DomainException {
  constructor(
    operation: string,
    aggregateId: string,
    reason: string,
    context: Record<string, any> = {}
  ) {
    const message = `Event store operation '${operation}' failed for aggregate '${aggregateId}': ${reason}`;
    const errorCode = 'EVENT_STORE_ERROR';
    const fullContext = {
      operation,
      aggregateId,
      reason,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}

/**
 * @class SnapshotException
 * @description
 * 快照异常，用于表示快照操作失败
 */
export class SnapshotException extends DomainException {
  constructor(
    operation: string,
    aggregateId: string,
    reason: string,
    context: Record<string, any> = {}
  ) {
    const message = `Snapshot operation '${operation}' failed for aggregate '${aggregateId}': ${reason}`;
    const errorCode = 'SNAPSHOT_ERROR';
    const fullContext = {
      operation,
      aggregateId,
      reason,
      ...context,
    };

    super(message, errorCode, fullContext);
  }
}
