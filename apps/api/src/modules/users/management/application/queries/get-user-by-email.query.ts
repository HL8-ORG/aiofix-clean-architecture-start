import { BaseQuery } from '@/shared/application/base/base-query';
import { UserDto } from '../dto/user.dto';

/**
 * 根据邮箱获取用户查询
 * 用于根据邮箱获取用户信息的业务用例
 */
export class GetUserByEmailQuery extends BaseQuery<UserDto | null> {
  /**
   * @property queryType
   * @description 查询类型标识符，用于查询总线路由
   */
  readonly queryType = 'GetUserByEmailQuery';

  constructor(
    public readonly email: string,
  ) {
    super();
  }
}
