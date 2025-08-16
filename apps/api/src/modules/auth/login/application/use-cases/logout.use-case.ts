/**
 * @file logout.use-case.ts
 * @description 用户登出用例
 * 
 * 该用例负责处理用户登出逻辑，包括：
 * 1. 验证用户身份和会话
 * 2. 终止指定会话或所有会话
 * 3. 清除相关缓存和令牌
 * 4. 记录审计日志
 */

import { Injectable } from '@nestjs/common';
import type { ISessionRepository } from '@/modules/auth/login/domain/repositories/session.repository.interface';
import type { ITokenService } from '@/modules/auth/login/domain/services/token.service.interface';
import type { IAuditService } from '@/modules/audit/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { LogoutRequestDto } from '../dto/logout-request.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { SessionNotFoundException } from '@/modules/auth/login/domain/exceptions/session-not-found.exception';
import { UserNotFoundException } from '@/modules/users/management/domain/exceptions/user-not-found.exception';
import { UnauthorizedException } from '@nestjs/common';

export interface ILogoutUseCase {
  execute(request: LogoutRequestDto): Promise<LogoutResponseDto>;
}

@Injectable()
export class LogoutUseCase implements ILogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  async execute(request: LogoutRequestDto): Promise<LogoutResponseDto> {
    this.logger.info('开始执行登出用例', {
      context: LogContext.AUTH,
      userId: request.userId,
      sessionId: request.sessionId,
      globalLogout: request.globalLogout,
    });

    try {
      // 1. 验证请求参数
      this.validateRequest(request);

      // 2. 验证用户存在性（这里可以添加用户验证逻辑）
      // await this.validateUser(request.userId);

      // 3. 执行登出逻辑
      let logoutResult: { success: boolean; message: string; terminatedSessions: number };

      if (request.globalLogout) {
        // 全局登出：终止用户的所有会话
        logoutResult = await this.performGlobalLogout(request.userId);
      } else if (request.sessionId) {
        // 指定会话登出：只终止指定会话
        logoutResult = await this.performSessionLogout(request.userId, request.sessionId);
      } else {
        // 默认登出：终止当前会话
        logoutResult = await this.performDefaultLogout(request.userId);
      }

      // 4. 记录审计日志
      await this.auditService.logLogout({
        userId: request.userId,
        sessionId: request.sessionId,
        globalLogout: request.globalLogout,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: logoutResult.success,
      });

      // 5. 返回登出结果
      const response = new LogoutResponseDto({
        success: logoutResult.success,
        message: logoutResult.message,
        timestamp: new Date(),
      });

      this.logger.info('登出用例执行成功', {
        context: LogContext.AUTH,
        userId: request.userId,
        terminatedSessions: logoutResult.terminatedSessions,
        response: response.getLogSafeData(),
      });

      return response;

    } catch (error) {
      this.logger.error('登出用例执行失败', {
        context: LogContext.AUTH,
        userId: request.userId,
        error: error.message,
        stack: error.stack,
      });

      // 记录失败的审计日志
      await this.auditService.logLogout({
        userId: request.userId,
        sessionId: request.sessionId,
        globalLogout: request.globalLogout,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  private validateRequest(request: LogoutRequestDto): void {
    if (!request.userId) {
      throw new UnauthorizedException('用户ID不能为空');
    }

    if (request.sessionId && !this.isValidSessionId(request.sessionId)) {
      throw new UnauthorizedException('无效的会话ID');
    }
  }

  private isValidSessionId(sessionId: string): boolean {
    // 简单的会话ID格式验证
    return /^[a-zA-Z0-9-_]{20,}$/.test(sessionId);
  }

  private async performGlobalLogout(userId: string): Promise<{ success: boolean; message: string; terminatedSessions: number }> {
    this.logger.info('执行全局登出', {
      context: LogContext.AUTH,
      userId,
    });

    // 获取用户的所有活跃会话
    const activeSessions = await this.sessionRepository.findActiveSessionsByUserId(userId);

    // 终止所有会话
    const terminatedSessions = await Promise.all(
      activeSessions.map(session => this.sessionRepository.terminateSession(session.id))
    );

    // 清除相关令牌缓存
    await this.tokenService.invalidateUserTokens(userId);

    return {
      success: true,
      message: `已成功登出所有设备，共终止 ${terminatedSessions.length} 个会话`,
      terminatedSessions: terminatedSessions.length,
    };
  }

  private async performSessionLogout(userId: string, sessionId: string): Promise<{ success: boolean; message: string; terminatedSessions: number }> {
    this.logger.info('执行指定会话登出', {
      context: LogContext.AUTH,
      userId,
      sessionId,
    });

    // 查找指定会话
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    // 验证会话属于该用户
    if (session.userId !== userId) {
      throw new UnauthorizedException('无权访问此会话');
    }

    // 终止会话
    await this.sessionRepository.terminateSession(sessionId);

    // 清除相关令牌缓存
    await this.tokenService.invalidateSessionTokens(sessionId);

    return {
      success: true,
      message: '已成功登出指定设备',
      terminatedSessions: 1,
    };
  }

  private async performDefaultLogout(userId: string): Promise<{ success: boolean; message: string; terminatedSessions: number }> {
    this.logger.info('执行默认登出', {
      context: LogContext.AUTH,
      userId,
    });

    // 获取用户的最新会话
    const latestSession = await this.sessionRepository.findLatestSessionByUserId(userId);

    if (latestSession) {
      // 终止最新会话
      await this.sessionRepository.terminateSession(latestSession.id);
      await this.tokenService.invalidateSessionTokens(latestSession.id);

      return {
        success: true,
        message: '已成功登出当前设备',
        terminatedSessions: 1,
      };
    } else {
      return {
        success: true,
        message: '用户当前没有活跃会话',
        terminatedSessions: 0,
      };
    }
  }
}
