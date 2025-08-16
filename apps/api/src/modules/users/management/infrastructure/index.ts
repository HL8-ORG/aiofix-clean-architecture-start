/**
 * @file infrastructure/index.ts
 * @description 用户管理基础设施层索引文件
 * 
 * 导出内容：
 * - PostgreSQL实现（默认）
 * - MongoDB实现（未来扩展）
 */

// PostgreSQL 适配器
export * from './postgresql/entities/user.entity';
export * from './postgresql/mappers/user.mapper';
export * from './postgresql/repositories/user.repository';

// 数据库适配器
export * from './database/database-adapter.factory';
export * from './database/database.config';
