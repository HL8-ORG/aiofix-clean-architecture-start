import { BaseQuery } from '@/shared/application/base/base-query';
import { UserDto } from '../dto/user.dto';

/**
 * 根据用户名获取用户查询
 * 用于根据用户名获取用户信息的业务用例
 */
export class GetUserByUsernameQuery extends BaseQuery<UserDto | null> {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'GetUserByUsernameQuery';

  constructor(
    public readonly username: string,
  ) {
    super();
  }
}
