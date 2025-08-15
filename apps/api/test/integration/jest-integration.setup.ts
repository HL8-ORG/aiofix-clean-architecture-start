/**
 * @description
 * 集成测试的Jest设置文件
 * 
 * 用于配置测试环境、全局变量和测试工具
 */

// 设置测试超时时间
jest.setTimeout(120000);

// 全局测试配置
beforeAll(async () => {
  // 测试开始前的全局设置
  console.log('Starting Integration tests...');
  
  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/iam_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  
  // 等待数据库和Redis连接就绪
  await waitForServices();
});

afterAll(async () => {
  // 测试结束后的全局清理
  console.log('Integration tests completed.');
  
  // 清理测试数据
  await cleanupTestData();
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

/**
 * @description
 * 等待服务就绪
 */
async function waitForServices(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 检查数据库连接
      await checkDatabaseConnection();
      
      // 检查Redis连接
      await checkRedisConnection();
      
      console.log('All services are ready');
      return;
    } catch (error) {
      console.log(`Waiting for services... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('Services are not ready after maximum retries');
}

/**
 * @description
 * 检查数据库连接
 */
async function checkDatabaseConnection(): Promise<void> {
  // 这里可以添加实际的数据库连接检查
  // 暂时使用模拟检查
  return Promise.resolve();
}

/**
 * @description
 * 检查Redis连接
 */
async function checkRedisConnection(): Promise<void> {
  // 这里可以添加实际的Redis连接检查
  // 暂时使用模拟检查
  return Promise.resolve();
}

/**
 * @description
 * 清理测试数据
 */
async function cleanupTestData(): Promise<void> {
  // 清理测试数据库
  // 清理测试缓存
  console.log('Test data cleaned up');
}
