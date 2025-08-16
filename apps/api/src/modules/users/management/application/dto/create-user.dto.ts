import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 创建用户DTO
 * 用于创建用户时的数据传输
 */
export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @IsString()
  @MinLength(2, { message: '姓名至少2个字符' })
  @MaxLength(20, { message: '姓名最多20个字符' })
  name: string;

  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(20, { message: '密码最多20个字符' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { message: '密码必须包含字母和数字' })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '个人简介最多200个字符' })
  bio?: string;

  @IsString()
  tenantId: string;
}
