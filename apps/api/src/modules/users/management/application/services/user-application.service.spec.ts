import { Test, TestingModule } from '@nestjs/testing';
import { UserApplicationService } from './user-application.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email';
import { Username } from '../../domain/value-objects/username';
import { Password } from '../../domain/value-objects/password';
import { UserStatus } from '../../domain/value-objects/user-status';
import { TenantId } from '../../../../tenants/management/domain/value-objects/tenant-id';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandBus } from '../bus/command-bus';
import { QueryBus } from '../bus/query-bus';

describe('UserApplicationService', () => {
  let service: UserApplicationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findByTenantId: jest.fn(),
      findActiveUsers: jest.fn(),
      findPendingActivationUsers: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
      findByEmailAndTenantId: jest.fn(),
      findByUsernameAndTenantId: jest.fn(),
    };

    const mockCommandBusInstance = {
      execute: jest.fn(),
      registerHandler: jest.fn(),
      unregisterHandler: jest.fn(),
    };

    const mockQueryBusInstance = {
      execute: jest.fn(),
      registerHandler: jest.fn(),
      unregisterHandler: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserApplicationService,
        {
          provide: 'IUserRepository',
          useValue: mockRepository,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBusInstance,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBusInstance,
        },
      ],
    }).compile();

    service = module.get<UserApplicationService>(UserApplicationService);
    mockUserRepository = module.get('IUserRepository');
    mockCommandBus = module.get(CommandBus);
    mockQueryBus = module.get(QueryBus);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongP@ss1A2',
        name: 'Test User',
        nickname: 'Test',
        phone: '1234567890',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const expectedResult = {
        id: 'user-id',
        email: createUserDto.email,
        username: createUserDto.username,
        name: createUserDto.name,
        nickname: createUserDto.nickname,
        phone: createUserDto.phone,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
        status: 'PENDING_ACTIVATION',
        tenantId: createUserDto.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.username).toBe(createUserDto.username);
      expect(result.name).toBe(createUserDto.name);
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'StrongP@ss1A2',
        name: 'Test User',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const existingUser = User.create(
        Email.create('existing@example.com'),
        Username.create('existinguser'),
        Password.create('StrongP@ss1A2'),
        'Existing User',
        '',
        TenantId.create('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'existinguser',
        password: 'StrongP@ss1A2',
        name: 'Test User',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const existingUser = User.create(
        Email.create('existing@example.com'),
        Username.create('existinguser'),
        Password.create('StrongP@ss1A2'),
        'Existing User',
        '',
        TenantId.create('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = User.create(
        Email.create('test@example.com'),
        Username.create('testuser'),
        Password.create('StrongP@ss1A2'),
        'Test User',
        '',
        TenantId.create('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await service.getUser(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isEmailExists', () => {
    it('should return true when email exists', async () => {
      // Arrange
      const email = 'test@example.com';
      const user = User.create(
        Email.create(email),
        Username.create('testuser'),
        Password.create('StrongP@ss1A2'),
        'Test User',
        '',
        TenantId.create('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.isEmailExists(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.isEmailExists(email);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isUsernameExists', () => {
    it('should return true when username exists', async () => {
      // Arrange
      const username = 'testuser';
      const user = User.create(
        Email.create('test@example.com'),
        Username.create(username),
        Password.create('StrongP@ss1A2'),
        'Test User',
        '',
        TenantId.create('550e8400-e29b-41d4-a716-446655440000'),
      );

      mockUserRepository.findByUsername.mockResolvedValue(user);

      // Act
      const result = await service.isUsernameExists(username);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      // Arrange
      const username = 'nonexistentuser';
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act
      const result = await service.isUsernameExists(username);

      // Assert
      expect(result).toBe(false);
    });
  });
});
