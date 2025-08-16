/**
 * @file session.repository.interface.ts
 * @description 会话仓储接口
 */

export interface ISessionRepository {
  findById(sessionId: string): Promise<any>;
  findActiveSessionsByUserId(userId: string, options?: any): Promise<any[]>;
  findSessionsByUserId(userId: string, options?: any): Promise<any[]>;
  findLatestSessionByUserId(userId: string): Promise<any>;
  countSessionsByUserId(userId: string): Promise<number>;
  countActiveSessionsByUserId(userId: string): Promise<number>;
  terminateSession(sessionId: string): Promise<void>;
  updateSession(sessionId: string, updates: any): Promise<void>;
}
