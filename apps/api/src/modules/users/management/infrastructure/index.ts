/**
 * @file infrastructure/index.ts
 * @description 用户管理基础设施层索引文件
 * 
 * 导出内容：
 * - PostgreSQL实现（默认）
 * - MongoDB实现（未来扩展）
 */

// PostgreSQL实现（默认）
export * from './postgresql/entities/user.entity';
export * from './postgresql/mappers/user.mapper';
export * from './postgresql/repositories/user.repository';

// MongoDB实现（未来扩展）
// export * from './mongodb/entities/user.entity';
// export * from './mongodb/mappers/user.mapper';
// export * from './mongodb/repositories/user.repository';
