/**
 * @file logout-request.dto.ts
 * @description 登出请求数据传输对象
 */

export class LogoutRequestDto {
  readonly userId: string;
  readonly sessionId?: string;
  readonly globalLogout?: boolean;
  readonly ipAddress?: string;
  readonly userAgent?: string;

  constructor(data: Partial<LogoutRequestDto>) {
    this.userId = data.userId || '';
    this.sessionId = data.sessionId;
    this.globalLogout = data.globalLogout || false;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
  }

  validate(): boolean {
    return !!this.userId;
  }
}
