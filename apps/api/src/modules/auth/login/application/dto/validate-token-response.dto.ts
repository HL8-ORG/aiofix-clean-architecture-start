/**
 * @file validate-token-response.dto.ts
 * @description 验证令牌响应数据传输对象
 */

export interface UserInfo {
  readonly userId: string;
  readonly username: string;
  readonly email: string;
  readonly tenantId: string;
  readonly roles: string[];
  readonly permissions: string[];
}

export class ValidateTokenResponseDto {
  readonly valid: boolean;
  readonly user?: UserInfo;
  readonly tokenInfo?: {
    readonly issuedAt: Date;
    readonly expiresAt: Date;
    readonly remainingTime: number;
  };
  readonly message?: string;
  readonly timestamp: Date;

  constructor(data: Partial<ValidateTokenResponseDto>) {
    this.valid = data.valid || false;
    this.user = data.user;
    this.tokenInfo = data.tokenInfo;
    this.message = data.message;
    this.timestamp = data.timestamp || new Date();
  }

  validate(): boolean {
    return typeof this.valid === 'boolean';
  }

  toPlainObject(): object {
    return {
      valid: this.valid,
      user: this.user,
      tokenInfo: this.tokenInfo,
      message: this.message,
      timestamp: this.timestamp,
    };
  }

  getLogSafeData(): object {
    return {
      valid: this.valid,
      user: this.user ? {
        ...this.user,
        email: this.user.email ? '[REDACTED]' : '',
      } : undefined,
      tokenInfo: this.tokenInfo,
      message: this.message,
      timestamp: this.timestamp,
    };
  }

  isTokenExpired(): boolean {
    if (!this.tokenInfo) return true;
    return new Date() > this.tokenInfo.expiresAt;
  }

  getRemainingTime(): number {
    return this.tokenInfo?.remainingTime || 0;
  }
}
