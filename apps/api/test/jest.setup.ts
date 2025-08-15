/**
 * @description Jest全局设置文件
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置超时时间
jest.setTimeout(30000);

// 全局测试设置
beforeAll(() => {
  console.log('Starting unit tests...');
});

afterAll(() => {
  console.log('Unit tests completed.');
});
