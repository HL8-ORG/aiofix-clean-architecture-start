/**
 * @file refresh-token-response.dto.ts
 * @description 刷新令牌响应数据传输对象
 */

export interface TokenInfo {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: string;
  readonly issuedAt: Date;
}

export class RefreshTokenResponseDto {
  readonly success: boolean;
  readonly tokens: TokenInfo;
  readonly message?: string;
  readonly timestamp: Date;

  constructor(data: Partial<RefreshTokenResponseDto>) {
    this.success = data.success || false;
    this.tokens = data.tokens || {
      accessToken: '',
      refreshToken: '',
      expiresIn: 0,
      tokenType: 'Bearer',
      issuedAt: new Date(),
    };
    this.message = data.message;
    this.timestamp = data.timestamp || new Date();
  }

  validate(): boolean {
    return this.success && !!this.tokens.accessToken && !!this.tokens.refreshToken;
  }

  toPlainObject(): object {
    return {
      success: this.success,
      tokens: this.tokens,
      message: this.message,
      timestamp: this.timestamp,
    };
  }

  getLogSafeData(): object {
    return {
      success: this.success,
      tokens: {
        ...this.tokens,
        accessToken: this.tokens.accessToken ? '[REDACTED]' : '',
        refreshToken: this.tokens.refreshToken ? '[REDACTED]' : '',
      },
      message: this.message,
      timestamp: this.timestamp,
    };
  }

  isTokenExpired(): boolean {
    const now = new Date();
    const expirationTime = new Date(this.tokens.issuedAt.getTime() + this.tokens.expiresIn * 1000);
    return now > expirationTime;
  }

  getRemainingTime(): number {
    const now = new Date();
    const expirationTime = new Date(this.tokens.issuedAt.getTime() + this.tokens.expiresIn * 1000);
    return Math.max(0, expirationTime.getTime() - now.getTime());
  }
}
