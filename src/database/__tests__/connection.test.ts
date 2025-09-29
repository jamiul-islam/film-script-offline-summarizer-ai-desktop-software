import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../connection';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => os.tmpdir())
  }
}));

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(() => {
    // Create a temporary database path for testing
    testDbPath = path.join(os.tmpdir(), `test-db-${Date.now()}.db`);
    dbManager = new DatabaseManager(testDbPath);
  });

  afterEach(async () => {
    // Clean up
    await dbManager.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('connection management', () => {
    it('should connect to database successfully', async () => {
      const connection = await dbManager.connect();
      expect(connection).toBeDefined();
      expect(dbManager.isConnected()).toBe(true);
    });

    it('should return same connection on multiple connect calls', async () => {
      const connection1 = await dbManager.connect();
      const connection2 = await dbManager.connect();
      expect(connection1).toBe(connection2);
    });

    it('should close database connection', async () => {
      await dbManager.connect();
      expect(dbManager.isConnected()).toBe(true);
      
      await dbManager.close();
      expect(dbManager.isConnected()).toBe(false);
    });

    it('should handle connection errors gracefully', async () => {
      // Create a database manager with invalid path
      const invalidDbManager = new DatabaseManager('/invalid/path/db.sqlite');
      
      await expect(invalidDbManager.connect()).rejects.toThrow('Failed to connect to database');
    });
  });

  describe('schema initialization', () => {
    it('should create tables on connection', async () => {
      await dbManager.connect();
      const db = dbManager.getConnection();
      
      // Check if tables exist
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('scripts', 'summaries', 'script_evaluations', 'migrations')
      `).all();
      
      expect(tables).toHaveLength(4);
      expect(tables.map(t => t.name)).toContain('scripts');
      expect(tables.map(t => t.name)).toContain('summaries');
      expect(tables.map(t => t.name)).toContain('script_evaluations');
      expect(tables.map(t => t.name)).toContain('migrations');
    });

    it('should create indexes', async () => {
      await dbManager.connect();
      const db = dbManager.getConnection();
      
      // Check if indexes exist
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
      `).all();
      
      expect(indexes.length).toBeGreaterThan(0);
      expect(indexes.map(i => i.name)).toContain('idx_scripts_content_hash');
    });

    it('should enable foreign keys', async () => {
      await dbManager.connect();
      const db = dbManager.getConnection();
      
      const result = db.prepare('PRAGMA foreign_keys').get();
      expect(result.foreign_keys).toBe(1);
    });
  });

  describe('health check', () => {
    it('should return true for healthy connection', async () => {
      await dbManager.connect();
      const isHealthy = await dbManager.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false for disconnected database', async () => {
      const isHealthy = await dbManager.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false after closing connection', async () => {
      await dbManager.connect();
      await dbManager.close();
      const isHealthy = await dbManager.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when getting connection without connecting', () => {
      expect(() => dbManager.getConnection()).toThrow('Database not connected');
    });

    it('should handle close errors gracefully', async () => {
      await dbManager.connect();
      
      // Force close the underlying database
      const db = dbManager.getConnection();
      db.close();
      
      // Should not throw when closing again
      await expect(dbManager.close()).resolves.not.toThrow();
    });
  });

  describe('database operations', () => {
    beforeEach(async () => {
      await dbManager.connect();
    });

    it('should insert and retrieve data from scripts table', async () => {
      const db = dbManager.getConnection();
      
      const insertScript = db.prepare(`
        INSERT INTO scripts (title, file_path, content_hash, word_count)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = insertScript.run('Test Script', '/path/to/script.pdf', 'hash123', 1000);
      expect(result.lastInsertRowid).toBeDefined();
      
      const selectScript = db.prepare('SELECT * FROM scripts WHERE id = ?');
      const script = selectScript.get(result.lastInsertRowid);
      
      expect(script).toBeDefined();
      expect(script.title).toBe('Test Script');
      expect(script.file_path).toBe('/path/to/script.pdf');
      expect(script.content_hash).toBe('hash123');
      expect(script.word_count).toBe(1000);
    });

    it('should enforce foreign key constraints', async () => {
      const db = dbManager.getConnection();
      
      // Try to insert summary with non-existent script_id
      const insertSummary = db.prepare(`
        INSERT INTO summaries (script_id, plot_overview)
        VALUES (?, ?)
      `);
      
      expect(() => insertSummary.run(999, 'Test plot')).toThrow();
    });

    it('should cascade delete related records', async () => {
      const db = dbManager.getConnection();
      
      // Insert script
      const insertScript = db.prepare(`
        INSERT INTO scripts (title, file_path, content_hash)
        VALUES (?, ?, ?)
      `);
      const scriptResult = insertScript.run('Test Script', '/path/to/script.pdf', 'hash123');
      const scriptId = scriptResult.lastInsertRowid;
      
      // Insert summary
      const insertSummary = db.prepare(`
        INSERT INTO summaries (script_id, plot_overview)
        VALUES (?, ?)
      `);
      insertSummary.run(scriptId, 'Test plot');
      
      // Insert evaluation
      const insertEvaluation = db.prepare(`
        INSERT INTO script_evaluations (script_id, rating)
        VALUES (?, ?)
      `);
      insertEvaluation.run(scriptId, 5);
      
      // Delete script
      const deleteScript = db.prepare('DELETE FROM scripts WHERE id = ?');
      deleteScript.run(scriptId);
      
      // Check that related records are deleted
      const summaryCount = db.prepare('SELECT COUNT(*) as count FROM summaries WHERE script_id = ?').get(scriptId);
      const evaluationCount = db.prepare('SELECT COUNT(*) as count FROM script_evaluations WHERE script_id = ?').get(scriptId);
      
      expect(summaryCount.count).toBe(0);
      expect(evaluationCount.count).toBe(0);
    });
  });
});