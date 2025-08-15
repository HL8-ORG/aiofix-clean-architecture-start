import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../logging/services/pino-logger.service';
import { LogContext } from '../../logging/interfaces/logging.interface';
import { EventMetadata, EventType, EventStatus } from '../stores/postgres-event-store';

/**
 * @interface EventPublisherConfig
 * @description
 * 事件发布服务配置接口。
 */
export interface EventPublisherConfig {
  /** 是否启用事件发布 */
  enabled?: boolean;
  /** 是否启用异步发布 */
  enableAsync?: boolean;
  /** 是否启用发布队列 */
  enableQueue?: boolean;
  /** 队列大小 */
  queueSize?: number;
  /** 发布超时时间（毫秒） */
  publishTimeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用发布确认 */
  enableAck?: boolean;
  /** 是否启用发布统计 */
  enableStats?: boolean;
  /** 是否启用发布事件 */
  enableEvents?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 最大发布并发数 */
  maxConcurrency?: number;
  /** 批量发布大小 */
  batchSize?: number;
  /** 发布失败处理策略 */
  failureStrategy?: 'retry' | 'dead_letter' | 'ignore';
  /** 死信队列TTL（秒） */
  deadLetterTtl?: number;
}

/**
 * @interface PublishedEvent
 * @description
 * 已发布事件接口。
 */
export interface PublishedEvent {
  /** 发布ID */
  publishId: string;
  /** 原始事件 */
  event: EventMetadata;
  /** 发布时间 */
  publishedAt: Date;
  /** 发布状态 */
  status: 'pending' | 'published' | 'failed' | 'acknowledged';
  /** 重试次数 */
  retries: number;
  /** 错误信息 */
  error?: string;
  /** 确认时间 */
  acknowledgedAt?: Date;
  /** 订阅者确认 */
  acknowledgments: string[];
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * @interface EventSubscription
 * @description
 * 事件订阅接口。
 */
export interface EventSubscription {
  /** 订阅ID */
  subscriptionId: string;
  /** 事件类型 */
  eventType: EventType;
  /** 订阅者ID */
  subscriberId: string;
  /** 订阅者名称 */
  subscriberName: string;
  /** 订阅者URL */
  subscriberUrl?: string;
  /** 订阅状态 */
  status: 'active' | 'inactive' | 'error';
  /** 创建时间 */
  createdAt: Date;
  /** 最后活跃时间 */
  lastActiveAt: Date;
  /** 错误次数 */
  errorCount: number;
  /** 配置 */
  config?: Record<string, any>;
}

/**
 * @interface PublisherStats
 * @description
 * 发布者统计信息接口。
 */
export interface PublisherStats {
  /** 总发布事件数 */
  totalPublished: number;
  /** 成功发布数 */
  successfulPublished: number;
  /** 失败发布数 */
  failedPublished: number;
  /** 重试次数 */
  retryCount: number;
  /** 平均发布时间（毫秒） */
  averagePublishTime: number;
  /** 最大发布时间（毫秒） */
  maxPublishTime: number;
  /** 最小发布时间（毫秒） */
  minPublishTime: number;
  /** 活跃订阅数 */
  activeSubscriptions: number;
  /** 总订阅数 */
  totalSubscriptions: number;
  /** 队列大小 */
  queueSize: number;
  /** 错误次数 */
  errorCount: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * @interface PublishResult
 * @description
 * 发布结果接口。
 */
export interface PublishResult {
  /** 是否成功 */
  success: boolean;
  /** 发布ID */
  publishId?: string;
  /** 错误信息 */
  error?: string;
  /** 响应时间（毫秒） */
  responseTime?: number;
  /** 重试次数 */
  retries?: number;
  /** 确认的订阅者数量 */
  acknowledgments?: number;
}

/**
 * @class EventPublisherService
 * @description
 * 事件发布服务，负责事件的发布和订阅管理。
 * 
 * 主要功能包括：
 * 1. 事件发布和分发
 * 2. 订阅者管理
 * 3. 发布确认机制
 * 4. 失败重试和死信队列
 * 5. 发布统计和监控
 * 6. 异步发布队列
 * 
 * 设计原则：
 * - 可靠性：确保事件可靠发布到所有订阅者
 * - 高性能：支持异步发布和批量处理
 * - 可扩展：支持动态订阅者注册
 * - 监控性：提供详细的发布统计和监控
 * - 容错性：支持失败重试和死信队列
 */
@Injectable()
export class EventPublisherService {
  private readonly logger: PinoLoggerService;

  /**
   * 服务配置
   */
  private config: EventPublisherConfig;

  /**
   * 事件发布队列
   */
  private publishQueue: PublishedEvent[] = [];

  /**
   * 订阅者注册表
   */
  private subscriptions: Map<string, EventSubscription> = new Map();

  /**
   * 发布统计
   */
  private stats: PublisherStats;

  /**
   * 监控定时器
   */
  private monitoringTimer?: NodeJS.Timeout;

  /**
   * 发布锁
   */
  private isPublishing: boolean = false;

  constructor(
    @Inject('EVENT_PUBLISHER_CONFIG') config: EventPublisherConfig,
    private readonly eventEmitter: EventEmitter2,
    logger: PinoLoggerService
  ) {
    this.logger = logger;
    this.config = {
      enabled: true,
      enableAsync: true,
      enableQueue: true,
      queueSize: 1000,
      publishTimeout: 30000,
      retries: 3,
      retryDelay: 1000,
      enableAck: true,
      enableStats: true,
      enableEvents: true,
      monitoringInterval: 60000,
      maxConcurrency: 10,
      batchSize: 100,
      failureStrategy: 'retry',
      deadLetterTtl: 86400,
      ...config,
    };

    this.stats = this.initializeStats();
    this.startMonitoring();

    this.logger.info('EventPublisherService initialized', LogContext.DATABASE);
  }

  /**
   * @method publishEvent
   * @description 发布单个事件
   * @param event 事件数据
   * @returns {Promise<PublishResult>} 发布结果
   */
  async publishEvent(event: EventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event publishing is disabled', LogContext.DATABASE);
        return {
          success: false,
          error: 'Event publishing is disabled',
          responseTime: Date.now() - startTime,
        };
      }

      // 验证事件数据
      this.validateEvent(event);

      // 生成发布ID
      const publishId = uuidv4();

      // 创建发布事件
      const publishedEvent: PublishedEvent = {
        publishId,
        event,
        publishedAt: new Date(),
        status: 'pending',
        retries: 0,
        acknowledgments: [],
      };

      // 添加到队列
      if (this.config.enableQueue) {
        this.addToQueue(publishedEvent);
      }

      // 执行发布
      const result = await this.executePublish(publishedEvent);

      // 更新统计
      this.updateStats('publish', Date.now() - startTime, result.success);

      this.logger.debug(`Event published: ${publishId}`, LogContext.DATABASE);
      this.emitEvent('event_published', { publishedEvent, result });

      return result;
    } catch (error) {
      this.logger.error(`Failed to publish event: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      this.emitEvent('event_publish_failed', { error, event });

      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * @method publishEvents
   * @description 批量发布事件
   * @param events 事件列表
   * @returns {Promise<PublishResult[]>} 发布结果列表
   */
  async publishEvents(events: EventMetadata[]): Promise<PublishResult[]> {
    const startTime = Date.now();

    try {
      if (!this.config.enabled) {
        this.logger.warn('Event publishing is disabled', LogContext.DATABASE);
        return events.map(() => ({
          success: false,
          error: 'Event publishing is disabled',
          responseTime: Date.now() - startTime,
        }));
      }

      if (events.length === 0) {
        return [];
      }

      // 验证所有事件
      events.forEach(event => this.validateEvent(event));

      // 批量发布
      const results: PublishResult[] = [];
      const batchSize = this.config.batchSize!;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(event => this.publishEvent(event))
        );
        results.push(...batchResults);
      }

      // 更新统计
      this.updateStats('publish_batch', Date.now() - startTime);

      this.logger.debug(`Batch events published: ${events.length} events`, LogContext.DATABASE);
      this.emitEvent('events_published', { events, results });

      return results;
    } catch (error) {
      this.logger.error(`Failed to publish events: ${error.message}`, LogContext.DATABASE, undefined, error);
      this.updateStats('error', Date.now() - startTime);
      this.emitEvent('events_publish_failed', { error, events });

      return events.map(() => ({
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
      }));
    }
  }

  /**
   * @method subscribe
   * @description 注册事件订阅者
   * @param eventType 事件类型
   * @param subscriberId 订阅者ID
   * @param subscriberName 订阅者名称
   * @param subscriberUrl 订阅者URL
   * @param config 订阅配置
   * @returns {Promise<boolean>} 是否成功
   */
  async subscribe(
    eventType: EventType,
    subscriberId: string,
    subscriberName: string,
    subscriberUrl?: string,
    config?: Record<string, any>
  ): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        this.logger.warn('Event publishing is disabled', LogContext.DATABASE);
        return false;
      }

      const subscriptionId = `${eventType}:${subscriberId}`;

      const subscription: EventSubscription = {
        subscriptionId,
        eventType,
        subscriberId,
        subscriberName,
        subscriberUrl,
        status: 'active',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        errorCount: 0,
        config,
      };

      this.subscriptions.set(subscriptionId, subscription);
      this.stats.totalSubscriptions++;
      this.stats.activeSubscriptions++;

      this.logger.info(`Event subscription registered: ${subscriptionId}`, LogContext.DATABASE);
      this.emitEvent('subscription_registered', { subscription });

      return true;
    } catch (error) {
      this.logger.error(`Failed to register subscription: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method unsubscribe
   * @description 取消事件订阅
   * @param eventType 事件类型
   * @param subscriberId 订阅者ID
   * @returns {Promise<boolean>} 是否成功
   */
  async unsubscribe(eventType: EventType, subscriberId: string): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        return false;
      }

      const subscriptionId = `${eventType}:${subscriberId}`;
      const subscription = this.subscriptions.get(subscriptionId);

      if (subscription) {
        subscription.status = 'inactive';
        this.stats.activeSubscriptions--;

        this.logger.info(`Event subscription unregistered: ${subscriptionId}`, LogContext.DATABASE);
        this.emitEvent('subscription_unregistered', { subscription });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to unregister subscription: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method getSubscriptions
   * @description 获取订阅者列表
   * @param eventType 事件类型（可选）
   * @returns {EventSubscription[]} 订阅者列表
   */
  getSubscriptions(eventType?: EventType): EventSubscription[] {
    const subscriptions = Array.from(this.subscriptions.values());

    if (eventType) {
      return subscriptions.filter(sub => sub.eventType === eventType && sub.status === 'active');
    }

    return subscriptions.filter(sub => sub.status === 'active');
  }

  /**
   * @method acknowledgeEvent
   * @description 确认事件发布
   * @param publishId 发布ID
   * @param subscriberId 订阅者ID
   * @returns {Promise<boolean>} 是否成功
   */
  async acknowledgeEvent(publishId: string, subscriberId: string): Promise<boolean> {
    try {
      if (!this.config.enabled || !this.config.enableAck) {
        return false;
      }

      // 查找发布事件
      const publishedEvent = this.publishQueue.find(pe => pe.publishId === publishId);

      if (publishedEvent && !publishedEvent.acknowledgments.includes(subscriberId)) {
        publishedEvent.acknowledgments.push(subscriberId);

        // 检查是否所有订阅者都已确认
        const subscriptions = this.getSubscriptions(publishedEvent.event.eventType);
        if (publishedEvent.acknowledgments.length >= subscriptions.length) {
          publishedEvent.status = 'acknowledged';
          publishedEvent.acknowledgedAt = new Date();
        }

        this.logger.debug(`Event acknowledged: ${publishId} by ${subscriberId}`, LogContext.DATABASE);
        this.emitEvent('event_acknowledged', { publishId, subscriberId });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to acknowledge event: ${error.message}`, LogContext.DATABASE, undefined, error);
      return false;
    }
  }

  /**
   * @method getStats
   * @description 获取发布统计信息
   * @returns {PublisherStats} 统计信息
   */
  getStats(): PublisherStats {
    return { ...this.stats };
  }

  /**
   * @method resetStats
   * @description 重置统计信息
   */
  resetStats(): void {
    this.stats = this.initializeStats();
    this.logger.info('Event publisher stats reset', LogContext.DATABASE);
  }

  /**
   * @method getHealth
   * @description 获取服务健康状态
   * @returns {Promise<{ status: string; details: any }>} 健康状态
   */
  async getHealth(): Promise<{ status: string; details: any }> {
    try {
      if (!this.config.enabled) {
        return { status: 'disabled', details: { enabled: false } };
      }

      const queueHealth = this.publishQueue.length < this.config.queueSize!;
      const subscriptionHealth = this.stats.activeSubscriptions > 0;

      const isHealthy = queueHealth && subscriptionHealth;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          enabled: true,
          queueSize: this.publishQueue.length,
          maxQueueSize: this.config.queueSize,
          activeSubscriptions: this.stats.activeSubscriptions,
          totalSubscriptions: this.stats.totalSubscriptions,
          stats: this.getStats(),
        },
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, LogContext.DATABASE, undefined, error);
      return {
        status: 'unhealthy',
        details: {
          enabled: true,
          error: error.message,
        },
      };
    }
  }

  /**
   * @method onDestroy
   * @description 销毁时清理资源
   */
  onDestroy(): void {
    this.stopMonitoring();
    this.logger.info('EventPublisherService destroyed', LogContext.DATABASE);
  }

  // 私有方法

  /**
   * @private
   * @method validateEvent
   * @description 验证事件数据
   * @param event 事件数据
   */
  private validateEvent(event: any): void {
    if (!event.eventId) {
      throw new Error('Event eventId is required');
    }
    if (!event.eventType) {
      throw new Error('Event eventType is required');
    }
    if (!event.aggregateId) {
      throw new Error('Event aggregateId is required');
    }
    if (!event.aggregateType) {
      throw new Error('Event aggregateType is required');
    }
  }

  /**
   * @private
   * @method addToQueue
   * @description 添加到发布队列
   * @param publishedEvent 发布事件
   */
  private addToQueue(publishedEvent: PublishedEvent): void {
    if (this.publishQueue.length >= this.config.queueSize!) {
      this.logger.warn('Publish queue is full, dropping oldest event', LogContext.DATABASE);
      this.publishQueue.shift();
    }

    this.publishQueue.push(publishedEvent);
    this.stats.queueSize = this.publishQueue.length;
  }

  /**
   * @private
   * @method executePublish
   * @description 执行事件发布
   * @param publishedEvent 发布事件
   * @returns {Promise<PublishResult>} 发布结果
   */
  private async executePublish(publishedEvent: PublishedEvent): Promise<PublishResult> {
    const startTime = Date.now();
    let retries = 0;

    try {
      // 获取相关订阅者
      const subscriptions = this.getSubscriptions(publishedEvent.event.eventType);

      if (subscriptions.length === 0) {
        publishedEvent.status = 'published';
        return {
          success: true,
          publishId: publishedEvent.publishId,
          responseTime: Date.now() - startTime,
          acknowledgments: 0,
        };
      }

      // 发布到所有订阅者
      const publishPromises = subscriptions.map(subscription =>
        this.publishToSubscriber(publishedEvent, subscription)
      );

      const results = await Promise.allSettled(publishPromises);

      // 统计结果
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      if (failed === 0) {
        publishedEvent.status = 'published';
        return {
          success: true,
          publishId: publishedEvent.publishId,
          responseTime: Date.now() - startTime,
          acknowledgments: successful,
        };
      } else {
        // 处理失败情况
        return await this.handlePublishFailure(publishedEvent, retries, startTime);
      }
    } catch (error) {
      return await this.handlePublishFailure(publishedEvent, retries, startTime, error);
    }
  }

  /**
   * @private
   * @method publishToSubscriber
   * @description 发布到单个订阅者
   * @param publishedEvent 发布事件
   * @param subscription 订阅者
   * @returns {Promise<boolean>} 是否成功
   */
  private async publishToSubscriber(
    publishedEvent: PublishedEvent,
    subscription: EventSubscription
  ): Promise<boolean> {
    try {
      // 使用EventEmitter2发布事件
      this.eventEmitter.emit(`eventsourcing.${publishedEvent.event.eventType}`, {
        event: publishedEvent.event,
        subscription,
        publishId: publishedEvent.publishId,
        timestamp: new Date(),
      });

      // 更新订阅者活跃时间
      subscription.lastActiveAt = new Date();
      subscription.errorCount = 0;

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to publish to subscriber ${subscription.subscriberId}: ${error.message}`,
        LogContext.DATABASE,
        undefined,
        error
      );

      subscription.errorCount++;
      if (subscription.errorCount > 5) {
        subscription.status = 'error';
        this.stats.activeSubscriptions--;
      }

      return false;
    }
  }

  /**
   * @private
   * @method handlePublishFailure
   * @description 处理发布失败
   * @param publishedEvent 发布事件
   * @param retries 重试次数
   * @param startTime 开始时间
   * @param error 错误信息
   * @returns {Promise<PublishResult>} 发布结果
   */
  private async handlePublishFailure(
    publishedEvent: PublishedEvent,
    retries: number,
    startTime: number,
    error?: any
  ): Promise<PublishResult> {
    if (retries < this.config.retries!) {
      // 重试
      await this.delay(this.config.retryDelay!);
      retries++;
      publishedEvent.retries = retries;

      this.logger.warn(`Retrying event publish: ${publishedEvent.publishId}, attempt ${retries}`, LogContext.DATABASE);

      return await this.executePublish(publishedEvent);
    } else {
      // 达到最大重试次数
      publishedEvent.status = 'failed';
      publishedEvent.error = error?.message || 'Max retries exceeded';

      this.logger.error(`Event publish failed after ${retries} retries: ${publishedEvent.publishId}`, LogContext.DATABASE, undefined, error);

      return {
        success: false,
        publishId: publishedEvent.publishId,
        error: publishedEvent.error,
        responseTime: Date.now() - startTime,
        retries,
      };
    }
  }

  /**
   * @private
   * @method updateStats
   * @description 更新统计信息
   * @param type 统计类型
   * @param responseTime 响应时间
   * @param success 是否成功
   */
  private updateStats(type: string, responseTime: number, success?: boolean): void {
    this.stats.lastUpdated = new Date();

    if (type === 'publish' || type === 'publish_batch') {
      this.stats.totalPublished++;
      if (success) {
        this.stats.successfulPublished++;
      } else {
        this.stats.failedPublished++;
      }
    } else if (type === 'error') {
      this.stats.errorCount++;
    }

    // 更新响应时间统计
    if (responseTime > 0) {
      const totalPublishes = this.stats.successfulPublished + this.stats.failedPublished;
      this.stats.averagePublishTime =
        (this.stats.averagePublishTime * (totalPublishes - 1) + responseTime) / totalPublishes;

      if (responseTime > this.stats.maxPublishTime) {
        this.stats.maxPublishTime = responseTime;
      }

      if (responseTime < this.stats.minPublishTime || this.stats.minPublishTime === 0) {
        this.stats.minPublishTime = responseTime;
      }
    }
  }

  /**
   * @private
   * @method initializeStats
   * @description 初始化统计信息
   * @returns {PublisherStats} 初始统计信息
   */
  private initializeStats(): PublisherStats {
    return {
      totalPublished: 0,
      successfulPublished: 0,
      failedPublished: 0,
      retryCount: 0,
      averagePublishTime: 0,
      maxPublishTime: 0,
      minPublishTime: 0,
      activeSubscriptions: 0,
      totalSubscriptions: 0,
      queueSize: 0,
      errorCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * @private
   * @method emitEvent
   * @description 发送事件发布事件
   * @param type 事件类型
   * @param data 事件数据
   */
  private emitEvent(type: string, data: any): void {
    if (this.config.enableEvents) {
      try {
        this.eventEmitter.emit(`eventpublisher.${type}`, {
          type,
          data,
          timestamp: new Date(),
          serviceId: 'event-publisher-service',
        });
      } catch (error) {
        this.logger.warn(`Failed to emit event publisher event: ${type}`, LogContext.DATABASE, undefined, error);
      }
    }
  }

  /**
   * @private
   * @method startMonitoring
   * @description 开始监控
   */
  private startMonitoring(): void {
    if (this.config.monitoringInterval && this.config.monitoringInterval > 0) {
      this.monitoringTimer = setInterval(async () => {
        try {
          await this.performMonitoring();
        } catch (error) {
          this.logger.error('Event publisher monitoring failed', LogContext.DATABASE, undefined, error);
        }
      }, this.config.monitoringInterval);

      this.logger.info(`Started event publisher monitoring, interval: ${this.config.monitoringInterval}ms`, LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method stopMonitoring
   * @description 停止监控
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      this.logger.info('Stopped event publisher monitoring', LogContext.DATABASE);
    }
  }

  /**
   * @private
   * @method performMonitoring
   * @description 执行监控
   */
  private async performMonitoring(): Promise<void> {
    try {
      const health = await this.getHealth();
      this.emitEvent('monitoring', { health });

      this.logger.debug(`Event publisher monitoring: ${this.stats.totalPublished} published, ${this.stats.activeSubscriptions} active subscriptions`, LogContext.DATABASE);
    } catch (error) {
      this.logger.error('Event publisher monitoring execution failed', LogContext.DATABASE, undefined, error);
    }
  }

  /**
   * @private
   * @method delay
   * @description 延迟执行
   * @param ms 延迟时间（毫秒）
   * @returns {Promise<void>}
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
