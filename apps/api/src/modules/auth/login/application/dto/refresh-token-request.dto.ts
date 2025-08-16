/**
 * @file refresh-token-request.dto.ts
 * @description 刷新令牌请求数据传输对象
 */

export class RefreshTokenRequestDto {
  readonly refreshToken: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;

  constructor(data: Partial<RefreshTokenRequestDto>) {
    this.refreshToken = data.refreshToken || '';
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
  }

  validate(): boolean {
    return !!this.refreshToken;
  }
}
