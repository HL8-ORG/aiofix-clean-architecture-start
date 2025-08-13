import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * @class AppController
 * @description
 * 应用的主控制器，负责处理HTTP请求和响应。
 * 
 * 主要功能：
 * 1. 定义API路由和端点
 * 2. 处理HTTP请求
 * 3. 调用相应的服务方法
 * 4. 返回HTTP响应
 * 
 * 路由说明：
 * - GET /: 返回欢迎信息
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * @method getHello
   * @description
   * 处理根路径的GET请求，返回欢迎信息。
   * 
   * @returns {string} 返回欢迎字符串
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
