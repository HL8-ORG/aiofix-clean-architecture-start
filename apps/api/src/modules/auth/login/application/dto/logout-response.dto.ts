/**
 * @file logout-response.dto.ts
 * @description 登出响应数据传输对象
 */

export class LogoutResponseDto {
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: Date;

  constructor(data: Partial<LogoutResponseDto>) {
    this.success = data.success || false;
    this.message = data.message || '';
    this.timestamp = data.timestamp || new Date();
  }
}
