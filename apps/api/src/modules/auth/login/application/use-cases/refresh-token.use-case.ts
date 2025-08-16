/**
 * @file refresh-token.use-case.ts
 * @description 刷新令牌用例
 * 
 * 该用例负责处理令牌刷新逻辑，包括：
 * 1. 验证刷新令牌的有效性
 * 2. 检查令牌是否过期或被撤销
 * 3. 生成新的访问令牌和刷新令牌
 * 4. 更新会话信息
 * 5. 记录审计日志
 */

import { Injectable } from '@nestjs/common';
import type { ISessionRepository } from '@/modules/auth/login/domain/repositories/session.repository.interface';
import type { ITokenService } from '@/modules/auth/login/domain/services/token.service.interface';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user.repository.interface';
import type { IAuditService } from '@/modules/audit/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { RefreshTokenRequestDto } from '../dto/refresh-token-request.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';
import { TokenExpiredException } from '@/modules/auth/login/domain/exceptions/token-expired.exception';
import { InvalidTokenException } from '@/modules/auth/login/domain/exceptions/invalid-token.exception';
import { SessionNotFoundException } from '@/modules/auth/login/domain/exceptions/session-not-found.exception';
import { UserNotFoundException } from '@/modules/users/management/domain/exceptions/user-not-found.exception';
import { UnauthorizedException } from '@nestjs/common';

export interface IRefreshTokenUseCase {
  execute(request: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto>;
}

@Injectable()
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  async execute(request: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    this.logger.info('开始执行刷新令牌用例', {
      context: LogContext.AUTH,
      refreshToken: request.refreshToken ? '[REDACTED]' : '',
    });

    try {
      // 1. 验证请求参数
      this.validateRequest(request);

      // 2. 验证刷新令牌
      const tokenPayload = await this.validateRefreshToken(request.refreshToken);

      // 3. 验证会话存在性和有效性
      const session = await this.validateSession(tokenPayload.sessionId);

      // 4. 验证用户存在性
      const user = await this.validateUser(tokenPayload.userId);

      // 5. 生成新的令牌对
      const newTokens = await this.generateNewTokens(user, session.id);

      // 6. 更新会话信息
      await this.updateSession(session.id, {
        lastActivityAt: new Date(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      // 7. 记录审计日志
      await this.auditService.logTokenRefresh({
        userId: user.id,
        sessionId: session.id,
        oldRefreshToken: request.refreshToken,
        newRefreshToken: newTokens.refreshToken,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: true,
      });

      // 8. 返回新的令牌
      const response = new RefreshTokenResponseDto({
        success: true,
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
          tokenType: 'Bearer',
          issuedAt: new Date(),
        },
        message: '令牌刷新成功',
        timestamp: new Date(),
      });

      this.logger.info('刷新令牌用例执行成功', {
        context: LogContext.AUTH,
        userId: user.id,
        sessionId: session.id,
        response: response.getLogSafeData(),
      });

      return response;

    } catch (error) {
      this.logger.error('刷新令牌用例执行失败', {
        context: LogContext.AUTH,
        refreshToken: request.refreshToken ? '[REDACTED]' : '',
        error: error.message,
        stack: error.stack,
      });

      // 记录失败的审计日志
      await this.auditService.logTokenRefresh({
        userId: 'unknown',
        sessionId: 'unknown',
        oldRefreshToken: request.refreshToken,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  private validateRequest(request: RefreshTokenRequestDto): void {
    if (!request.refreshToken) {
      throw new UnauthorizedException('刷新令牌不能为空');
    }

    if (request.refreshToken.length < 20) {
      throw new UnauthorizedException('无效的刷新令牌格式');
    }
  }

  private async validateRefreshToken(refreshToken: string): Promise<any> {
    try {
      // 验证刷新令牌的有效性
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      if (!payload || !payload.userId || !payload.sessionId) {
        throw new InvalidTokenException('无效的刷新令牌');
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('刷新令牌已过期');
      }
      throw new InvalidTokenException('无效的刷新令牌');
    }
  }

  private async validateSession(sessionId: string): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    if (session.status !== 'active') {
      throw new UnauthorizedException('会话已失效');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('会话已过期');
    }

    return session;
  }

  private async validateUser(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户账户已停用');
    }

    return user;
  }

  private async generateNewTokens(user: any, sessionId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // 生成新的访问令牌
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
      sessionId,
    });

    // 生成新的刷新令牌
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      sessionId,
    });

    // 获取访问令牌的过期时间
    const expiresIn = await this.tokenService.getAccessTokenExpiration();

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private async updateSession(sessionId: string, updates: {
    lastActivityAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.sessionRepository.updateSession(sessionId, {
      lastActivityAt: updates.lastActivityAt,
      ...(updates.ipAddress && { ipAddress: updates.ipAddress }),
      ...(updates.userAgent && { userAgent: updates.userAgent }),
    });
  }
}
