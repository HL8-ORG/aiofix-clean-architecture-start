import { IsString, IsEmail, IsOptional, IsDate } from 'class-validator';

/**
 * 用户DTO
 * 用于用户信息的传输
 */
export class UserDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsString()
  status: string;

  @IsString()
  tenantId: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
