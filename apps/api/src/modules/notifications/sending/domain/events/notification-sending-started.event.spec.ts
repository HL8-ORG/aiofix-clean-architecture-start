import { NotificationSendingStartedEvent } from './notification-sending-started.event';
import { NotificationSender } from '../entities/notification-sender.entity';
import { SenderId } from '../value-objects/sender-id';
import { SenderName } from '../entities/notification-sender.entity';
import { SenderType, SenderTypeEnum } from '../value-objects/sender-type';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';

describe('NotificationSendingStartedEvent', () => {
  let mockSender: NotificationSender;
  let mockUserId: UserId;
  let mockSenderId: SenderId;

  beforeEach(() => {
    mockUserId = new UserId('123e4567-e89b-42d3-a456-426614174000');
    mockSenderId = new SenderId('987fcdeb-51a2-42d1-b789-123456789abc');

    mockSender = new NotificationSender(
      mockSenderId,
      new SenderName('Test Email Sender'),
      new SenderType(SenderTypeEnum.EMAIL),
      mockUserId,
      undefined,
      undefined,
      { description: 'Test sender for unit tests' }
    );
  });

  describe('constructor', () => {
    it('should create a valid NotificationSendingStartedEvent', () => {
      const notificationId = 'notification-123';
      const recipientId = 'user-456';
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const metadata = { priority: 'high', channel: 'email' };

      const event = new NotificationSendingStartedEvent(
        mockSender,
        notificationId,
        recipientId,
        startedAt,
        metadata
      );

      expect(event.sender).toBe(mockSender);
      expect(event.notificationId).toBe(notificationId);
      expect(event.recipientId).toBe(recipientId);
      expect(event.startedAt).toBe(startedAt);
      expect(event.metadata).toEqual(metadata);
    });

    it('should create event with default empty metadata', () => {
      const event = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date()
      );

      expect(event.metadata).toEqual({});
    });
  });

  describe('event data', () => {
    it('should contain correct event data', () => {
      const notificationId = 'notification-123';
      const recipientId = 'user-456';
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const metadata = { priority: 'high' };

      const event = new NotificationSendingStartedEvent(
        mockSender,
        notificationId,
        recipientId,
        startedAt,
        metadata
      );

      const eventData = event.eventData;

      expect(eventData).toEqual({
        senderId: mockSender.id.value,
        senderName: mockSender.name.value,
        senderType: mockSender.type.value,
        notificationId: notificationId,
        recipientId: recipientId,
        startedAt: startedAt.toISOString(),
        metadata: metadata
      });
    });

    it('should have correct aggregate ID', () => {
      const event = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date()
      );

      expect(event.aggregateId).toBe(mockSender.id.value);
    });

    it('should have correct event type', () => {
      const event = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date()
      );

      expect(event.eventType).toBe('NotificationSendingStarted');
    });
  });

  describe('getAggregateType', () => {
    it('should return correct aggregate type', () => {
      const event = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date()
      );

      // 使用反射访问受保护的方法
      const aggregateType = (event as any).getAggregateType();
      expect(aggregateType).toBe('NotificationSender');
    });
  });

  describe('createCopyWithMetadata', () => {
    it('should create copy with new metadata', () => {
      const originalEvent = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date('2024-01-01T10:00:00Z'),
        { original: 'metadata' }
      );

      const newMetadata = { new: 'metadata' };
      const copiedEvent = originalEvent.createCopyWithMetadata(newMetadata);

      expect(copiedEvent).toBeInstanceOf(NotificationSendingStartedEvent);
      expect(copiedEvent.eventData.metadata).toEqual(newMetadata);
      expect(copiedEvent.sender).toBe(originalEvent.sender);
      expect(copiedEvent.notificationId).toBe(originalEvent.notificationId);
      expect(copiedEvent.recipientId).toBe(originalEvent.recipientId);
      expect(copiedEvent.startedAt).toBe(originalEvent.startedAt);
    });
  });

  describe('createCopyWithOptions', () => {
    it('should create copy with options', () => {
      const originalEvent = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date('2024-01-01T10:00:00Z'),
        { original: 'metadata' }
      );

      const options = {
        metadata: { new: 'metadata' },
        correlationId: 'correlation-123',
        causationId: 'causation-456'
      };

      const copiedEvent = originalEvent.createCopyWithOptions(options);

      expect(copiedEvent).toBeInstanceOf(NotificationSendingStartedEvent);
      expect(copiedEvent.eventData.metadata).toEqual(options.metadata);
    });

    it('should create copy with existing metadata when no new metadata provided', () => {
      const originalEvent = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date('2024-01-01T10:00:00Z'),
        { original: 'metadata' }
      );

      const options = {
        correlationId: 'correlation-123',
        causationId: 'causation-456'
      };

      const copiedEvent = originalEvent.createCopyWithOptions(options);

      expect(copiedEvent).toBeInstanceOf(NotificationSendingStartedEvent);
      expect(copiedEvent.eventData.metadata).toEqual({ original: 'metadata' });
    });
  });

  describe('event serialization', () => {
    it('should serialize event data correctly', () => {
      const notificationId = 'notification-123';
      const recipientId = 'user-456';
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const metadata = { priority: 'high', channel: 'email' };

      const event = new NotificationSendingStartedEvent(
        mockSender,
        notificationId,
        recipientId,
        startedAt,
        metadata
      );

      const serializedData = event.eventData;

      expect(serializedData.senderId).toBe(mockSender.id.value);
      expect(serializedData.senderName).toBe(mockSender.name.value);
      expect(serializedData.senderType).toBe(SenderTypeEnum.EMAIL);
      expect(serializedData.notificationId).toBe(notificationId);
      expect(serializedData.recipientId).toBe(recipientId);
      expect(serializedData.startedAt).toBe(startedAt.toISOString());
      expect(serializedData.metadata).toEqual(metadata);
    });
  });

  describe('event immutability', () => {
    it('should have readonly properties', () => {
      const event = new NotificationSendingStartedEvent(
        mockSender,
        'notification-123',
        'user-456',
        new Date()
      );

      // 验证事件属性是只读的（TypeScript编译时检查）
      expect(event.notificationId).toBe('notification-123');
      expect(event.recipientId).toBe('user-456');
      expect(event.startedAt).toBeInstanceOf(Date);
    });
  });
});
