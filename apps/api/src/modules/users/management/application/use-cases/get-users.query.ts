/**
 * 获取用户列表查询
 * 用于获取用户列表的业务用例
 */
export class GetUsersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {}
}
