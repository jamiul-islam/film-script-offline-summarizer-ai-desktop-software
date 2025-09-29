import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../connection';
import { MigrationManager } from '../migrations';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => os.tmpdir()),
  },
}));

describe('MigrationManager', () => {
  let dbManager: DatabaseManager;
  let migrationManager: MigrationManager;
  let testDbPath: string;
  let testMigrationsPath: string;

  beforeEach(async () => {
    // Create temporary paths
    testDbPath = path.join(os.tmpdir(), `test-db-${Date.now()}.db`);
    testMigrationsPath = path.join(
      os.tmpdir(),
      `test-migrations-${Date.now()}`
    );

    // Create migrations directory
    fs.mkdirSync(testMigrationsPath, { recursive: true });

    // Initialize database and migration manager
    dbManager = new DatabaseManager(testDbPath);
    await dbManager.connect();
    migrationManager = new MigrationManager(dbManager, testMigrationsPath);
  });

  afterEach(async () => {
    // Clean up
    await dbManager.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testMigrationsPath)) {
      fs.rmSync(testMigrationsPath, { recursive: true, force: true });
    }
  });

  describe('migration execution', () => {
    it('should run migrations successfully', async () => {
      // Create test migration
      const migrationContent = `CREATE TABLE test_table (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- DOWN
DROP TABLE test_table;`;

      fs.writeFileSync(
        path.join(testMigrationsPath, '001_create_test_table.sql'),
        migrationContent
      );

      await migrationManager.runMigrations();

      // Check if table was created
      const db = dbManager.getConnection();
      const tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='test_table'
      `
        )
        .all();

      expect(tables).toHaveLength(1);

      // Check if migration was recorded
      const migrations = db
        .prepare('SELECT * FROM migrations WHERE version = ?')
        .get('001');
      expect(migrations).toBeDefined();
      expect(migrations.version).toBe('001');
    });

    it('should skip already applied migrations', async () => {
      // Create test migration
      const migrationContent = `
        CREATE TABLE test_table (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        );
      `;

      fs.writeFileSync(
        path.join(testMigrationsPath, '001_create_test_table.sql'),
        migrationContent
      );

      // Run migrations twice
      await migrationManager.runMigrations();
      await migrationManager.runMigrations();

      // Check that migration was only recorded once
      const db = dbManager.getConnection();
      const migrations = db
        .prepare('SELECT COUNT(*) as count FROM migrations WHERE version = ?')
        .get('001');
      expect(migrations.count).toBe(1);
    });

    it('should run multiple migrations in order', async () => {
      // Create multiple migrations
      fs.writeFileSync(
        path.join(testMigrationsPath, '001_create_users.sql'),
        'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);'
      );

      fs.writeFileSync(
        path.join(testMigrationsPath, '002_create_posts.sql'),
        'CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);'
      );

      fs.writeFileSync(
        path.join(testMigrationsPath, '003_add_index.sql'),
        'CREATE INDEX idx_posts_user_id ON posts(user_id);'
      );

      await migrationManager.runMigrations();

      // Check all migrations were applied
      const db = dbManager.getConnection();
      const migrationCount = db
        .prepare('SELECT COUNT(*) as count FROM migrations')
        .get();
      expect(migrationCount.count).toBe(3);

      // Check tables were created
      const tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'posts')
      `
        )
        .all();
      expect(tables).toHaveLength(2);
    });

    it('should handle migration errors', async () => {
      // Create invalid migration
      fs.writeFileSync(
        path.join(testMigrationsPath, '001_invalid.sql'),
        'INVALID SQL STATEMENT;'
      );

      await expect(migrationManager.runMigrations()).rejects.toThrow(
        'Migration failed'
      );
    });
  });

  describe('rollback functionality', () => {
    beforeEach(async () => {
      // Create test migrations with down scripts
      fs.writeFileSync(
        path.join(testMigrationsPath, '001_create_users.sql'),
        `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);

-- DOWN
DROP TABLE users;`
      );

      fs.writeFileSync(
        path.join(testMigrationsPath, '002_create_posts.sql'),
        `CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);

-- DOWN
DROP TABLE posts;`
      );

      // Apply migrations
      await migrationManager.runMigrations();
    });

    it('should rollback migrations', async () => {
      const db = dbManager.getConnection();

      // Verify tables exist
      let tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'posts')
      `
        )
        .all();
      expect(tables).toHaveLength(2);

      // Rollback to version 001
      await migrationManager.rollback('001');

      // Check that posts table was dropped but users remains
      tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'posts')
      `
        )
        .all();
      expect(tables).toHaveLength(1);
      expect(tables[0].name).toBe('users');

      // Check migration records
      const migrationCount = db
        .prepare('SELECT COUNT(*) as count FROM migrations')
        .get();
      expect(migrationCount.count).toBe(1);
    });

    it('should rollback all migrations when no target specified', async () => {
      const db = dbManager.getConnection();

      await migrationManager.rollback();

      // Check that all tables were dropped
      const tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('users', 'posts')
      `
        )
        .all();
      expect(tables).toHaveLength(0);

      // Check no migration records remain
      const migrationCount = db
        .prepare('SELECT COUNT(*) as count FROM migrations')
        .get();
      expect(migrationCount.count).toBe(0);
    });

    it('should handle rollback errors for migrations without down script', async () => {
      // Create migration without down script
      fs.writeFileSync(
        path.join(testMigrationsPath, '003_no_down.sql'),
        'CREATE TABLE no_down (id INTEGER PRIMARY KEY);'
      );

      await migrationManager.runMigrations();

      await expect(migrationManager.rollback()).rejects.toThrow(
        'Cannot rollback migration'
      );
    });
  });

  describe('migration status', () => {
    it('should return correct migration status', async () => {
      // Create migrations
      fs.writeFileSync(
        path.join(testMigrationsPath, '001_applied.sql'),
        'CREATE TABLE applied (id INTEGER PRIMARY KEY);'
      );

      fs.writeFileSync(
        path.join(testMigrationsPath, '002_pending.sql'),
        'CREATE TABLE pending (id INTEGER PRIMARY KEY);'
      );

      // Apply only first migration
      const db = dbManager.getConnection();
      db.exec('CREATE TABLE applied (id INTEGER PRIMARY KEY);');
      db.prepare('INSERT INTO migrations (version) VALUES (?)').run('001');

      const status = migrationManager.getStatus();

      expect(status.applied).toHaveLength(1);
      expect(status.applied[0].version).toBe('001');

      expect(status.pending).toHaveLength(1);
      expect(status.pending[0].version).toBe('002');
    });

    it('should handle empty migrations directory', async () => {
      const status = migrationManager.getStatus();

      expect(status.applied).toHaveLength(0);
      expect(status.pending).toHaveLength(0);
    });
  });

  describe('migration file parsing', () => {
    it('should parse migration files correctly', async () => {
      const migrationContent = `-- Create users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

CREATE INDEX idx_users_email ON users(email);

-- DOWN
DROP INDEX idx_users_email;
DROP TABLE users;`;

      fs.writeFileSync(
        path.join(testMigrationsPath, '001_create_users_table.sql'),
        migrationContent
      );

      const status = migrationManager.getStatus();
      const migration = status.pending[0];

      expect(migration.version).toBe('001');
      expect(migration.description).toBe('create users table');
      expect(migration.up).toContain('CREATE TABLE users');
      expect(migration.down).toBeDefined();
      expect(migration.down).toContain('DROP TABLE users');
    });

    it('should handle migrations without down script', async () => {
      fs.writeFileSync(
        path.join(testMigrationsPath, '001_no_down.sql'),
        'CREATE TABLE no_down (id INTEGER PRIMARY KEY);'
      );

      const status = migrationManager.getStatus();
      const migration = status.pending[0];

      expect(migration.version).toBe('001');
      expect(migration.up).toContain('CREATE TABLE no_down');
      expect(migration.down).toBeUndefined();
    });

    it('should ignore invalid migration files', async () => {
      // Create file with invalid name format
      fs.writeFileSync(
        path.join(testMigrationsPath, 'invalid_name.sql'),
        'CREATE TABLE invalid (id INTEGER PRIMARY KEY);'
      );

      const status = migrationManager.getStatus();
      expect(status.pending).toHaveLength(0);
    });
  });
});
