import { BaseQuery } from '@/shared/application/base/base-query';
import { UserListDto } from '../dto/user-list.dto';

/**
 * 获取用户列表查询
 * 用于获取用户列表的业务用例
 */
export class GetUsersQuery extends BaseQuery<UserListDto> {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'GetUsersQuery';

  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {
    super();
  }
}
