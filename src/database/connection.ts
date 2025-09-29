import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseConnection } from './types';

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    // Use provided path or default to app data directory
    this.dbPath = dbPath || this.getDefaultDatabasePath();
  }

  private getDefaultDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');
    
    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    return path.join(dbDir, 'script-summarizer.db');
  }

  public async connect(): Promise<DatabaseConnection> {
    try {
      if (this.db) {
        return this.db;
      }

      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Set WAL mode for better concurrent access
      this.db.pragma('journal_mode = WAL');
      
      // Initialize schema
      await this.initializeSchema();
      
      return this.db;
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      // Read schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Execute schema
      this.db.exec(schema);
      
      // Initialize migrations table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT UNIQUE NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
    } catch (error) {
      throw new Error(`Failed to initialize schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        throw new Error(`Failed to close database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  public isConnected(): boolean {
    return this.db !== null && this.db.open;
  }

  public getConnection(): Database.Database {
    if (!this.db || !this.db.open) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      
      // Simple query to test connection
      const result = this.db.prepare('SELECT 1 as test').get();
      return result && result.test === 1;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let dbManager: DatabaseManager | null = null;

export function getDatabaseManager(dbPath?: string): DatabaseManager {
  if (!dbManager) {
    dbManager = new DatabaseManager(dbPath);
  }
  return dbManager;
}

export async function initializeDatabase(dbPath?: string): Promise<DatabaseConnection> {
  const manager = getDatabaseManager(dbPath);
  return await manager.connect();
}