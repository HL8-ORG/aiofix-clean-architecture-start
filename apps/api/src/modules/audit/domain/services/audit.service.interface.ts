/**
 * @file audit.service.interface.ts
 * @description 审计服务接口
 */

export interface IAuditService {
  logSessionQuery(data: {
    userId: string;
    queryUserId: string;
    tenantId?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
    resultCount: number;
    success: boolean;
    error?: string;
  }): Promise<void>;

  logLoginSuccess(userId: string): Promise<void>;
  logLogout(data: {
    userId: string;
    sessionId?: string;
    globalLogout?: boolean;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
  }): Promise<void>;
  logTokenRefresh(data: {
    userId: string;
    sessionId: string;
    oldRefreshToken: string;
    newRefreshToken?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
  }): Promise<void>;
  logTokenValidation(data: {
    userId: string;
    sessionId: string;
    accessToken: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
  }): Promise<void>;
  logLoginHistoryQuery(data: {
    userId: string;
    queryUserId: string;
    tenantId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    resultCount: number;
    success: boolean;
    error?: string;
  }): Promise<void>;
}
