/**
 * @file validate-token-request.dto.ts
 * @description 验证令牌请求数据传输对象
 */

export class ValidateTokenRequestDto {
  readonly accessToken: string;
  readonly tenantId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;

  constructor(data: Partial<ValidateTokenRequestDto>) {
    this.accessToken = data.accessToken || '';
    this.tenantId = data.tenantId;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
  }

  validate(): boolean {
    return !!this.accessToken;
  }

  toPlainObject(): object {
    return {
      accessToken: this.accessToken ? '[REDACTED]' : '',
      tenantId: this.tenantId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }

  getLogSafeData(): object {
    return {
      accessToken: this.accessToken ? '[REDACTED]' : '',
      tenantId: this.tenantId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
