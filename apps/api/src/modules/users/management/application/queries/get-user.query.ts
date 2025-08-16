import { BaseQuery } from '@/shared/application/base/base-query';
import { UserDto } from '../dto/user.dto';

/**
 * 获取用户查询
 * 用于获取用户信息的业务用例
 */
export class GetUserQuery extends BaseQuery<UserDto> {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'GetUserQuery';

  constructor(
    public readonly userId: string,
  ) {
    super();
  }
}
