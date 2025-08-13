# IAM系统Event Sourcing设计文档

## 📋 文档信息

- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档状态**: 设计文档
- **负责人**: 架构设计团队

---

## 🎯 文档目的

本文档描述了IAM系统中Event Sourcing（事件溯源）的设计方案，包括事件定义、事件存储、事件处理、状态重建等核心概念和实现细节。

---

## 📖 目录

1. [Event Sourcing概述](#event-sourcing概述)
2. [事件设计](#事件设计)
3. [事件存储设计](#事件存储设计)
4. [事件处理机制](#事件处理机制)
5. [状态重建机制](#状态重建机制)
6. [领域事件定义](#领域事件定义)
7. [实现架构](#实现架构)
8. [性能优化](#性能优化)
9. [监控与调试](#监控与调试)

---

## 🎯 Event Sourcing概述

### 1.1 什么是Event Sourcing

Event Sourcing是一种架构模式，它将系统中所有状态变更都记录为事件序列，而不是直接存储当前状态。通过重放这些事件，可以重建任何时间点的系统状态。

### 1.2 在IAM系统中的价值

#### 1.2.1 业务价值
- **完整审计追踪**: 记录所有操作历史，满足合规要求
- **状态重建**: 可以重建任何时间点的用户、租户状态
- **业务分析**: 通过事件分析用户行为和系统使用模式
- **故障恢复**: 通过事件重放进行故障恢复和调试

#### 1.2.2 技术价值
- **数据一致性**: 事件是不可变的，确保数据一致性
- **可扩展性**: 事件可以用于构建多种读模型
- **解耦**: 事件发布者和订阅者解耦
- **测试友好**: 可以通过事件重放进行测试

### 1.3 核心概念

- **Event Store**: 事件存储，保存所有领域事件
- **Event Stream**: 事件流，特定聚合的事件序列
- **Aggregate**: 聚合根，产生领域事件
- **Projection**: 投影，从事件构建读模型
- **Snapshot**: 快照，聚合状态的快照，用于性能优化

---

## 🏗️ 事件设计

### 2.1 事件基类设计

```typescript
/**
 * @abstract BaseEvent
 * @description 所有领域事件的基类
 */
export abstract class BaseEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly eventVersion: number;
  public readonly occurredAt: Date;
  public readonly metadata: EventMetadata;

  constructor(
    aggregateId: string,
    eventType: string,
    eventVersion: number = 1,
    metadata?: Partial<EventMetadata>
  ) {
    this.eventId = generateEventId();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.eventVersion = eventVersion;
    this.occurredAt = new Date();
    this.metadata = {
      userId: metadata?.userId,
      tenantId: metadata?.tenantId,
      correlationId: metadata?.correlationId,
      causationId: metadata?.causationId,
      ...metadata
    };
  }
}

/**
 * @interface EventMetadata
 * @description 事件元数据
 */
export interface EventMetadata {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  causationId?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}
```

### 2.2 事件版本控制

```typescript
/**
 * @interface EventVersion
 * @description 事件版本信息
 */
export interface EventVersion {
  eventType: string;
  version: number;
  migration?: (event: any) => any;
}

/**
 * @class EventVersionRegistry
 * @description 事件版本注册表
 */
export class EventVersionRegistry {
  private static versions = new Map<string, EventVersion[]>();

  static register(eventType: string, version: EventVersion): void {
    if (!this.versions.has(eventType)) {
      this.versions.set(eventType, []);
    }
    this.versions.get(eventType)!.push(version);
  }

  static getLatestVersion(eventType: string): number {
    const versions = this.versions.get(eventType);
    return versions ? Math.max(...versions.map(v => v.version)) : 1;
  }

  static migrate(event: any): any {
    const versions = this.versions.get(event.eventType);
    if (!versions) return event;

    let migratedEvent = { ...event };
    for (const version of versions) {
      if (version.migration && event.eventVersion < version.version) {
        migratedEvent = version.migration(migratedEvent);
        migratedEvent.eventVersion = version.version;
      }
    }
    return migratedEvent;
  }
}
```

### 2.3 事件生成器

```typescript
/**
 * @function generateEventId
 * @description 生成唯一事件ID
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * @function generateCorrelationId
 * @description 生成关联ID，用于追踪相关事件
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}
```

---

## 🗄️ 事件存储设计

### 3.1 事件存储接口

```typescript
/**
 * @interface EventStore
 * @description 事件存储接口
 */
export interface EventStore {
  /**
   * 保存事件
   */
  saveEvents(aggregateId: string, events: BaseEvent[], expectedVersion: number): Promise<void>;

  /**
   * 获取事件流
   */
  getEvents(aggregateId: string, fromVersion?: number): Promise<BaseEvent[]>;

  /**
   * 获取所有事件
   */
  getAllEvents(fromDate?: Date, toDate?: Date): Promise<BaseEvent[]>;

  /**
   * 保存快照
   */
  saveSnapshot(aggregateId: string, snapshot: any, version: number): Promise<void>;

  /**
   * 获取最新快照
   */
  getLatestSnapshot(aggregateId: string): Promise<any>;

  /**
   * 订阅事件
   */
  subscribe(eventTypes: string[], handler: EventHandler): Promise<void>;
}
```

### 3.2 数据库设计

#### 3.2.1 事件表设计

```sql
-- 事件表
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(36) NOT NULL UNIQUE,
  aggregate_id VARCHAR(36) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER NOT NULL,
  event_data JSONB NOT NULL,
  event_metadata JSONB,
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_occurred_at ON events(occurred_at);
CREATE INDEX idx_events_aggregate_version ON events(aggregate_id, event_version);

-- 快照表
CREATE TABLE snapshots (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id VARCHAR(36) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_snapshots_aggregate_id ON snapshots(aggregate_id);
CREATE INDEX idx_snapshots_version ON snapshots(aggregate_id, snapshot_version);

-- 事件订阅表
CREATE TABLE event_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  subscription_id VARCHAR(36) NOT NULL UNIQUE,
  subscription_name VARCHAR(100) NOT NULL,
  event_types TEXT[] NOT NULL,
  last_processed_event_id VARCHAR(36),
  last_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_subscriptions_name ON event_subscriptions(subscription_name);
```

### 3.3 事件存储实现

```typescript
/**
 * @class PostgresEventStore
 * @description PostgreSQL事件存储实现
 */
@Injectable()
export class PostgresEventStore implements EventStore {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(SnapshotEntity)
    private readonly snapshotRepository: Repository<SnapshotEntity>,
    private readonly connection: Connection
  ) {}

  async saveEvents(
    aggregateId: string, 
    events: BaseEvent[], 
    expectedVersion: number
  ): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 检查版本一致性
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyException(
          `Expected version ${expectedVersion}, but got ${currentVersion}`
        );
      }

      // 保存事件
      const eventEntities = events.map((event, index) => ({
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        aggregateType: this.getAggregateType(event),
        eventType: event.eventType,
        eventVersion: expectedVersion + index + 1,
        eventData: event,
        eventMetadata: event.metadata,
        occurredAt: event.occurredAt
      }));

      await queryRunner.manager.save(EventEntity, eventEntities);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<BaseEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.eventVersion', 'ASC');

    if (fromVersion) {
      query.andWhere('event.eventVersion > :fromVersion', { fromVersion });
    }

    const events = await query.getMany();
    return events.map(event => this.deserializeEvent(event.eventData));
  }

  async saveSnapshot(aggregateId: string, snapshot: any, version: number): Promise<void> {
    const snapshotEntity = {
      aggregateId,
      aggregateType: this.getAggregateType(snapshot),
      snapshotData: snapshot,
      snapshotVersion: version
    };

    await this.snapshotRepository.save(snapshotEntity);
  }

  async getLatestSnapshot(aggregateId: string): Promise<any> {
    const snapshot = await this.snapshotRepository
      .createQueryBuilder('snapshot')
      .where('snapshot.aggregateId = :aggregateId', { aggregateId })
      .orderBy('snapshot.snapshotVersion', 'DESC')
      .getOne();

    return snapshot ? snapshot.snapshotData : null;
  }

  private getCurrentVersion(aggregateId: string): Promise<number> {
    return this.eventRepository
      .createQueryBuilder('event')
      .select('MAX(event.eventVersion)', 'version')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .getRawOne()
      .then(result => result?.version || 0);
  }

  private getAggregateType(event: BaseEvent): string {
    return event.constructor.name.replace('Event', '');
  }

  private deserializeEvent(eventData: any): BaseEvent {
    // 根据事件类型反序列化事件
    const eventClass = this.getEventClass(eventData.eventType);
    return Object.assign(new eventClass(), eventData);
  }
}
```

### 3.4 事件实体

```typescript
/**
 * @class EventEntity
 * @description 事件实体
 */
@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'event_id', type: 'varchar', length: 36, unique: true })
  eventId: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 36 })
  aggregateId: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @Column({ name: 'event_version', type: 'integer' })
  eventVersion: number;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData: any;

  @Column({ name: 'event_metadata', type: 'jsonb', nullable: true })
  eventMetadata: any;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * @class SnapshotEntity
 * @description 快照实体
 */
@Entity('snapshots')
export class SnapshotEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 36 })
  aggregateId: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string;

  @Column({ name: 'snapshot_data', type: 'jsonb' })
  snapshotData: any;

  @Column({ name: 'snapshot_version', type: 'integer' })
  snapshotVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## 🔄 事件处理机制

### 4.1 事件处理器

```typescript
/**
 * @interface EventHandler
 * @description 事件处理器接口
 */
export interface EventHandler {
  handle(event: BaseEvent): Promise<void>;
}

/**
 * @abstract BaseEventHandler
 * @description 事件处理器基类
 */
export abstract class BaseEventHandler implements EventHandler {
  abstract handle(event: BaseEvent): Promise<void>;

  protected logEvent(event: BaseEvent): void {
    console.log(`Handling event: ${event.eventType} for aggregate: ${event.aggregateId}`);
  }

  protected async handleWithRetry(
    event: BaseEvent, 
    handler: () => Promise<void>,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await handler();
        return;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await this.delay(Math.pow(2, i) * 1000); // 指数退避
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4.2 事件总线

```typescript
/**
 * @class EventBus
 * @description 事件总线，负责事件的分发
 */
@Injectable()
export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  register(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    const promises = handlers.map(handler => 
      handler.handle(event).catch(error => {
        console.error(`Error handling event ${event.eventType}:`, error);
        throw error;
      })
    );

    await Promise.all(promises);
  }

  async publishAll(events: BaseEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

### 4.3 事件订阅器

```typescript
/**
 * @class EventSubscriber
 * @description 事件订阅器，处理异步事件
 */
@Injectable()
export class EventSubscriber {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus
  ) {}

  async startSubscription(subscriptionName: string): Promise<void> {
    const subscription = await this.getSubscription(subscriptionName);
    
    setInterval(async () => {
      await this.processEvents(subscription);
    }, 1000); // 每秒处理一次
  }

  private async processEvents(subscription: any): Promise<void> {
    const events = await this.getUnprocessedEvents(subscription);
    
    for (const event of events) {
      try {
        await this.eventBus.publish(event);
        await this.updateSubscriptionPosition(subscription, event.eventId);
      } catch (error) {
        console.error(`Error processing event ${event.eventId}:`, error);
        // 可以在这里实现死信队列
      }
    }
  }

  private async getUnprocessedEvents(subscription: any): Promise<BaseEvent[]> {
    // 获取未处理的事件
    return this.eventStore.getAllEvents();
  }

  private async updateSubscriptionPosition(
    subscription: any, 
    eventId: string
  ): Promise<void> {
    // 更新订阅位置
  }
}
```

---

## 🔄 状态重建机制

### 5.1 聚合基类

```typescript
/**
 * @abstract EventSourcedAggregate
 * @description 支持事件溯源的聚合基类
 */
export abstract class EventSourcedAggregate {
  private uncommittedEvents: BaseEvent[] = [];
  private version: number = 0;

  protected apply(event: BaseEvent): void {
    this.uncommittedEvents.push(event);
    this.when(event);
  }

  protected abstract when(event: BaseEvent): void;

  getUncommittedEvents(): BaseEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: BaseEvent[]): void {
    events.forEach(event => {
      this.when(event);
      this.version = event.eventVersion;
    });
  }

  getVersion(): number {
    return this.version;
  }

  protected setVersion(version: number): void {
    this.version = version;
  }

  abstract getId(): string;
}
```

### 5.2 快照机制

```typescript
/**
 * @interface SnapshotStrategy
 * @description 快照策略接口
 */
export interface SnapshotStrategy {
  shouldCreateSnapshot(aggregate: EventSourcedAggregate): boolean;
}

/**
 * @class VersionBasedSnapshotStrategy
 * @description 基于版本号的快照策略
 */
export class VersionBasedSnapshotStrategy implements SnapshotStrategy {
  constructor(private readonly snapshotInterval: number = 100) {}

  shouldCreateSnapshot(aggregate: EventSourcedAggregate): boolean {
    return aggregate.getVersion() % this.snapshotInterval === 0;
  }
}

/**
 * @class SnapshotManager
 * @description 快照管理器
 */
@Injectable()
export class SnapshotManager {
  constructor(
    private readonly eventStore: EventStore,
    private readonly snapshotStrategy: SnapshotStrategy
  ) {}

  async createSnapshotIfNeeded(aggregate: EventSourcedAggregate): Promise<void> {
    if (this.snapshotStrategy.shouldCreateSnapshot(aggregate)) {
      await this.eventStore.saveSnapshot(
        aggregate.getId(),
        this.serializeAggregate(aggregate),
        aggregate.getVersion()
      );
    }
  }

  async loadAggregate<T extends EventSourcedAggregate>(
    aggregateId: string,
    aggregateClass: new () => T
  ): Promise<T> {
    // 尝试加载快照
    const snapshot = await this.eventStore.getLatestSnapshot(aggregateId);
    let aggregate: T;
    let fromVersion = 0;

    if (snapshot) {
      aggregate = this.deserializeAggregate(snapshot, aggregateClass);
      fromVersion = aggregate.getVersion();
    } else {
      aggregate = new aggregateClass();
    }

    // 加载快照之后的事件
    const events = await this.eventStore.getEvents(aggregateId, fromVersion);
    aggregate.loadFromHistory(events);

    return aggregate;
  }

  private serializeAggregate(aggregate: EventSourcedAggregate): any {
    // 序列化聚合状态
    return {
      id: aggregate.getId(),
      version: aggregate.getVersion(),
      state: aggregate.getState()
    };
  }

  private deserializeAggregate<T extends EventSourcedAggregate>(
    snapshot: any,
    aggregateClass: new () => T
  ): T {
    // 反序列化聚合状态
    const aggregate = new aggregateClass();
    aggregate.loadFromSnapshot(snapshot);
    return aggregate;
  }
}
```

### 5.3 聚合仓储

```typescript
/**
 * @abstract EventSourcedRepository
 * @description 事件溯源仓储基类
 */
export abstract class EventSourcedRepository<T extends EventSourcedAggregate> {
  constructor(
    protected readonly eventStore: EventStore,
    protected readonly snapshotManager: SnapshotManager,
    protected readonly eventBus: EventBus
  ) {}

  async save(aggregate: T): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents();
    
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        aggregate.getId(),
        uncommittedEvents,
        aggregate.getVersion()
      );

      // 发布事件
      await this.eventBus.publishAll(uncommittedEvents);

      // 标记事件为已提交
      aggregate.markEventsAsCommitted();

      // 创建快照（如果需要）
      await this.snapshotManager.createSnapshotIfNeeded(aggregate);
    }
  }

  async findById(aggregateId: string): Promise<T | null> {
    try {
      return await this.snapshotManager.loadAggregate(aggregateId, this.getAggregateClass());
    } catch (error) {
      if (error instanceof AggregateNotFoundException) {
        return null;
      }
      throw error;
    }
  }

  protected abstract getAggregateClass(): new () => T;
}
```

---

## 🎯 领域事件定义

### 6.1 租户管理领域事件

```typescript
// 租户创建事件
export class TenantCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly tenantCode: string,
    public readonly tenantName: string,
    public readonly adminId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantCreated', 1, metadata);
  }
}

// 租户重命名事件
export class TenantRenamedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly oldName: string,
    public readonly newName: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantRenamed', 1, metadata);
  }
}

// 租户状态变更事件
export class TenantStatusChangedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly oldStatus: TenantStatus,
    public readonly newStatus: TenantStatus,
    public readonly reason: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantStatusChanged', 1, metadata);
  }
}

// 租户管理员变更事件
export class TenantAdminChangedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly oldAdminId: string,
    public readonly newAdminId: string,
    public readonly reason: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantAdminChanged', 1, metadata);
  }
}
```

### 6.2 用户管理领域事件

```typescript
// 用户创建事件
export class UserCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly tenantId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserCreated', 1, metadata);
  }
}

// 用户激活事件
export class UserActivatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly activatedAt: Date,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserActivated', 1, metadata);
  }
}

// 用户租户变更事件
export class UserTenantChangedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly oldTenantId: string,
    public readonly newTenantId: string,
    public readonly reason: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserTenantChanged', 1, metadata);
  }
}

// 用户信息更新事件
export class UserProfileUpdatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly updatedFields: Record<string, any>,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserProfileUpdated', 1, metadata);
  }
}
```

### 6.3 权限管理领域事件

```typescript
// 角色创建事件
export class RoleCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly roleName: string,
    public readonly roleCode: string,
    public readonly permissions: string[],
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'RoleCreated', 1, metadata);
  }
}

// 用户角色分配事件
export class UserRoleAssignedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly roleId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserRoleAssigned', 1, metadata);
  }
}

// 用户角色移除事件
export class UserRoleRemovedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly roleId: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserRoleRemoved', 1, metadata);
  }
}
```

### 6.4 申请审核领域事件

```typescript
// 租户申请提交事件
export class TenantApplicationSubmittedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly applicantId: string,
    public readonly tenantName: string,
    public readonly tenantCode: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantApplicationSubmitted', 1, metadata);
  }
}

// 租户申请审核事件
export class TenantApplicationReviewedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly reviewerId: string,
    public readonly approved: boolean,
    public readonly reviewComment: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'TenantApplicationReviewed', 1, metadata);
  }
}

// 用户租户变更申请提交事件
export class UserTenantChangeApplicationSubmittedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly changeType: TenantChangeType,
    public readonly targetTenantId: string,
    public readonly reason: string,
    metadata?: Partial<EventMetadata>
  ) {
    super(aggregateId, 'UserTenantChangeApplicationSubmitted', 1, metadata);
  }
}
```

---

## 🏗️ 实现架构

### 7.1 模块结构

```
apps/api/src/
├── shared/
│   ├── domain/
│   │   ├── events/
│   │   │   ├── base-event.ts
│   │   │   ├── event-metadata.ts
│   │   │   └── event-version.ts
│   │   ├── aggregates/
│   │   │   └── event-sourced-aggregate.ts
│   │   └── repositories/
│   │       └── event-store.interface.ts
│   │
│   ├── infrastructure/
│   │   ├── events/
│   │   │   ├── postgres-event-store.ts
│   │   │   ├── event-bus.ts
│   │   │   ├── event-subscriber.ts
│   │   │   └── snapshot-manager.ts
│   │   └── entities/
│   │       ├── event.entity.ts
│   │       └── snapshot.entity.ts
│   │
│   └── application/
│       └── events/
│           └── event-handler.interface.ts
│
├── modules/
│   ├── tenant-management/
│   │   ├── domain/
│   │   │   ├── events/
│   │   │   │   ├── tenant-created.event.ts
│   │   │   │   ├── tenant-renamed.event.ts
│   │   │   │   └── tenant-status-changed.event.ts
│   │   │   └── aggregates/
│   │   │       └── tenant.aggregate.ts
│   │   └── application/
│   │       └── handlers/
│   │           ├── tenant-created.handler.ts
│   │           └── tenant-renamed.handler.ts
│   │
│   ├── user-management/
│   │   ├── domain/
│   │   │   ├── events/
│   │   │   │   ├── user-created.event.ts
│   │   │   │   ├── user-activated.event.ts
│   │   │   │   └── user-tenant-changed.event.ts
│   │   │   └── aggregates/
│   │   │       └── user.aggregate.ts
│   │   └── application/
│   │       └── handlers/
│   │           ├── user-created.handler.ts
│   │           └── user-activated.handler.ts
│   │
│   └── permission-management/
│       ├── domain/
│       │   ├── events/
│       │   │   ├── role-created.event.ts
│       │   │   └── user-role-assigned.event.ts
│       │   └── aggregates/
│       │       └── role.aggregate.ts
│       └── application/
│           └── handlers/
│               ├── role-created.handler.ts
│               └── user-role-assigned.handler.ts
```

### 7.2 配置模块

```typescript
/**
 * @class EventSourcingModule
 * @description Event Sourcing模块配置
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, SnapshotEntity]),
  ],
  providers: [
    PostgresEventStore,
    EventBus,
    EventSubscriber,
    SnapshotManager,
    VersionBasedSnapshotStrategy,
    {
      provide: 'SNAPSHOT_STRATEGY',
      useClass: VersionBasedSnapshotStrategy,
    },
  ],
  exports: [
    PostgresEventStore,
    EventBus,
    EventSubscriber,
    SnapshotManager,
  ],
})
export class EventSourcingModule {}
```

### 7.3 聚合实现示例

```typescript
/**
 * @class Tenant
 * @description 租户聚合根
 */
export class Tenant extends EventSourcedAggregate {
  private id: TenantId;
  private code: TenantCode;
  private name: TenantName;
  private status: TenantStatus;
  private adminId: UserId;
  private config: TenantConfig;

  constructor() {
    super();
  }

  static create(
    tenantId: TenantId,
    code: TenantCode,
    name: TenantName,
    adminId: UserId
  ): Tenant {
    const tenant = new Tenant();
    tenant.apply(new TenantCreatedEvent(
      tenantId.value,
      code.value,
      name.value,
      adminId.value
    ));
    return tenant;
  }

  rename(newName: TenantName): void {
    if (this.name.equals(newName)) {
      return;
    }

    this.apply(new TenantRenamedEvent(
      this.id.value,
      this.name.value,
      newName.value
    ));
  }

  changeStatus(newStatus: TenantStatus, reason: string): void {
    if (this.status === newStatus) {
      return;
    }

    this.apply(new TenantStatusChangedEvent(
      this.id.value,
      this.status,
      newStatus,
      reason
    ));
  }

  changeAdmin(newAdminId: UserId, reason: string): void {
    if (this.adminId.equals(newAdminId)) {
      return;
    }

    this.apply(new TenantAdminChangedEvent(
      this.id.value,
      this.adminId.value,
      newAdminId.value,
      reason
    ));
  }

  protected when(event: BaseEvent): void {
    switch (event.eventType) {
      case 'TenantCreated':
        this.whenTenantCreated(event as TenantCreatedEvent);
        break;
      case 'TenantRenamed':
        this.whenTenantRenamed(event as TenantRenamedEvent);
        break;
      case 'TenantStatusChanged':
        this.whenTenantStatusChanged(event as TenantStatusChangedEvent);
        break;
      case 'TenantAdminChanged':
        this.whenTenantAdminChanged(event as TenantAdminChangedEvent);
        break;
    }
  }

  private whenTenantCreated(event: TenantCreatedEvent): void {
    this.id = new TenantId(event.aggregateId);
    this.code = new TenantCode(event.tenantCode);
    this.name = new TenantName(event.tenantName);
    this.adminId = new UserId(event.adminId);
    this.status = TenantStatus.ACTIVE;
    this.config = new TenantConfig();
  }

  private whenTenantRenamed(event: TenantRenamedEvent): void {
    this.name = new TenantName(event.newName);
  }

  private whenTenantStatusChanged(event: TenantStatusChangedEvent): void {
    this.status = event.newStatus;
  }

  private whenTenantAdminChanged(event: TenantAdminChangedEvent): void {
    this.adminId = new UserId(event.newAdminId);
  }

  getId(): string {
    return this.id.value;
  }

  getState(): any {
    return {
      id: this.id.value,
      code: this.code.value,
      name: this.name.value,
      status: this.status,
      adminId: this.adminId.value,
      config: this.config
    };
  }

  loadFromSnapshot(snapshot: any): void {
    this.id = new TenantId(snapshot.id);
    this.code = new TenantCode(snapshot.code);
    this.name = new TenantName(snapshot.name);
    this.status = snapshot.status;
    this.adminId = new UserId(snapshot.adminId);
    this.config = snapshot.config;
    this.setVersion(snapshot.version);
  }
}
```

### 7.4 事件处理器示例

```typescript
/**
 * @class TenantCreatedHandler
 * @description 租户创建事件处理器
 */
@Injectable()
export class TenantCreatedHandler extends BaseEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService
  ) {
    super();
  }

  async handle(event: TenantCreatedEvent): Promise<void> {
    await this.handleWithRetry(event, async () => {
      // 发送通知给申请人
      await this.notificationService.sendTenantCreatedNotification(
        event.adminId,
        event.tenantName
      );

      // 记录审计日志
      await this.auditService.logTenantCreation(
        event.aggregateId,
        event.adminId,
        event.tenantName
      );
    });
  }
}

/**
 * @class UserCreatedHandler
 * @description 用户创建事件处理器
 */
@Injectable()
export class UserCreatedHandler extends BaseEventHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService
  ) {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    await this.handleWithRetry(event, async () => {
      // 发送欢迎邮件
      await this.emailService.sendWelcomeEmail(
        event.email,
        event.username
      );

      // 记录审计日志
      await this.auditService.logUserCreation(
        event.aggregateId,
        event.email,
        event.tenantId
      );
    });
  }
}
```

---

## ⚡ 性能优化

### 8.1 快照优化

```typescript
/**
 * @class SnapshotOptimization
 * @description 快照优化策略
 */
export class SnapshotOptimization {
  // 基于时间的快照策略
  static timeBasedStrategy(intervalMinutes: number = 60): SnapshotStrategy {
    return {
      shouldCreateSnapshot: (aggregate: EventSourcedAggregate) => {
        const lastSnapshot = aggregate.getLastSnapshotTime();
        if (!lastSnapshot) return true;
        
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSnapshot.getTime()) / (1000 * 60);
        return diffMinutes >= intervalMinutes;
      }
    };
  }

  // 基于事件数量的快照策略
  static eventCountStrategy(eventCount: number = 100): SnapshotStrategy {
    return {
      shouldCreateSnapshot: (aggregate: EventSourcedAggregate) => {
        return aggregate.getUncommittedEvents().length >= eventCount;
      }
    };
  }
}
```

### 8.2 事件分页

```typescript
/**
 * @interface EventPage
 * @description 事件分页结果
 */
export interface EventPage {
  events: BaseEvent[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * @class EventPagination
 * @description 事件分页处理
 */
export class EventPagination {
  static async getEventsPage(
    eventStore: EventStore,
    aggregateId: string,
    pageSize: number = 100,
    cursor?: string
  ): Promise<EventPage> {
    const events = await eventStore.getEvents(aggregateId, cursor ? parseInt(cursor) : 0);
    
    const pageEvents = events.slice(0, pageSize);
    const hasMore = events.length > pageSize;
    const nextCursor = hasMore ? (parseInt(cursor || '0') + pageSize).toString() : undefined;

    return {
      events: pageEvents,
      nextCursor,
      hasMore
    };
  }
}
```

### 8.3 事件压缩

```typescript
/**
 * @class EventCompression
 * @description 事件压缩处理
 */
export class EventCompression {
  static compressEvents(events: BaseEvent[]): BaseEvent[] {
    // 实现事件压缩逻辑
    // 例如：合并相同类型的连续事件
    return events.reduce((compressed, event) => {
      const lastEvent = compressed[compressed.length - 1];
      
      if (this.canCompress(lastEvent, event)) {
        return this.mergeEvents(compressed, event);
      } else {
        compressed.push(event);
        return compressed;
      }
    }, [] as BaseEvent[]);
  }

  private static canCompress(event1: BaseEvent, event2: BaseEvent): boolean {
    // 判断两个事件是否可以压缩
    return event1.eventType === event2.eventType &&
           event1.aggregateId === event2.aggregateId;
  }

  private static mergeEvents(events: BaseEvent[], newEvent: BaseEvent): BaseEvent[] {
    // 合并事件逻辑
    const lastEvent = events[events.length - 1];
    const mergedEvent = this.createMergedEvent(lastEvent, newEvent);
    events[events.length - 1] = mergedEvent;
    return events;
  }
}
```

---

## 📊 监控与调试

### 9.1 事件监控

```typescript
/**
 * @class EventMonitor
 * @description 事件监控器
 */
@Injectable()
export class EventMonitor {
  private eventMetrics = new Map<string, number>();

  recordEvent(event: BaseEvent): void {
    const count = this.eventMetrics.get(event.eventType) || 0;
    this.eventMetrics.set(event.eventType, count + 1);
  }

  getEventMetrics(): Map<string, number> {
    return new Map(this.eventMetrics);
  }

  async generateEventReport(): Promise<EventReport> {
    const report: EventReport = {
      totalEvents: 0,
      eventsByType: {},
      eventsByAggregate: {},
      eventsByTime: {},
      generatedAt: new Date()
    };

    // 生成事件报告
    return report;
  }
}

/**
 * @interface EventReport
 * @description 事件报告接口
 */
export interface EventReport {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByAggregate: Record<string, number>;
  eventsByTime: Record<string, number>;
  generatedAt: Date;
}
```

### 9.2 事件重放工具

```typescript
/**
 * @class EventReplayTool
 * @description 事件重放工具
 */
@Injectable()
export class EventReplayTool {
  constructor(
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus
  ) {}

  async replayEvents(
    fromDate: Date,
    toDate: Date,
    eventTypes?: string[]
  ): Promise<void> {
    const events = await this.eventStore.getAllEvents(fromDate, toDate);
    
    const filteredEvents = eventTypes 
      ? events.filter(event => eventTypes.includes(event.eventType))
      : events;

    console.log(`Replaying ${filteredEvents.length} events...`);

    for (const event of filteredEvents) {
      try {
        await this.eventBus.publish(event);
        console.log(`Replayed event: ${event.eventType} - ${event.eventId}`);
      } catch (error) {
        console.error(`Error replaying event ${event.eventId}:`, error);
      }
    }
  }

  async replayAggregateEvents(
    aggregateId: string,
    fromVersion?: number
  ): Promise<void> {
    const events = await this.eventStore.getEvents(aggregateId, fromVersion);
    
    console.log(`Replaying ${events.length} events for aggregate ${aggregateId}...`);

    for (const event of events) {
      try {
        await this.eventBus.publish(event);
        console.log(`Replayed event: ${event.eventType} - ${event.eventId}`);
      } catch (error) {
        console.error(`Error replaying event ${event.eventId}:`, error);
      }
    }
  }
}
```

### 9.3 事件调试工具

```typescript
/**
 * @class EventDebugger
 * @description 事件调试工具
 */
@Injectable()
export class EventDebugger {
  constructor(private readonly eventStore: EventStore) {}

  async debugAggregate(aggregateId: string): Promise<AggregateDebugInfo> {
    const events = await this.eventStore.getEvents(aggregateId);
    const snapshot = await this.eventStore.getLatestSnapshot(aggregateId);

    return {
      aggregateId,
      totalEvents: events.length,
      events: events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        occurredAt: event.occurredAt,
        metadata: event.metadata
      })),
      snapshot: snapshot ? {
        version: snapshot.snapshotVersion,
        createdAt: snapshot.createdAt
      } : null
    };
  }

  async validateEventStream(aggregateId: string): Promise<ValidationResult> {
    const events = await this.eventStore.getEvents(aggregateId);
    const issues: string[] = [];

    // 检查事件版本连续性
    for (let i = 1; i < events.length; i++) {
      if (events[i].eventVersion !== events[i-1].eventVersion + 1) {
        issues.push(`Event version gap at position ${i}`);
      }
    }

    // 检查事件时间顺序
    for (let i = 1; i < events.length; i++) {
      if (events[i].occurredAt < events[i-1].occurredAt) {
        issues.push(`Event time order issue at position ${i}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

/**
 * @interface AggregateDebugInfo
 * @description 聚合调试信息
 */
export interface AggregateDebugInfo {
  aggregateId: string;
  totalEvents: number;
  events: Array<{
    eventId: string;
    eventType: string;
    eventVersion: number;
    occurredAt: Date;
    metadata: any;
  }>;
  snapshot: {
    version: number;
    createdAt: Date;
  } | null;
}

/**
 * @interface ValidationResult
 * @description 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}
```

---

## 📝 总结

Event Sourcing为IAM系统提供了以下核心价值：

### 🎯 核心优势

1. **完整审计追踪**: 所有状态变更都有完整的事件记录，满足企业级合规要求
2. **状态重建能力**: 可以重建任何时间点的系统状态，支持历史数据查询
3. **业务分析支持**: 通过事件分析用户行为和系统使用模式，支持数据驱动决策
4. **故障恢复**: 通过事件重放进行故障恢复和调试，提高系统可靠性
5. **数据一致性**: 事件不可变性确保数据一致性，避免数据损坏
6. **系统解耦**: 事件发布者和订阅者解耦，支持微服务架构

### 🏗️ 技术实现要点

1. **事件设计**: 定义清晰的事件结构和版本控制机制
2. **存储机制**: 使用PostgreSQL存储事件和快照，支持高性能查询
3. **处理流程**: 实现事件总线、处理器和订阅器，支持异步处理
4. **状态重建**: 通过快照和事件重放实现高效的状态重建
5. **性能优化**: 使用快照、分页、压缩等技术优化性能
6. **监控调试**: 提供完整的监控和调试工具，支持运维管理

### 🔄 实施建议

1. **渐进式实施**: 先在核心领域实施Event Sourcing，逐步扩展到其他领域
2. **性能监控**: 密切监控事件存储和处理的性能指标
3. **数据备份**: 建立完善的事件数据备份和恢复机制
4. **团队培训**: 对开发团队进行Event Sourcing相关培训
5. **文档完善**: 建立详细的事件文档和处理流程文档

通过合理的事件设计、存储机制、处理流程和性能优化，Event Sourcing将成为IAM系统的核心架构模式，为系统的可扩展性、可维护性和可靠性提供强有力的支撑。这种架构模式特别适合IAM系统这种需要完整审计追踪、状态重建和业务分析的企业级应用。
