/**
 * @file get-user-sessions.use-case.ts
 * @description 获取用户会话用例
 */

import { Injectable } from '@nestjs/common';
import type { ISessionRepository } from '@/modules/auth/login/domain/repositories/session.repository.interface';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user.repository.interface';
import type { IAuditService } from '@/modules/audit/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { GetUserSessionsRequestDto } from '../dto/get-user-sessions-request.dto';
import { GetUserSessionsResponseDto } from '../dto/get-user-sessions-response.dto';
import { UserNotFoundException } from '@/modules/users/management/domain/exceptions/user-not-found.exception';
import { UnauthorizedException } from '@nestjs/common';
import { UserId } from '@/modules/users/management/domain/value-objects/user-id';
import { TenantId } from '@/modules/tenants/management/domain/value-objects/tenant-id';
import { UserStatus } from '@/modules/users/management/domain/value-objects/user-status';

export interface IGetUserSessionsUseCase {
  execute(request: GetUserSessionsRequestDto): Promise<GetUserSessionsResponseDto>;
}

@Injectable()
export class GetUserSessionsUseCase implements IGetUserSessionsUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  async execute(request: GetUserSessionsRequestDto): Promise<GetUserSessionsResponseDto> {
    this.logger.info('开始执行获取用户会话用例', LogContext.AUTH, {
      userId: request.userId,
      tenantId: request.tenantId,
      activeOnly: request.activeOnly,
    });

    try {
      // 1. 验证请求参数
      this.validateRequest(request);

      // 2. 验证用户存在性
      const user = await this.validateUser(request.userId, request.tenantId);

      // 3. 查询用户会话
      const sessions = await this.queryUserSessions(request);

      // 4. 计算统计信息
      const statistics = await this.calculateStatistics(request.userId);

      // 5. 构建响应数据
      const sessionInfos = await this.buildSessionInfos(sessions, request.userId);

      // 6. 记录审计日志
      await this.auditService.logSessionQuery({
        userId: user.id,
        queryUserId: request.userId,
        tenantId: request.tenantId,
        activeOnly: request.activeOnly,
        limit: request.limit,
        offset: request.offset,
        resultCount: sessionInfos.length,
        success: true,
      });

      // 7. 返回会话列表
      const response = new GetUserSessionsResponseDto({
        success: true,
        sessions: sessionInfos,
        totalCount: statistics.totalCount,
        activeCount: statistics.activeCount,
        pagination: {
          limit: request.limit!,
          offset: request.offset!,
          hasMore: request.offset! + request.limit! < statistics.totalCount,
        },
        timestamp: new Date(),
      });

      this.logger.info('获取用户会话用例执行成功', LogContext.AUTH, {
        userId: request.userId,
        sessionCount: sessionInfos.length,
        response: response.getLogSafeData(),
      });

      return response;

    } catch (error) {
      this.logger.error('获取用户会话用例执行失败', LogContext.AUTH, {
        userId: request.userId,
        error: error.message,
        stack: error.stack,
      });

      // 记录失败的审计日志
      await this.auditService.logSessionQuery({
        userId: 'unknown',
        queryUserId: request.userId,
        tenantId: request.tenantId,
        activeOnly: request.activeOnly,
        limit: request.limit,
        offset: request.offset,
        resultCount: 0,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  private validateRequest(request: GetUserSessionsRequestDto): void {
    if (!request.userId) {
      throw new UnauthorizedException('用户ID不能为空');
    }

    if (request.limit! <= 0 || request.limit! > 100) {
      throw new UnauthorizedException('分页大小必须在1-100之间');
    }

    if (request.offset! < 0) {
      throw new UnauthorizedException('偏移量不能为负数');
    }
  }

  private async validateUser(userId: string, tenantId?: string): Promise<any> {
    const userIdVO = new UserId(userId);
    const user = await this.userRepository.findById(userIdVO);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.status.value !== 'active') {
      throw new UnauthorizedException('用户账户已停用');
    }

    // 如果指定了租户，验证用户属于该租户
    if (tenantId && user.tenantId.value !== tenantId) {
      throw new UnauthorizedException('用户不属于指定租户');
    }

    return user;
  }

  private async queryUserSessions(request: GetUserSessionsRequestDto): Promise<any[]> {
    const queryOptions = {
      userId: request.userId,
      tenantId: request.tenantId,
      activeOnly: request.activeOnly,
      limit: request.limit!,
      offset: request.offset!,
    };

    if (request.activeOnly) {
      return await this.sessionRepository.findActiveSessionsByUserId(
        request.userId,
        queryOptions
      );
    } else {
      return await this.sessionRepository.findSessionsByUserId(
        request.userId,
        queryOptions
      );
    }
  }

  private async calculateStatistics(userId: string): Promise<{
    totalCount: number;
    activeCount: number;
  }> {
    const [totalCount, activeCount] = await Promise.all([
      this.sessionRepository.countSessionsByUserId(userId),
      this.sessionRepository.countActiveSessionsByUserId(userId),
    ]);

    return {
      totalCount,
      activeCount,
    };
  }

  private async buildSessionInfos(sessions: any[], userId: string): Promise<any[]> {
    return sessions.map(session => ({
      sessionId: session.id,
      userId: session.userId,
      tenantId: session.tenantId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceInfo: this.parseDeviceInfo(session.userAgent),
      location: session.location,
      status: session.status,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrentSession: false, // 这里需要根据实际情况判断
    }));
  }

  private parseDeviceInfo(userAgent?: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    if (!userAgent) {
      return {
        deviceType: 'unknown',
        browser: 'unknown',
        os: 'unknown',
      };
    }

    // 简单的设备信息解析
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Android.*Tablet/.test(userAgent);

    let deviceType = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // 浏览器检测
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // 操作系统检测
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      deviceType,
      browser,
      os,
    };
  }
}
