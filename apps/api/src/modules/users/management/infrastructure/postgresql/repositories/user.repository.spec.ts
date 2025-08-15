import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { UserRepository } from './user.repository';
import { User } from '../../../domain/entities/user.entity';
import { UserId } from '../../../domain/value-objects/user-id';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { Password } from '../../../domain/value-objects/password';
import { UserStatus } from '../../../domain/value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

describe('UserRepository', () => {
  let repository: UserRepository;
  let entityManager: EntityManager;

  const mockEntityManager = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    persistAndFlush: jest.fn(),
    nativeDelete: jest.fn()
  };

  const mockUserMapper = {
    toEntity: jest.fn(),
    toDomain: jest.fn(),
    toDomainList: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager
        },
        {
          provide: UserMapper,
          useValue: mockUserMapper
        }
      ]
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save user successfully', async () => {
      // Arrange
      const email = new Email('test@example.com');
      const username = new Username('testuser');
      const password = new Password('StrongP@ss1A2');
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');

      const user = User.create(
        email,
        username,
        password,
        'John',
        'Doe',
        tenantId,
        undefined,
        'Johnny',
        '1234567890'
      );

      // 模拟事件溯源方法
      (user as any).getUncommittedEvents = jest.fn().mockReturnValue([]);
      (user as any).markEventsAsCommitted = jest.fn().mockImplementation(() => {});

      const mockEntity = new UserEntity();
      mockUserMapper.toEntity.mockReturnValue(mockEntity);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      // Act
      const result = await repository.save(user);

      // Assert
      expect(mockUserMapper.toEntity).toHaveBeenCalledWith(user);
      expect(mockEntityManager.persistAndFlush).toHaveBeenCalledWith(mockEntity);
      expect(result).toBe(user);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      const userId = new UserId('123e4567-e89b-12d3-a456-426614174000');
      const mockUserEntity = new UserEntity();
      const mockUser = User.create(
        new Email('test@example.com'),
        new Username('testuser'),
        new Password('hashedpassword', true),
        'John',
        'Doe',
        new TenantId('123e4567-e89b-12d3-a456-426614174000')
      );

      mockEntityManager.findOne.mockResolvedValue(mockUserEntity);
      mockUserMapper.toDomain.mockReturnValue(mockUser);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, { id: userId.value });
      expect(mockUserMapper.toDomain).toHaveBeenCalledWith(mockUserEntity);
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = new UserId('123e4567-e89b-12d3-a456-426614174000');
      mockEntityManager.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = new Email('test@example.com');
      const mockUserEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: email.value,
        username: 'testuser',
        passwordHash: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE.value,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        toDomain: jest.fn().mockReturnValue({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: email.value,
          username: 'testuser',
          passwordHash: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE.value,
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      mockEntityManager.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, { email: email.value });
      expect(result).toBeDefined();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      // Arrange
      const username = new Username('testuser');
      const mockUserEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: username.value,
        passwordHash: 'hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE.value,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        toDomain: jest.fn().mockReturnValue({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          username: username.value,
          passwordHash: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE.value,
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      mockEntityManager.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findByUsername(username);

      // Assert
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(UserEntity, { username: username.value });
      expect(result).toBeDefined();
    });
  });

  describe('findByTenantId', () => {
    it('should find users by tenant id', async () => {
      // Arrange
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');
      const mockUserEntities = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test1@example.com',
          username: 'testuser1',
          passwordHash: 'hashedpassword1',
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE.value,
          tenantId: tenantId.value,
          createdAt: new Date(),
          updatedAt: new Date(),
          toDomain: jest.fn().mockReturnValue({
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test1@example.com',
            username: 'testuser1',
            passwordHash: 'hashedpassword1',
            firstName: 'John',
            lastName: 'Doe',
            status: UserStatus.ACTIVE.value,
            tenantId: tenantId.value,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      ];

      mockEntityManager.find.mockResolvedValue(mockUserEntities);
      mockUserMapper.toDomainList.mockReturnValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test1@example.com',
          username: 'testuser1',
          passwordHash: 'hashedpassword1',
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE.value,
          tenantId: tenantId.value,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      // Act
      const result = await repository.findByTenantId(tenantId);

      // Assert
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        UserEntity,
        { tenantId: tenantId.value },
        { limit: undefined, offset: undefined, orderBy: { createdAt: 'DESC' } }
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      // Arrange
      const email = new Email('test@example.com');
      mockEntityManager.count.mockResolvedValue(1);

      // Act
      const result = await repository.existsByEmail(email);

      // Assert
      expect(mockEntityManager.count).toHaveBeenCalledWith(UserEntity, { email: email.value });
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      // Arrange
      const email = new Email('test@example.com');
      mockEntityManager.count.mockResolvedValue(0);

      // Act
      const result = await repository.existsByEmail(email);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('existsByUsername', () => {
    it('should return true when username exists', async () => {
      // Arrange
      const username = new Username('testuser');
      mockEntityManager.count.mockResolvedValue(1);

      // Act
      const result = await repository.existsByUsername(username);

      // Assert
      expect(mockEntityManager.count).toHaveBeenCalledWith(UserEntity, { username: username.value });
      expect(result).toBe(true);
    });
  });

  describe('countByTenantId', () => {
    it('should count users by tenant id', async () => {
      // Arrange
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');
      mockEntityManager.count.mockResolvedValue(5);

      // Act
      const result = await repository.countByTenantId(tenantId);

      // Assert
      expect(mockEntityManager.count).toHaveBeenCalledWith(UserEntity, { tenantId: tenantId.value });
      expect(result).toBe(5);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics', async () => {
      // Arrange
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');
      mockEntityManager.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7)  // active
        .mockResolvedValueOnce(2)  // inactive
        .mockResolvedValueOnce(1); // pending

      // Act
      const result = await repository.getUserStats(tenantId);

      // Assert
      expect(result).toEqual({
        total: 10,
        active: 7,
        inactive: 2,
        pending: 1,
        activeRate: 70
      });
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      // Arrange
      const userId = new UserId('123e4567-e89b-12d3-a456-426614174000');
      mockEntityManager.nativeDelete.mockResolvedValue(undefined);

      // Act
      await repository.delete(userId);

      // Assert
      expect(mockEntityManager.nativeDelete).toHaveBeenCalledWith(UserEntity, { id: userId.value });
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValue({});

      // Act
      const result = await repository.healthCheck();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when database is not healthy', async () => {
      // Arrange
      mockEntityManager.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await repository.healthCheck();

      // Assert
      expect(result).toBe(false);
    });
  });
});
