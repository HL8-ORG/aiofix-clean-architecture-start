import { Injectable } from '@nestjs/common';

/**
 * @class AppService
 * @description
 * 应用的核心服务类，负责处理业务逻辑。
 * 
 * 主要功能：
 * 1. 封装业务逻辑
 * 2. 提供可重用的服务方法
 * 3. 处理数据转换和验证
 * 4. 与外部服务交互
 * 
 * 设计原则：
 * - 单一职责：每个方法只负责一个特定的业务功能
 * - 可测试性：业务逻辑与框架解耦，便于单元测试
 * - 可重用性：服务方法可以在多个控制器中复用
 */
@Injectable()
export class AppService {
  /**
   * @method getHello
   * @description
   * 获取欢迎信息的方法。
   * 
   * 该方法返回一个简单的欢迎字符串，通常用于：
   * 1. 健康检查端点
   * 2. API可用性验证
   * 3. 开发环境的基础测试
   * 
   * @returns {string} 返回欢迎字符串 "Hello World!"
   */
  getHello(): string {
    return 'Hello World!';
  }
}
