/**
 * @file get-login-history-response.dto.ts
 * @description 获取登录历史响应数据传输对象
 */

export interface LoginHistoryEntry {
  readonly id: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly loginTime: Date;
  readonly logoutTime?: Date;
  readonly status: 'success' | 'failed';
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceInfo?: {
    readonly deviceType: string;
    readonly browser: string;
    readonly os: string;
  };
  readonly location?: {
    readonly country?: string;
    readonly city?: string;
    readonly timezone?: string;
  };
  readonly failureReason?: string;
  readonly sessionDuration?: number; // in seconds
}

export class GetLoginHistoryResponseDto {
  readonly success: boolean;
  readonly history: LoginHistoryEntry[];
  readonly totalCount: number;
  readonly successCount: number;
  readonly failedCount: number;
  readonly pagination: {
    readonly limit: number;
    readonly offset: number;
    readonly hasMore: boolean;
  };
  readonly statistics: {
    readonly totalLogins: number;
    readonly successfulLogins: number;
    readonly failedLogins: number;
    readonly averageSessionDuration: number;
    readonly lastLoginTime?: Date;
  };
  readonly timestamp: Date;

  constructor(data: Partial<GetLoginHistoryResponseDto>) {
    this.success = data.success || false;
    this.history = data.history || [];
    this.totalCount = data.totalCount || 0;
    this.successCount = data.successCount || 0;
    this.failedCount = data.failedCount || 0;
    this.pagination = data.pagination || {
      limit: 20,
      offset: 0,
      hasMore: false,
    };
    this.statistics = data.statistics || {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      averageSessionDuration: 0,
    };
    this.timestamp = data.timestamp || new Date();
  }

  validate(): boolean {
    return this.success && Array.isArray(this.history);
  }

  toPlainObject(): object {
    return {
      success: this.success,
      history: this.history,
      totalCount: this.totalCount,
      successCount: this.successCount,
      failedCount: this.failedCount,
      pagination: this.pagination,
      statistics: this.statistics,
      timestamp: this.timestamp,
    };
  }

  getLogSafeData(): object {
    return {
      success: this.success,
      historyCount: this.history.length,
      totalCount: this.totalCount,
      successCount: this.successCount,
      failedCount: this.failedCount,
      pagination: this.pagination,
      statistics: this.statistics,
      timestamp: this.timestamp,
    };
  }

  getSuccessfulLogins(): LoginHistoryEntry[] {
    return this.history.filter(entry => entry.status === 'success');
  }

  getFailedLogins(): LoginHistoryEntry[] {
    return this.history.filter(entry => entry.status === 'failed');
  }

  getRecentLogins(days: number = 7): LoginHistoryEntry[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.history.filter(entry => entry.loginTime >= cutoffDate);
  }
}
