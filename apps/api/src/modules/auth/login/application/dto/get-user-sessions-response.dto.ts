/**
 * @file get-user-sessions-response.dto.ts
 * @description 获取用户会话响应数据传输对象
 */

export interface SessionInfo {
  readonly sessionId: string;
  readonly userId: string;
  readonly tenantId: string;
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
  readonly status: 'active' | 'expired' | 'terminated';
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly expiresAt: Date;
  readonly isCurrentSession: boolean;
}

export class GetUserSessionsResponseDto {
  readonly success: boolean;
  readonly sessions: SessionInfo[];
  readonly totalCount: number;
  readonly activeCount: number;
  readonly pagination: {
    readonly limit: number;
    readonly offset: number;
    readonly hasMore: boolean;
  };
  readonly timestamp: Date;

  constructor(data: Partial<GetUserSessionsResponseDto>) {
    this.success = data.success || false;
    this.sessions = data.sessions || [];
    this.totalCount = data.totalCount || 0;
    this.activeCount = data.activeCount || 0;
    this.pagination = data.pagination || {
      limit: 20,
      offset: 0,
      hasMore: false,
    };
    this.timestamp = data.timestamp || new Date();
  }

  validate(): boolean {
    return this.success && Array.isArray(this.sessions);
  }

  toPlainObject(): object {
    return {
      success: this.success,
      sessions: this.sessions,
      totalCount: this.totalCount,
      activeCount: this.activeCount,
      pagination: this.pagination,
      timestamp: this.timestamp,
    };
  }

  getLogSafeData(): object {
    return {
      success: this.success,
      sessionsCount: this.sessions.length,
      totalCount: this.totalCount,
      activeCount: this.activeCount,
      pagination: this.pagination,
      timestamp: this.timestamp,
    };
  }

  getActiveSessions(): SessionInfo[] {
    return this.sessions.filter(session => session.status === 'active');
  }

  getCurrentSession(): SessionInfo | undefined {
    return this.sessions.find(session => session.isCurrentSession);
  }
}
