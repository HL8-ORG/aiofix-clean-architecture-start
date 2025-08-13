import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @describe AppController (e2e)
 * @description
 * 应用控制器的端到端测试套件。该测试套件验证应用的基本功能，
 * 包括HTTP请求处理和响应。
 * 
 * 主要测试内容：
 * 1. 验证根路径GET请求返回正确的状态码和响应内容
 * 2. 确保Fastify平台与NestJS的集成正常工作
 */
describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // 创建基于Fastify的测试应用实例
    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
