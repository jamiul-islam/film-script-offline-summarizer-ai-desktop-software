export { DatabaseManager, getDatabaseManager, initializeDatabase } from './connection';
export { MigrationManager } from './migrations';
export type {
  DatabaseScript,
  DatabaseSummary,
  DatabaseScriptEvaluation,
  DatabaseConnection,
  MigrationRecord
} from './types';
export type { Migration } from './migrations';