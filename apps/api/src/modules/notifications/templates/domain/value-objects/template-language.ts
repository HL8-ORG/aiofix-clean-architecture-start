import { EnumValueObject } from '@/shared/domain/value-objects/base.value-object';

/**
 * @enum TemplateLanguageEnum
 * @description 模板语言枚举
 */
export enum TemplateLanguageEnum {
  ZH_CN = 'ZH_CN',                     // 简体中文
  ZH_TW = 'ZH_TW',                     // 繁体中文
  EN_US = 'EN_US',                     // 美式英语
  EN_GB = 'EN_GB',                     // 英式英语
  JA_JP = 'JA_JP',                     // 日语
  KO_KR = 'KO_KR',                     // 韩语
  FR_FR = 'FR_FR',                     // 法语
  DE_DE = 'DE_DE',                     // 德语
  ES_ES = 'ES_ES',                     // 西班牙语
  PT_BR = 'PT_BR',                     // 巴西葡萄牙语
  RU_RU = 'RU_RU',                     // 俄语
  AR_SA = 'AR_SA'                      // 阿拉伯语
}

/**
 * @class TemplateLanguage
 * @description
 * 模板语言值对象，用于表示通知模板的语言。
 * 
 * 主要功能与职责：
 * 1. 封装模板语言的枚举值，确保类型安全
 * 2. 提供模板语言的验证逻辑，确保语言值有效
 * 3. 继承EnumValueObject基类，获得通用的枚举值对象功能
 * 4. 支持模板语言的比较、序列化等操作
 * 5. 提供语言相关的工具方法
 * 
 * 业务规则：
 * - 模板语言必须是预定义的枚举值之一
 * - 支持多语言模板管理
 * - 提供语言代码和显示名称的映射
 * 
 * @extends EnumValueObject<TemplateLanguageEnum>
 */
export class TemplateLanguage extends EnumValueObject<TemplateLanguageEnum> {
  /**
   * @constructor
   * @param value 模板语言的枚举值
   * @throws {Error} 当模板语言值无效时抛出异常
   */
  constructor(value: TemplateLanguageEnum) {
    super(value);
  }

  /**
   * @protected getValidValues
   * @description 获取有效的枚举值
   * @returns {TemplateLanguageEnum[]} 有效的枚举值数组
   */
  protected getValidValues(): TemplateLanguageEnum[] {
    return Object.values(TemplateLanguageEnum);
  }

  /**
   * @method isChinese
   * @description 检查是否为中文
   * @returns {boolean} 是否为中文
   */
  isChinese(): boolean {
    return this.value === TemplateLanguageEnum.ZH_CN || this.value === TemplateLanguageEnum.ZH_TW;
  }

  /**
   * @method isEnglish
   * @description 检查是否为英语
   * @returns {boolean} 是否为英语
   */
  isEnglish(): boolean {
    return this.value === TemplateLanguageEnum.EN_US || this.value === TemplateLanguageEnum.EN_GB;
  }

  /**
   * @method isJapanese
   * @description 检查是否为日语
   * @returns {boolean} 是否为日语
   */
  isJapanese(): boolean {
    return this.value === TemplateLanguageEnum.JA_JP;
  }

  /**
   * @method isKorean
   * @description 检查是否为韩语
   * @returns {boolean} 是否为韩语
   */
  isKorean(): boolean {
    return this.value === TemplateLanguageEnum.KO_KR;
  }

  /**
   * @method isEuropean
   * @description 检查是否为欧洲语言
   * @returns {boolean} 是否为欧洲语言
   */
  isEuropean(): boolean {
    return this.value === TemplateLanguageEnum.FR_FR ||
      this.value === TemplateLanguageEnum.DE_DE ||
      this.value === TemplateLanguageEnum.ES_ES ||
      this.value === TemplateLanguageEnum.PT_BR ||
      this.value === TemplateLanguageEnum.RU_RU;
  }

  /**
   * @method isRTL
   * @description 检查是否为从右到左的语言
   * @returns {boolean} 是否为RTL语言
   */
  isRTL(): boolean {
    return this.value === TemplateLanguageEnum.AR_SA;
  }

  /**
   * @method getLanguageCode
   * @description 获取语言代码
   * @returns {string} 语言代码
   */
  getLanguageCode(): string {
    const languageCodes: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: 'zh-CN',
      [TemplateLanguageEnum.ZH_TW]: 'zh-TW',
      [TemplateLanguageEnum.EN_US]: 'en-US',
      [TemplateLanguageEnum.EN_GB]: 'en-GB',
      [TemplateLanguageEnum.JA_JP]: 'ja-JP',
      [TemplateLanguageEnum.KO_KR]: 'ko-KR',
      [TemplateLanguageEnum.FR_FR]: 'fr-FR',
      [TemplateLanguageEnum.DE_DE]: 'de-DE',
      [TemplateLanguageEnum.ES_ES]: 'es-ES',
      [TemplateLanguageEnum.PT_BR]: 'pt-BR',
      [TemplateLanguageEnum.RU_RU]: 'ru-RU',
      [TemplateLanguageEnum.AR_SA]: 'ar-SA'
    };

    return languageCodes[this.value];
  }

  /**
   * @method getDisplayName
   * @description 获取语言的显示名称
   * @returns {string} 语言的显示名称
   */
  getDisplayName(): string {
    const displayNames: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: '简体中文',
      [TemplateLanguageEnum.ZH_TW]: '繁體中文',
      [TemplateLanguageEnum.EN_US]: 'English (US)',
      [TemplateLanguageEnum.EN_GB]: 'English (UK)',
      [TemplateLanguageEnum.JA_JP]: '日本語',
      [TemplateLanguageEnum.KO_KR]: '한국어',
      [TemplateLanguageEnum.FR_FR]: 'Français',
      [TemplateLanguageEnum.DE_DE]: 'Deutsch',
      [TemplateLanguageEnum.ES_ES]: 'Español',
      [TemplateLanguageEnum.PT_BR]: 'Português (Brasil)',
      [TemplateLanguageEnum.RU_RU]: 'Русский',
      [TemplateLanguageEnum.AR_SA]: 'العربية'
    };

    return displayNames[this.value];
  }

  /**
   * @method getNativeName
   * @description 获取语言的本地名称
   * @returns {string} 语言的本地名称
   */
  getNativeName(): string {
    const nativeNames: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: '简体中文',
      [TemplateLanguageEnum.ZH_TW]: '繁體中文',
      [TemplateLanguageEnum.EN_US]: 'English',
      [TemplateLanguageEnum.EN_GB]: 'English',
      [TemplateLanguageEnum.JA_JP]: '日本語',
      [TemplateLanguageEnum.KO_KR]: '한국어',
      [TemplateLanguageEnum.FR_FR]: 'Français',
      [TemplateLanguageEnum.DE_DE]: 'Deutsch',
      [TemplateLanguageEnum.ES_ES]: 'Español',
      [TemplateLanguageEnum.PT_BR]: 'Português',
      [TemplateLanguageEnum.RU_RU]: 'Русский',
      [TemplateLanguageEnum.AR_SA]: 'العربية'
    };

    return nativeNames[this.value];
  }

  /**
   * @method getLocale
   * @description 获取区域设置
   * @returns {string} 区域设置
   */
  getLocale(): string {
    return this.getLanguageCode();
  }

  /**
   * @method getDateFormat
   * @description 获取日期格式
   * @returns {string} 日期格式
   */
  getDateFormat(): string {
    const dateFormats: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: 'YYYY-MM-DD',
      [TemplateLanguageEnum.ZH_TW]: 'YYYY-MM-DD',
      [TemplateLanguageEnum.EN_US]: 'MM/DD/YYYY',
      [TemplateLanguageEnum.EN_GB]: 'DD/MM/YYYY',
      [TemplateLanguageEnum.JA_JP]: 'YYYY-MM-DD',
      [TemplateLanguageEnum.KO_KR]: 'YYYY-MM-DD',
      [TemplateLanguageEnum.FR_FR]: 'DD/MM/YYYY',
      [TemplateLanguageEnum.DE_DE]: 'DD.MM.YYYY',
      [TemplateLanguageEnum.ES_ES]: 'DD/MM/YYYY',
      [TemplateLanguageEnum.PT_BR]: 'DD/MM/YYYY',
      [TemplateLanguageEnum.RU_RU]: 'DD.MM.YYYY',
      [TemplateLanguageEnum.AR_SA]: 'DD/MM/YYYY'
    };

    return dateFormats[this.value];
  }

  /**
   * @method getTimeFormat
   * @description 获取时间格式
   * @returns {string} 时间格式
   */
  getTimeFormat(): string {
    const timeFormats: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: 'HH:mm',
      [TemplateLanguageEnum.ZH_TW]: 'HH:mm',
      [TemplateLanguageEnum.EN_US]: 'h:mm A',
      [TemplateLanguageEnum.EN_GB]: 'HH:mm',
      [TemplateLanguageEnum.JA_JP]: 'HH:mm',
      [TemplateLanguageEnum.KO_KR]: 'HH:mm',
      [TemplateLanguageEnum.FR_FR]: 'HH:mm',
      [TemplateLanguageEnum.DE_DE]: 'HH:mm',
      [TemplateLanguageEnum.ES_ES]: 'HH:mm',
      [TemplateLanguageEnum.PT_BR]: 'HH:mm',
      [TemplateLanguageEnum.RU_RU]: 'HH:mm',
      [TemplateLanguageEnum.AR_SA]: 'HH:mm'
    };

    return timeFormats[this.value];
  }

  /**
   * @method getCurrencyFormat
   * @description 获取货币格式
   * @returns {string} 货币格式
   */
  getCurrencyFormat(): string {
    const currencyFormats: Record<TemplateLanguageEnum, string> = {
      [TemplateLanguageEnum.ZH_CN]: '¥#,##0.00',
      [TemplateLanguageEnum.ZH_TW]: 'NT$#,##0.00',
      [TemplateLanguageEnum.EN_US]: '$#,##0.00',
      [TemplateLanguageEnum.EN_GB]: '£#,##0.00',
      [TemplateLanguageEnum.JA_JP]: '¥#,##0',
      [TemplateLanguageEnum.KO_KR]: '₩#,##0',
      [TemplateLanguageEnum.FR_FR]: '#,##0.00 €',
      [TemplateLanguageEnum.DE_DE]: '#,##0.00 €',
      [TemplateLanguageEnum.ES_ES]: '#,##0.00 €',
      [TemplateLanguageEnum.PT_BR]: 'R$ #,##0.00',
      [TemplateLanguageEnum.RU_RU]: '#,##0.00 ₽',
      [TemplateLanguageEnum.AR_SA]: '#,##0.00 ر.س'
    };

    return currencyFormats[this.value];
  }

  /**
   * @method getNumberFormat
   * @description 获取数字格式
   * @returns {object} 数字格式配置
   */
  getNumberFormat(): { decimal: string; thousands: string } {
    const numberFormats: Record<TemplateLanguageEnum, { decimal: string; thousands: string }> = {
      [TemplateLanguageEnum.ZH_CN]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.ZH_TW]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.EN_US]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.EN_GB]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.JA_JP]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.KO_KR]: { decimal: '.', thousands: ',' },
      [TemplateLanguageEnum.FR_FR]: { decimal: ',', thousands: ' ' },
      [TemplateLanguageEnum.DE_DE]: { decimal: ',', thousands: '.' },
      [TemplateLanguageEnum.ES_ES]: { decimal: ',', thousands: '.' },
      [TemplateLanguageEnum.PT_BR]: { decimal: ',', thousands: '.' },
      [TemplateLanguageEnum.RU_RU]: { decimal: ',', thousands: ' ' },
      [TemplateLanguageEnum.AR_SA]: { decimal: '.', thousands: ',' }
    };

    return numberFormats[this.value];
  }
}
