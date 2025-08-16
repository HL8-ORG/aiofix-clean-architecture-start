import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 修改密码DTO
 * 用于用户修改密码时的数据传输
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: '原密码至少8个字符' })
  @MaxLength(20, { message: '原密码最多20个字符' })
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: '新密码至少8个字符' })
  @MaxLength(20, { message: '新密码最多20个字符' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, { message: '新密码必须包含字母和数字' })
  newPassword: string;
}
