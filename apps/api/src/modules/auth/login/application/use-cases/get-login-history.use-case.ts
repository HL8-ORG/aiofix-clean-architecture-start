/**
 * @file get-login-history.use-case.ts
 * @description 获取登录历史用例
 */

import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user.repository.interface';
import type { IAuditService } from '@/modules/audit/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { GetLoginHistoryRequestDto } from '../dto/get-login-history-request.dto';
import { GetLoginHistoryResponseDto } from '../dto/get-login-history-response.dto';
import { UserNotFoundException } from '@/modules/users/management/domain/exceptions/user-not-found.exception';
import { UnauthorizedException } from '@nestjs/common';

export interface IGetLoginHistoryUseCase {
  execute(request: GetLoginHistoryRequestDto): Promise<GetLoginHistoryResponseDto>;
}

@Injectable()
export class GetLoginHistoryUseCase implements IGetLoginHistoryUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  async execute(request: GetLoginHistoryRequestDto): Promise<GetLoginHistoryResponseDto> {
    this.logger.info('开始执行获取登录历史用例', {
      context: LogContext.AUTH,
      userId: request.userId,
      tenantId: request.tenantId,
      status: request.status,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    try {
      // 1. 验证请求参数
      this.validateRequest(request);

      // 2. 验证用户存在性
      const user = await this.validateUser(request.userId, request.tenantId);

      // 3. 查询登录历史
      const history = await this.queryLoginHistory(request);

      // 4. 计算统计信息
      const statistics = await this.calculateStatistics(request.userId, request);

      // 5. 记录审计日志
      await this.auditService.logLoginHistoryQuery({
        userId: user.id,
        queryUserId: request.userId,
        tenantId: request.tenantId,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        limit: request.limit,
        offset: request.offset,
        resultCount: history.length,
        success: true,
      });

      // 6. 返回登录历史
      const response = new GetLoginHistoryResponseDto({
        success: true,
        history,
        totalCount: statistics.totalCount,
        successCount: statistics.successCount,
        failedCount: statistics.failedCount,
        pagination: {
          limit: request.limit!,
          offset: request.offset!,
          hasMore: request.offset! + request.limit! < statistics.totalCount,
        },
        statistics,
        timestamp: new Date(),
      });

      this.logger.info('获取登录历史用例执行成功', {
        context: LogContext.AUTH,
        userId: request.userId,
        historyCount: history.length,
        response: response.getLogSafeData(),
      });

      return response;

    } catch (error) {
      this.logger.error('获取登录历史用例执行失败', {
        context: LogContext.AUTH,
        userId: request.userId,
        error: error.message,
        stack: error.stack,
      });

      // 记录失败的审计日志
      await this.auditService.logLoginHistoryQuery({
        userId: 'unknown',
        queryUserId: request.userId,
        tenantId: request.tenantId,
        status: request.status,
        startDate: request.startDate,
        endDate: request.endDate,
        limit: request.limit,
        offset: request.offset,
        resultCount: 0,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  private validateRequest(request: GetLoginHistoryRequestDto): void {
    if (!request.userId) {
      throw new UnauthorizedException('用户ID不能为空');
    }

    if (request.limit! <= 0 || request.limit! > 100) {
      throw new UnauthorizedException('分页大小必须在1-100之间');
    }

    if (request.offset! < 0) {
      throw new UnauthorizedException('偏移量不能为负数');
    }

    if (request.startDate && request.endDate && request.startDate > request.endDate) {
      throw new UnauthorizedException('开始日期不能晚于结束日期');
    }
  }

  private async validateUser(userId: string, tenantId?: string): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户账户已停用');
    }

    // 如果指定了租户，验证用户属于该租户
    if (tenantId && user.tenantId !== tenantId) {
      throw new UnauthorizedException('用户不属于指定租户');
    }

    return user;
  }

  private async queryLoginHistory(request: GetLoginHistoryRequestDto): Promise<any[]> {
    // 这里应该调用审计服务或专门的登录历史仓储
    // 暂时返回模拟数据
    const mockHistory = [
      {
        id: '1',
        userId: request.userId,
        tenantId: request.tenantId || 'default',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
        logoutTime: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23小时前
        status: 'success' as const,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceInfo: {
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
        },
        location: {
          country: 'China',
          city: 'Beijing',
          timezone: 'Asia/Shanghai',
        },
        failureReason: undefined,
        sessionDuration: 3600, // 1小时
      },
      {
        id: '2',
        userId: request.userId,
        tenantId: request.tenantId || 'default',
        loginTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
        logoutTime: undefined,
        status: 'failed' as const,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        deviceInfo: {
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS',
        },
        location: {
          country: 'China',
          city: 'Shanghai',
          timezone: 'Asia/Shanghai',
        },
        failureReason: 'Invalid password',
        sessionDuration: undefined,
      },
    ];

    // 根据状态过滤
    if (request.status && request.status !== 'all') {
      return mockHistory.filter(entry => entry.status === request.status);
    }

    return mockHistory;
  }

  private async calculateStatistics(userId: string, request: GetLoginHistoryRequestDto): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    averageSessionDuration: number;
    lastLoginTime?: Date;
  }> {
    // 这里应该从数据库查询实际的统计数据
    // 暂时返回模拟数据
    return {
      totalLogins: 150,
      successfulLogins: 145,
      failedLogins: 5,
      averageSessionDuration: 7200, // 2小时
      lastLoginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    };
  }
}
