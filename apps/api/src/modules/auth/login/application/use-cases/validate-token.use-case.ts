/**
 * @file validate-token.use-case.ts
 * @description 验证令牌用例
 * 
 * 该用例负责处理令牌验证逻辑，包括：
 * 1. 验证访问令牌的有效性
 * 2. 检查令牌是否过期或被撤销
 * 3. 验证用户和会话的有效性
 * 4. 返回用户信息和令牌状态
 * 5. 记录审计日志
 */

import { Injectable } from '@nestjs/common';
import type { ITokenService } from '@/modules/auth/login/domain/services/token.service.interface';
import type { ISessionRepository } from '@/modules/auth/login/domain/repositories/session.repository.interface';
import type { IUserRepository } from '@/modules/users/management/domain/repositories/user.repository.interface';
import type { IAuditService } from '@/modules/audit/domain/services/audit.service.interface';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';
import { ValidateTokenRequestDto } from '../dto/validate-token-request.dto';
import { ValidateTokenResponseDto } from '../dto/validate-token-response.dto';
import { TokenExpiredException } from '@/modules/auth/login/domain/exceptions/token-expired.exception';
import { InvalidTokenException } from '@/modules/auth/login/domain/exceptions/invalid-token.exception';
import { SessionNotFoundException } from '@/modules/auth/login/domain/exceptions/session-not-found.exception';
import { UserNotFoundException } from '@/modules/users/management/domain/exceptions/user-not-found.exception';
import { UnauthorizedException } from '@nestjs/common';

export interface IValidateTokenUseCase {
  execute(request: ValidateTokenRequestDto): Promise<ValidateTokenResponseDto>;
}

@Injectable()
export class ValidateTokenUseCase implements IValidateTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly auditService: IAuditService,
    private readonly logger: PinoLoggerService,
  ) { }

  async execute(request: ValidateTokenRequestDto): Promise<ValidateTokenResponseDto> {
    this.logger.info('开始执行验证令牌用例', {
      context: LogContext.AUTH,
      accessToken: request.accessToken ? '[REDACTED]' : '',
      tenantId: request.tenantId,
    });

    try {
      // 1. 验证请求参数
      this.validateRequest(request);

      // 2. 验证访问令牌
      const tokenPayload = await this.validateAccessToken(request.accessToken);

      // 3. 验证会话存在性和有效性
      const session = await this.validateSession(tokenPayload.sessionId);

      // 4. 验证用户存在性和状态
      const user = await this.validateUser(tokenPayload.userId);

      // 5. 验证租户匹配（如果指定了租户）
      if (request.tenantId && user.tenantId !== request.tenantId) {
        throw new UnauthorizedException('令牌与指定租户不匹配');
      }

      // 6. 计算令牌剩余时间
      const tokenInfo = await this.calculateTokenInfo(tokenPayload);

      // 7. 构建用户信息
      const userInfo = this.buildUserInfo(user, tokenPayload);

      // 8. 记录审计日志
      await this.auditService.logTokenValidation({
        userId: user.id,
        sessionId: session.id,
        accessToken: request.accessToken,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: true,
      });

      // 9. 返回验证结果
      const response = new ValidateTokenResponseDto({
        valid: true,
        user: userInfo,
        tokenInfo,
        message: '令牌验证成功',
        timestamp: new Date(),
      });

      this.logger.info('验证令牌用例执行成功', {
        context: LogContext.AUTH,
        userId: user.id,
        sessionId: session.id,
        response: response.getLogSafeData(),
      });

      return response;

    } catch (error) {
      this.logger.error('验证令牌用例执行失败', {
        context: LogContext.AUTH,
        accessToken: request.accessToken ? '[REDACTED]' : '',
        error: error.message,
        stack: error.stack,
      });

      // 记录失败的审计日志
      await this.auditService.logTokenValidation({
        userId: 'unknown',
        sessionId: 'unknown',
        accessToken: request.accessToken,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        success: false,
        error: error.message,
      });

      // 返回验证失败的结果
      return new ValidateTokenResponseDto({
        valid: false,
        message: error.message || '令牌验证失败',
        timestamp: new Date(),
      });
    }
  }

  private validateRequest(request: ValidateTokenRequestDto): void {
    if (!request.accessToken) {
      throw new UnauthorizedException('访问令牌不能为空');
    }

    if (request.accessToken.length < 20) {
      throw new UnauthorizedException('无效的访问令牌格式');
    }
  }

  private async validateAccessToken(accessToken: string): Promise<any> {
    try {
      // 验证访问令牌的有效性
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      if (!payload || !payload.userId || !payload.sessionId) {
        throw new InvalidTokenException('无效的访问令牌');
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('访问令牌已过期');
      }
      throw new InvalidTokenException('无效的访问令牌');
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

  private async calculateTokenInfo(tokenPayload: any): Promise<{
    issuedAt: Date;
    expiresAt: Date;
    remainingTime: number;
  }> {
    const issuedAt = new Date(tokenPayload.iat * 1000);
    const expiresAt = new Date(tokenPayload.exp * 1000);
    const now = new Date();
    const remainingTime = Math.max(0, expiresAt.getTime() - now.getTime());

    return {
      issuedAt,
      expiresAt,
      remainingTime,
    };
  }

  private buildUserInfo(user: any, tokenPayload: any): {
    userId: string;
    username: string;
    email: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
  } {
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
      roles: tokenPayload.roles || [],
      permissions: tokenPayload.permissions || [],
    };
  }
}
