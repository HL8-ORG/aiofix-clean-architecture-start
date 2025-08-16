/**
 * @file get-user-sessions-request.dto.ts
 * @description 获取用户会话请求数据传输对象
 */

export class GetUserSessionsRequestDto {
  readonly userId: string;
  readonly tenantId?: string;
  readonly activeOnly?: boolean;
  readonly limit?: number;
  readonly offset?: number;
  readonly ipAddress?: string;
  readonly userAgent?: string;

  constructor(data: Partial<GetUserSessionsRequestDto>) {
    this.userId = data.userId || '';
    this.tenantId = data.tenantId;
    this.activeOnly = data.activeOnly || false;
    this.limit = data.limit || 20;
    this.offset = data.offset || 0;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
  }

  validate(): boolean {
    return !!this.userId && this.limit! > 0 && this.offset! >= 0;
  }

  toPlainObject(): object {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      activeOnly: this.activeOnly,
      limit: this.limit,
      offset: this.offset,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }

  getLogSafeData(): object {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      activeOnly: this.activeOnly,
      limit: this.limit,
      offset: this.offset,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
