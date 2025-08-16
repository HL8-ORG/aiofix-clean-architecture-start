import { SenderId } from './sender-id';

describe('SenderId', () => {
  describe('constructor', () => {
    it('should create a valid SenderId with UUID v4 format', () => {
      const validUuid = '123e4567-e89b-42d3-a456-426614174000';
      const senderId = new SenderId(validUuid);

      expect(senderId.value).toBe(validUuid);
    });

    it('should throw error for empty string', () => {
      expect(() => new SenderId('')).toThrow();
    });

    it('should throw error for whitespace only string', () => {
      expect(() => new SenderId('   ')).toThrow();
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => new SenderId('invalid-uuid')).toThrow();
    });

    it('should throw error for non-UUID v4 format', () => {
      // UUID v1 format (version 1)
      expect(() => new SenderId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toThrow();
    });
  });

  describe('toString', () => {
    it('should return the UUID string value', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const senderId = new SenderId(uuid);

      expect(senderId.toString()).toBe(uuid);
    });
  });

  describe('equals', () => {
    it('should return true for same UUID values', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const senderId1 = new SenderId(uuid);
      const senderId2 = new SenderId(uuid);

      expect(senderId1.equals(senderId2)).toBe(true);
    });

    it('should return false for different UUID values', () => {
      const senderId1 = new SenderId('123e4567-e89b-42d3-a456-426614174000');
      const senderId2 = new SenderId('987fcdeb-51a2-42d1-b789-123456789abc');

      expect(senderId1.equals(senderId2)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const senderId = new SenderId('123e4567-e89b-42d3-a456-426614174000');

      expect(senderId.equals(null as any)).toBe(false);
      expect(senderId.equals(undefined as any)).toBe(false);
    });
  });

  describe('UUID v4 validation', () => {
    it('should accept valid UUID v4 with version 4', () => {
      const validUuidV4 = '123e4567-e89b-42d3-a456-426614174000';
      expect(() => new SenderId(validUuidV4)).not.toThrow();
    });

    it('should accept valid UUID v4 with version 4 and variant 8', () => {
      const validUuidV4Variant8 = '123e4567-e89b-42d3-8123-426614174000';
      expect(() => new SenderId(validUuidV4Variant8)).not.toThrow();
    });

    it('should accept valid UUID v4 with version 4 and variant 9', () => {
      const validUuidV4Variant9 = '123e4567-e89b-42d3-9123-426614174000';
      expect(() => new SenderId(validUuidV4Variant9)).not.toThrow();
    });

    it('should accept valid UUID v4 with version 4 and variant a', () => {
      const validUuidV4Varianta = '123e4567-e89b-42d3-a123-426614174000';
      expect(() => new SenderId(validUuidV4Varianta)).not.toThrow();
    });

    it('should accept valid UUID v4 with version 4 and variant b', () => {
      const validUuidV4Variantb = '123e4567-e89b-42d3-b123-426614174000';
      expect(() => new SenderId(validUuidV4Variantb)).not.toThrow();
    });

    it('should reject UUID v4 with invalid version', () => {
      const invalidVersion = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => new SenderId(invalidVersion)).toThrow();
    });

    it('should reject UUID v4 with invalid variant', () => {
      const invalidVariant = '123e4567-e89b-42d3-c123-426614174000';
      expect(() => new SenderId(invalidVariant)).toThrow();
    });
  });
});
