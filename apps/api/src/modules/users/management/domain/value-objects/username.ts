/**
 * @class Username
 * @description 用户名字值对象
 * 
 * 值对象特点：
 * - 不可变性：一旦创建就不能修改
 * - 相等性：通过值判断相等，而不是引用
 * - 自验证：在创建时验证值的有效性
 * - 无副作用：不包含业务逻辑
 * 
 * 业务规则：
 * - 用户名必须全局唯一
 * - 用户名长度2-20字符
 * - 只能包含字母、数字、下划线
 * - 不能以数字开头
 * - 不能包含连续下划线
 */
export class Username {
  private readonly _value: string;

  /**
   * @constructor
   * @description 私有构造函数，通过工厂方法创建实例
   * @param value 用户名
   */
  private constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  /**
   * @method create
   * @description 创建用户名的工厂方法
   * @param value 用户名
   * @returns Username
   */
  static create(value: string): Username {
    return new Username(value);
  }

  /**
   * @method validate
   * @description 验证用户名的有效性
   * @param value 用户名
   * @throws Error 当值无效时抛出异常
   */
  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (value.length < 2) {
      throw new Error('Username must be at least 2 characters long');
    }

    if (value.length > 20) {
      throw new Error('Username cannot exceed 20 characters');
    }

    // 验证用户名格式：字母、数字、下划线，不能以数字开头
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!usernameRegex.test(value)) {
      throw new Error('Username must start with a letter and can only contain letters, numbers, and underscores');
    }

    // 验证不能包含连续下划线
    if (value.includes('__')) {
      throw new Error('Username cannot contain consecutive underscores');
    }

    // 验证不能以下划线结尾
    if (value.endsWith('_')) {
      throw new Error('Username cannot end with an underscore');
    }

    // 验证不能是保留用户名
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'guest', 'test',
      'user', 'users', 'account', 'accounts', 'profile', 'settings',
      'login', 'logout', 'register', 'signup', 'signin', 'password',
      'email', 'mail', 'support', 'help', 'info', 'contact'
    ];

    if (reservedUsernames.includes(value.toLowerCase())) {
      throw new Error('Username is reserved and cannot be used');
    }
  }

  /**
   * @method equals
   * @description 比较两个用户名是否相等
   * @param other 另一个用户名
   * @returns boolean
   */
  equals(other: Username): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * @method toString
   * @description 转换为字符串
   * @returns string
   */
  toString(): string {
    return this._value;
  }

  /**
   * @method value
   * @description 获取用户名值
   * @returns string
   */
  get value(): string {
    return this._value;
  }

  /**
   * @method toUpperCase
   * @description 转换为大写
   * @returns string
   */
  toUpperCase(): string {
    return this._value.toUpperCase();
  }

  /**
   * @method toLowerCase
   * @description 转换为小写
   * @returns string
   */
  toLowerCase(): string {
    return this._value.toLowerCase();
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称（首字母大写）
   * @returns string
   */
  getDisplayName(): string {
    return this._value.charAt(0).toUpperCase() + this._value.slice(1);
  }

  /**
   * @method isReserved
   * @description 判断是否为保留用户名
   * @returns boolean
   */
  isReserved(): boolean {
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'guest', 'test',
      'user', 'users', 'account', 'accounts', 'profile', 'settings',
      'login', 'logout', 'register', 'signup', 'signin', 'password',
      'email', 'mail', 'support', 'help', 'info', 'contact'
    ];
    return reservedUsernames.includes(this._value.toLowerCase());
  }
}
