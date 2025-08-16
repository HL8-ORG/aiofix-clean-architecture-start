/**
 * @file user-not-found.exception.ts
 * @description 用户未找到异常
 */

export class UserNotFoundException extends Error {
  constructor(userId: string) {
    super(`用户不存在: ${userId}`);
    this.name = 'UserNotFoundException';
  }
}
