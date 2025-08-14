// 基础实体
export { BaseEntity } from './entities/base.entity';
export { EventSourcedAggregate } from './entities/event-sourced-aggregate';
export type { IEntity, EventSourcedAggregateRoot } from './entities/base.entity';

// 值对象
export { 
  BaseValueObject, 
  StringValueObject, 
  NumberValueObject, 
  BooleanValueObject 
} from './value-objects/base.value-object';
export type { IValueObject } from './value-objects/base.value-object';

// 事件
export { 
  BaseEvent, 
  DomainEvent, 
  IntegrationEvent
} from './events/base.event';
export type { RequestContext, EventMetadata, IEvent } from './events/base.event';

// 事件处理器
export { BaseEventHandler } from './events/event-handler.interface';
export type {
  EventHandler,
  EventHandlerResult,
  EventHandlerRegistry,
  EventPublisher,
  EventPublishResult,
  EventBus,
  EventBusStatus
} from './events/event-handler.interface';

// 事件存储
export type {
  EventStore,
  EventStoreOptions,
  StoredEvent,
  EventQuery,
  EventQueryResult
} from './repositories/event-store.interface';

// 快照管理
export { BaseSnapshotManager } from './repositories/snapshot-manager.interface';
export type {
  SnapshotManager,
  Snapshot,
  SnapshotMetadata,
  SnapshotOptions,
  SnapshotSerializer,
  SnapshotStorage
} from './repositories/snapshot-manager.interface';

// 异常
export {
  DomainException,
  ValidationException,
  BusinessRuleException,
  EntityNotFoundException,
  ConcurrencyException,
  UnauthorizedException,
  InvalidOperationException,
  DomainEventException,
  AggregateNotFoundException,
  EventStoreException,
  SnapshotException
} from './exceptions/domain.exception';
