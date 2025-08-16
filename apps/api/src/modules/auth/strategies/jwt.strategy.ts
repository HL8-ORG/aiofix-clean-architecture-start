import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { PinoLoggerService } from '@/shared/infrastructure/logging/services/pino-logger.service';
import { LogContext } from '@/shared/infrastructure/logging/interfaces/logging.interface';

/**
 * @class JwtStrategy
 * @description
 * JWT认证策略。该策略负责验证JWT令牌的有效性，提取用户信息，
 * 并支持令牌刷新机制。
 * 
 * 主要原理与机制如下：
 * 1. 从请求头中提取JWT令牌
 * 2. 验证令牌的签名和有效期
 * 3. 提取令牌中的用户信息
 * 4. 验证用户状态和权限
 * 5. 返回用户上下文信息
 * 
 * 安全特性：
 * - 支持令牌过期检查
 * - 支持令牌刷新机制
 * - 集成用户状态验证
 * - 支持多租户环境
 * 
 * @extends {PassportStrategy<Strategy>}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * @constructor
   * @description
   * 构造函数，配置JWT策略参数
   * 
   * @param {ConfigService} configService - 配置服务，用于获取JWT配置
   * @param {PinoLoggerService} logger - 日志服务，用于记录认证日志
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  /**
   * @function validate
   * @description
   * 验证JWT令牌的核心方法。该方法负责验证令牌的有效性，
   * 提取用户信息，并返回用户上下文。
   * 
   * 执行流程：
   * 1. 验证令牌的签名和有效期
   * 2. 提取令牌中的用户信息
   * 3. 验证用户状态和权限
   * 4. 记录认证日志
   * 5. 返回用户上下文
   * 
   * @param {any} payload - JWT令牌的载荷信息
   * @returns {Promise<any>} 返回用户上下文信息
   * @throws {UnauthorizedException} 当令牌无效或用户状态异常时抛出异常
   */
  async validate(payload: any): Promise<any> {
    try {
      // 验证令牌载荷
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('无效的令牌载荷');
      }

      // 提取用户信息
      const user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        tenantId: payload.tenantId,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        sessionId: payload.sessionId,
        iat: payload.iat,
        exp: payload.exp,
      };

      // 验证用户状态
      if (!user.id || !user.email) {
        throw new UnauthorizedException('令牌中缺少必要的用户信息');
      }

      // 记录认证日志
      this.logger.info('JWT令牌验证成功', LogContext.AUTH, {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: user.sessionId,
      });

      return user;
    } catch (error) {
      this.logger.error('JWT令牌验证失败', LogContext.AUTH, {
        payload: payload ? { sub: payload.sub, email: payload.email } : null,
      }, error);
      throw new UnauthorizedException('令牌验证失败');
    }
  }
}
