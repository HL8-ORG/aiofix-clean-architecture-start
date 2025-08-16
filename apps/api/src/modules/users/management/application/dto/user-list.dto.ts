import { IsArray, IsNumber, IsString, IsOptional } from 'class-validator';
import { UserDto } from './user.dto';

/**
 * 用户列表DTO
 * 用于用户列表查询结果的传输
 */
export class UserListDto {
  @IsArray()
  users: UserDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;

  @IsOptional()
  @IsString()
  search?: string;

  constructor(partial: Partial<UserListDto>) {
    Object.assign(this, partial);
  }
}
