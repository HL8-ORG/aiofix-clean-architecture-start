/**
 * 获取用户查询
 * 用于获取用户信息的业务用例
 */
export class GetUserQuery {
  constructor(
    public readonly userId: string,
  ) {}
}
