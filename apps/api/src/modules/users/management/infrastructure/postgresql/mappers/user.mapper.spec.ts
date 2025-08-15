import { Test, TestingModule } from '@nestjs/testing';
import { UserMapper } from './user.mapper';
import { User } from '../../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Username } from '../../../domain/value-objects/username';
import { Password } from '../../../domain/value-objects/password';
import { UserStatus } from '../../../domain/value-objects/user-status';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper]
    }).compile();

    mapper = module.get<UserMapper>(UserMapper);
  });

  describe('toEntity', () => {
    it('should convert domain user to entity', () => {
      // Arrange
      const email = Email.create('test@example.com');
      const username = Username.create('testuser');
      const password = Password.create('Str0ngP@ss!');
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');

      const user = User.create(
        email,
        username,
        password,
        'John',
        'Doe',
        tenantId,
        'org-123',
        'Johnny',
        '1234567890'
      );

      // Mock getSnapshotData method
      jest.spyOn(user, 'getSnapshotData').mockReturnValue({
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: email.value,
        username: username.value,
        passwordHash: password.value,
        firstName: 'John',
        lastName: 'Doe',
        nickname: 'Johnny',
        phoneNumber: '1234567890',
        avatar: 'avatar.jpg',
        bio: 'Test bio',
        status: UserStatus.ACTIVE.value,
        tenantId: tenantId.value,
        primaryOrganizationId: 'org-123',
        organizations: ['org-123'],
        roles: ['user'],
        lastLoginAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1
      });

      // Act
      const entity = mapper.toEntity(user);

      // Assert
      expect(entity).toBeInstanceOf(UserEntity);
      expect(entity.id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(entity.email).toBe('test@example.com');
      expect(entity.username).toBe('testuser');
      expect(entity.passwordHash).toBe(password.value);
      expect(entity.firstName).toBe('John');
      expect(entity.lastName).toBe('Doe');
      expect(entity.nickname).toBe('Johnny');
      expect(entity.phoneNumber).toBe('1234567890');
      expect(entity.avatar).toBe('avatar.jpg');
      expect(entity.bio).toBe('Test bio');
      expect(entity.status).toBe(UserStatus.ACTIVE.value);
      expect(entity.tenantId).toBe(tenantId.value);
      expect(entity.primaryOrganizationId).toBe('org-123');
      expect(entity.organizations).toEqual(['org-123']);
      expect(entity.roles).toEqual(['user']);
      expect(entity.version).toBe(1);
    });
  });

  describe('toDomain', () => {
    it('should convert entity to domain user', () => {
      // Arrange
      const entity = new UserEntity();
      entity.id = '123e4567-e89b-12d3-a456-426614174001';
      entity.email = 'test@example.com';
      entity.username = 'testuser';
      entity.passwordHash = 'hashedpassword';
      entity.firstName = 'John';
      entity.lastName = 'Doe';
      entity.nickname = 'Johnny';
      entity.phoneNumber = '1234567890';
      entity.avatar = 'avatar.jpg';
      entity.bio = 'Test bio';
      entity.status = UserStatus.ACTIVE.value;
      entity.tenantId = '123e4567-e89b-12d3-a456-426614174000';
      entity.primaryOrganizationId = 'org-123';
      entity.organizations = ['org-123'];
      entity.roles = ['user'];
      entity.lastLoginAt = new Date('2024-01-01');
      entity.createdAt = new Date('2024-01-01');
      entity.updatedAt = new Date('2024-01-01');
      entity.version = 1;

      // Act
      const user = mapper.toDomain(entity);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.id.value).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(user.email.value).toBe('test@example.com');
      expect(user.username.value).toBe('testuser');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.nickname).toBe('Johnny');
      expect(user.phoneNumber).toBe('1234567890');
      expect(user.avatar).toBe('avatar.jpg');
      expect(user.bio).toBe('Test bio');
      expect(user.status.value).toBe(UserStatus.ACTIVE.value);
      expect(user.tenantId.value).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(user.primaryOrganizationId).toBe('org-123');
    });
  });

  describe('toDomainList', () => {
    it('should convert entity list to domain user list', () => {
      // Arrange
      const entity1 = new UserEntity();
      entity1.id = '123e4567-e89b-12d3-a456-426614174002';
      entity1.email = 'user1@example.com';
      entity1.username = 'user1';
      entity1.passwordHash = 'hashedpassword1';
      entity1.firstName = 'John';
      entity1.lastName = 'Doe';
      entity1.status = UserStatus.ACTIVE.value;
      entity1.tenantId = '123e4567-e89b-12d3-a456-426614174000';
      entity1.createdAt = new Date('2024-01-01');
      entity1.updatedAt = new Date('2024-01-01');

      const entity2 = new UserEntity();
      entity2.id = '123e4567-e89b-12d3-a456-426614174003';
      entity2.email = 'user2@example.com';
      entity2.username = 'user2';
      entity2.passwordHash = 'hashedpassword2';
      entity2.firstName = 'Jane';
      entity2.lastName = 'Smith';
      entity2.status = UserStatus.ACTIVE.value;
      entity2.tenantId = '123e4567-e89b-12d3-a456-426614174000';
      entity2.createdAt = new Date('2024-01-01');
      entity2.updatedAt = new Date('2024-01-01');

      const entities = [entity1, entity2];

      // Act
      const users = mapper.toDomainList(entities);

      // Assert
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[1]).toBeInstanceOf(User);
      expect(users[0].id.value).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(users[1].id.value).toBe('123e4567-e89b-12d3-a456-426614174003');
    });
  });

  describe('toEntityList', () => {
    it('should convert domain user list to entity list', () => {
      // Arrange
      const email1 = Email.create('user1@example.com');
      const username1 = Username.create('user1');
      const password1 = Password.create('StrongP@ss1A2');
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');

      const user1 = User.create(email1, username1, password1, 'John', 'Doe', tenantId);
      const user2 = User.create(
        Email.create('user2@example.com'),
        Username.create('user2'),
        Password.create('StrongP@ss4B5'),
        'Jane',
        'Smith',
        tenantId
      );

      // Mock getSnapshotData method
      jest.spyOn(user1, 'getSnapshotData').mockReturnValue({
        id: '123e4567-e89b-12d3-a456-426614174002',
        email: email1.value,
        username: username1.value,
        passwordHash: password1.value,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE.value,
        tenantId: tenantId.value,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1
      });

      jest.spyOn(user2, 'getSnapshotData').mockReturnValue({
        id: '123e4567-e89b-12d3-a456-426614174003',
        email: 'user2@example.com',
        username: 'user2',
        passwordHash: 'hashedpassword2',
        firstName: 'Jane',
        lastName: 'Smith',
        status: UserStatus.ACTIVE.value,
        tenantId: tenantId.value,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1
      });

      const users = [user1, user2];

      // Act
      const entities = mapper.toEntityList(users);

      // Assert
      expect(entities).toHaveLength(2);
      expect(entities[0]).toBeInstanceOf(UserEntity);
      expect(entities[1]).toBeInstanceOf(UserEntity);
      expect(entities[0].id).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(entities[1].id).toBe('123e4567-e89b-12d3-a456-426614174003');
    });
  });

  describe('updateEntity', () => {
    it('should update entity with domain user data', () => {
      // Arrange
      const existingEntity = new UserEntity();
      existingEntity.id = '123e4567-e89b-12d3-a456-426614174004';
      existingEntity.version = 1;

      const email = Email.create('updated@example.com');
      const username = Username.create('updateduser');
      const password = Password.create('NewStrongP@ss7C8');
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');

      const user = User.create(email, username, password, 'Updated', 'Name', tenantId);

      // Mock getSnapshotData method
      jest.spyOn(user, 'getSnapshotData').mockReturnValue({
        id: '123e4567-e89b-12d3-a456-426614174004',
        email: email.value,
        username: username.value,
        passwordHash: password.value,
        firstName: 'Updated',
        lastName: 'Name',
        status: UserStatus.ACTIVE.value,
        tenantId: tenantId.value,
        updatedAt: new Date('2024-01-02'),
        version: 2
      });

      // Act
      const updatedEntity = mapper.updateEntity(existingEntity, user);

      // Assert
      expect(updatedEntity.id).toBe('123e4567-e89b-12d3-a456-426614174004');
      expect(updatedEntity.email).toBe('updated@example.com');
      expect(updatedEntity.username).toBe('updateduser');
      expect(updatedEntity.firstName).toBe('Updated');
      expect(updatedEntity.lastName).toBe('Name');
      expect(updatedEntity.version).toBe(2);
    });
  });

  describe('validateEntity', () => {
    it('should return true for valid entity', () => {
      // Arrange
      const entity = new UserEntity();
      entity.id = '123e4567-e89b-12d3-a456-426614174005';
      entity.email = 'test@example.com';
      entity.username = 'testuser';
      entity.passwordHash = 'hashedpassword';
      entity.firstName = 'John';
      entity.lastName = 'Doe';
      entity.status = UserStatus.ACTIVE.value;
      entity.tenantId = '123e4567-e89b-12d3-a456-426614174000';
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      // Act
      const isValid = mapper.validateEntity(entity);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false for invalid entity', () => {
      // Arrange
      const entity = new UserEntity();
      // Missing required fields

      // Act
      const isValid = mapper.validateEntity(entity);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('validateDomain', () => {
    it('should return true for valid domain user', () => {
      // Arrange
      const email = Email.create('test@example.com');
      const username = Username.create('testuser');
      const password = Password.create('StrongP@ss1A2');
      const tenantId = new TenantId('123e4567-e89b-12d3-a456-426614174000');

      const user = User.create(email, username, password, 'John', 'Doe', tenantId);

      // Act
      const isValid = mapper.validateDomain(user);

      // Assert
      expect(isValid).toBe(true);
    });
  });
});
