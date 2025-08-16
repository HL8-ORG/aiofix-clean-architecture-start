/**
 * @file get-login-history-request.dto.ts
 * @description 获取登录历史请求数据传输对象
 */

export class GetLoginHistoryRequestDto {
  readonly userId: string;
  readonly tenantId?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly status?: 'success' | 'failed' | 'all';
  readonly limit?: number;
  readonly offset?: number;
  readonly ipAddress?: string;
  readonly userAgent?: string;

  constructor(data: Partial<GetLoginHistoryRequestDto>) {
    this.userId = data.userId || '';
    this.tenantId = data.tenantId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.status = data.status || 'all';
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
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
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
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      limit: this.limit,
      offset: this.offset,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
