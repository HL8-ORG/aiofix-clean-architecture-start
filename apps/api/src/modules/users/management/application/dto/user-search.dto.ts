import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';

/**
 * @class UserSearchDto
 * @description
 * 用户搜索DTO，用于封装用户搜索的请求参数。
 * 支持多字段搜索、分页查询、排序和过滤功能。
 * 
 * 主要功能：
 * - 搜索关键词验证
 * - 分页参数验证
 * - 排序参数验证
 * - 状态过滤验证
 * 
 * 搜索字段：
 * - 用户名（username）
 * - 邮箱地址（email）
 * - 姓名（firstName, lastName）
 * - 昵称（nickname）
 * 
 * 排序字段：
 * - createdAt: 创建时间
 * - updatedAt: 更新时间
 * - username: 用户名
 * - email: 邮箱
 * - lastLoginAt: 最后登录时间
 */
export class UserSearchDto {
  /**
   * @property searchTerm
   * @description 搜索关键词，支持模糊搜索
   */
  @IsString()
  searchTerm: string;

  /**
   * @property page
   * @description 页码，从1开始
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  /**
   * @property limit
   * @description 每页数量，最大100
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /**
   * @property sortBy
   * @description 排序字段
   */
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'username', 'email', 'lastLoginAt'])
  sortBy?: string = 'createdAt';

  /**
   * @property sortOrder
   * @description 排序方向
   */
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * @property status
   * @description 用户状态过滤
   */
  @IsOptional()
  @IsString()
  @IsIn(['PENDING_ACTIVATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
  status?: string;

  /**
   * @constructor
   * @description
   * 构造函数，初始化用户搜索DTO
   * 
   * @param {Partial<UserSearchDto>} partial - 部分搜索参数
   */
  constructor(partial: Partial<UserSearchDto>) {
    Object.assign(this, partial);
  }

  /**
   * @method validate
   * @description
   * 验证搜索参数的有效性
   * 
   * @throws {Error} 当参数无效时抛出异常
   */
  validate(): void {
    if (!this.searchTerm || this.searchTerm.trim().length === 0) {
      throw new Error('搜索关键词不能为空');
    }

    if (this.searchTerm.trim().length < 2) {
      throw new Error('搜索关键词至少需要2个字符');
    }

    if (this.page && this.page < 1) {
      throw new Error('页码必须大于0');
    }

    if (this.limit && (this.limit < 1 || this.limit > 100)) {
      throw new Error('每页数量必须在1-100之间');
    }
  }

  /**
   * @method getSearchTerm
   * @description
   * 获取处理后的搜索关键词
   * 
   * @returns {string} 处理后的搜索关键词
   */
  getSearchTerm(): string {
    return this.searchTerm.trim();
  }

  /**
   * @method getOffset
   * @description
   * 获取数据库查询的偏移量
   * 
   * @returns {number} 偏移量
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
