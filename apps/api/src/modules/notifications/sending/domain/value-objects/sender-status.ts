import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum SenderStatusEnum
 * @description 发送者状态枚举
 */
export enum SenderStatusEnum {
  ACTIVE = 'ACTIVE',         // 激活状态
  INACTIVE = 'INACTIVE',     // 非激活状态
  MAINTENANCE = 'MAINTENANCE', // 维护状态
  ERROR = 'ERROR',           // 错误状态
  SUSPENDED = 'SUSPENDED',   // 暂停状态
  TESTING = 'TESTING'        // 测试状态
}

/**
 * @class SenderStatus
 * @description
 * 通知发送者状态值对象，用于管理发送者的运行状态。
 * 
 * 主要功能与职责：
 * 1. 定义发送者的运行状态
 * 2. 控制发送者的可用性
 * 3. 支持状态转换和验证
 * 
 * 业务规则：
 * - 只有激活状态的发送者才能发送通知
 * - 状态转换必须遵循预定义的规则
 * - 错误状态需要人工干预才能恢复
 * 
 * @extends EnumValueObject
 */
export class SenderStatus extends EnumValueObject<SenderStatusEnum> {
  constructor(value: SenderStatusEnum) {
    super(value);
  }

  /**
   * @protected getValidValues
   * @description 获取有效的枚举值
   * @returns {SenderStatusEnum[]} 有效的枚举值数组
   */
  protected getValidValues(): SenderStatusEnum[] {
    return Object.values(SenderStatusEnum);
  }

  /**
   * @method isActive
   * @description 检查是否为激活状态
   * @returns {boolean} 是否为激活状态
   */
  isActive(): boolean {
    return this.value === SenderStatusEnum.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 检查是否为非激活状态
   * @returns {boolean} 是否为非激活状态
   */
  isInactive(): boolean {
    return this.value === SenderStatusEnum.INACTIVE;
  }

  /**
   * @method isMaintenance
   * @description 检查是否为维护状态
   * @returns {boolean} 是否为维护状态
   */
  isMaintenance(): boolean {
    return this.value === SenderStatusEnum.MAINTENANCE;
  }

  /**
   * @method isError
   * @description 检查是否为错误状态
   * @returns {boolean} 是否为错误状态
   */
  isError(): boolean {
    return this.value === SenderStatusEnum.ERROR;
  }

  /**
   * @method isSuspended
   * @description 检查是否为暂停状态
   * @returns {boolean} 是否为暂停状态
   */
  isSuspended(): boolean {
    return this.value === SenderStatusEnum.SUSPENDED;
  }

  /**
   * @method isTesting
   * @description 检查是否为测试状态
   * @returns {boolean} 是否为测试状态
   */
  isTesting(): boolean {
    return this.value === SenderStatusEnum.TESTING;
  }

  /**
   * @method canSend
   * @description 检查是否可以发送通知
   * @returns {boolean} 是否可以发送
   */
  canSend(): boolean {
    return this.isActive() || this.isTesting();
  }

  /**
   * @method canActivate
   * @description 检查是否可以激活
   * @returns {boolean} 是否可以激活
   */
  canActivate(): boolean {
    return this.isInactive() || this.isSuspended() || this.isTesting();
  }

  /**
   * @method canDeactivate
   * @description 检查是否可以停用
   * @returns {boolean} 是否可以停用
   */
  canDeactivate(): boolean {
    return this.isActive() || this.isTesting();
  }

  /**
   * @method canSuspend
   * @description 检查是否可以暂停
   * @returns {boolean} 是否可以暂停
   */
  canSuspend(): boolean {
    return this.isActive() || this.isTesting();
  }

  /**
   * @method canResume
   * @description 检查是否可以恢复
   * @returns {boolean} 是否可以恢复
   */
  canResume(): boolean {
    return this.isSuspended() || this.isMaintenance();
  }

  /**
   * @method canEnterMaintenance
   * @description 检查是否可以进入维护状态
   * @returns {boolean} 是否可以进入维护状态
   */
  canEnterMaintenance(): boolean {
    return this.isActive() || this.isTesting();
  }

  /**
   * @method canExitMaintenance
   * @description 检查是否可以退出维护状态
   * @returns {boolean} 是否可以退出维护状态
   */
  canExitMaintenance(): boolean {
    return this.isMaintenance();
  }

  /**
   * @method canEnterError
   * @description 检查是否可以进入错误状态
   * @returns {boolean} 是否可以进入错误状态
   */
  canEnterError(): boolean {
    return this.isActive() || this.isTesting();
  }

  /**
   * @method canExitError
   * @description 检查是否可以退出错误状态
   * @returns {boolean} 是否可以退出错误状态
   */
  canExitError(): boolean {
    return this.isError();
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<SenderStatusEnum, string> = {
      [SenderStatusEnum.ACTIVE]: '激活',
      [SenderStatusEnum.INACTIVE]: '非激活',
      [SenderStatusEnum.MAINTENANCE]: '维护中',
      [SenderStatusEnum.ERROR]: '错误',
      [SenderStatusEnum.SUSPENDED]: '暂停',
      [SenderStatusEnum.TESTING]: '测试中'
    };
    return displayNames[this.value];
  }

  /**
   * @method getDescription
   * @description 获取描述信息
   * @returns {string} 描述信息
   */
  getDescription(): string {
    const descriptions: Record<SenderStatusEnum, string> = {
      [SenderStatusEnum.ACTIVE]: '发送者正常运行，可以发送通知',
      [SenderStatusEnum.INACTIVE]: '发送者已停用，不能发送通知',
      [SenderStatusEnum.MAINTENANCE]: '发送者正在维护中，暂时不能发送通知',
      [SenderStatusEnum.ERROR]: '发送者出现错误，需要人工干预',
      [SenderStatusEnum.SUSPENDED]: '发送者已暂停，不能发送通知',
      [SenderStatusEnum.TESTING]: '发送者处于测试状态，可以发送测试通知'
    };
    return descriptions[this.value];
  }

  /**
   * @method getColor
   * @description 获取状态对应的颜色
   * @returns {string} 颜色值
   */
  getColor(): string {
    const colors: Record<SenderStatusEnum, string> = {
      [SenderStatusEnum.ACTIVE]: '#52c41a',      // 绿色
      [SenderStatusEnum.INACTIVE]: '#d9d9d9',    // 灰色
      [SenderStatusEnum.MAINTENANCE]: '#faad14', // 橙色
      [SenderStatusEnum.ERROR]: '#ff4d4f',       // 红色
      [SenderStatusEnum.SUSPENDED]: '#ff7a45',   // 橙红色
      [SenderStatusEnum.TESTING]: '#1890ff'      // 蓝色
    };
    return colors[this.value];
  }
}
