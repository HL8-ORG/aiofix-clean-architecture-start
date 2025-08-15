/**
 * @description
 * E2E测试的Jest设置文件
 * 
 * 用于配置测试环境、全局变量和测试工具
 */

// 设置测试超时时间
jest.setTimeout(60000);

// 全局测试配置
beforeAll(async () => {
  // 测试开始前的全局设置
  console.log('Starting E2E tests...');
});

afterAll(async () => {
  // 测试结束后的全局清理
  console.log('E2E tests completed.');
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
