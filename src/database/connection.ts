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
      throw new Error(
        `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      throw new Error(
        `Failed to initialize schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        throw new Error(
          `Failed to close database: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
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

  // CRUD operations for scripts
  public async saveScript(scriptData: Omit<DatabaseScript, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseScript> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO scripts (title, file_path, content_hash, word_count)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        scriptData.title,
        scriptData.file_path,
        scriptData.content_hash,
        scriptData.word_count
      );

      // Get the inserted record
      const getStmt = this.db.prepare('SELECT * FROM scripts WHERE id = ?');
      const script = getStmt.get(result.lastInsertRowid) as DatabaseScript;

      return script;
    } catch (error) {
      throw new Error(`Failed to save script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getScript(scriptId: string): Promise<DatabaseScript | null> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM scripts WHERE id = ?');
      const script = stmt.get(parseInt(scriptId)) as DatabaseScript | undefined;
      return script || null;
    } catch (error) {
      throw new Error(`Failed to get script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getAllScripts(): Promise<DatabaseScript[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM scripts ORDER BY created_at DESC');
      return stmt.all() as DatabaseScript[];
    } catch (error) {
      throw new Error(`Failed to get all scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async updateScript(scriptId: string, updates: Partial<DatabaseScript>): Promise<DatabaseScript> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const allowedFields = ['title', 'file_path', 'content_hash', 'word_count'];
      const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = updateFields.map(field => `${field} = ?`).join(', ');
      const values = updateFields.map(field => updates[field as keyof DatabaseScript]);
      values.push(parseInt(scriptId));

      const stmt = this.db.prepare(`
        UPDATE scripts 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      stmt.run(...values);

      // Return updated record
      return await this.getScript(scriptId) as DatabaseScript;
    } catch (error) {
      throw new Error(`Failed to update script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async deleteScript(scriptId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const transaction = this.db.transaction(() => {
        // Delete related summaries and evaluations first
        this.db!.prepare('DELETE FROM summaries WHERE script_id = ?').run(parseInt(scriptId));
        this.db!.prepare('DELETE FROM script_evaluations WHERE script_id = ?').run(parseInt(scriptId));
        
        // Delete the script
        this.db?.prepare('DELETE FROM scripts WHERE id = ?').run(parseInt(scriptId));
      });

      transaction();
    } catch (error) {
      throw new Error(`Failed to delete script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // CRUD operations for summaries
  public async saveSummary(summaryData: Omit<DatabaseSummary, 'id' | 'created_at'>): Promise<DatabaseSummary> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO summaries (script_id, plot_overview, characters, themes, production_notes, genre, model_used)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        summaryData.script_id,
        summaryData.plot_overview,
        summaryData.characters,
        summaryData.themes,
        summaryData.production_notes,
        summaryData.genre,
        summaryData.model_used
      );

      // Get the inserted record
      const getStmt = this.db.prepare('SELECT * FROM summaries WHERE id = ?');
      const summary = getStmt.get(result.lastInsertRowid) as DatabaseSummary;

      return summary;
    } catch (error) {
      throw new Error(`Failed to save summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getSummaryByScriptId(scriptId: string): Promise<DatabaseSummary | null> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM summaries WHERE script_id = ? ORDER BY created_at DESC LIMIT 1');
      const summary = stmt.get(parseInt(scriptId)) as DatabaseSummary | undefined;
      return summary || null;
    } catch (error) {
      throw new Error(`Failed to get summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // CRUD operations for evaluations
  public async saveEvaluation(evaluationData: Omit<DatabaseScriptEvaluation, 'id' | 'created_at'>): Promise<DatabaseScriptEvaluation> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      // Check if evaluation already exists for this script
      const existingStmt = this.db.prepare('SELECT id FROM script_evaluations WHERE script_id = ?');
      const existing = existingStmt.get(evaluationData.script_id);

      let result;
      if (existing) {
        // Update existing evaluation
        const updateStmt = this.db.prepare(`
          UPDATE script_evaluations 
          SET rating = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
          WHERE script_id = ?
        `);
        updateStmt.run(
          evaluationData.rating,
          evaluationData.notes,
          evaluationData.tags,
          evaluationData.script_id
        );
        result = { lastInsertRowid: existing.id };
      } else {
        // Insert new evaluation
        const insertStmt = this.db.prepare(`
          INSERT INTO script_evaluations (script_id, rating, notes, tags)
          VALUES (?, ?, ?, ?)
        `);
        result = insertStmt.run(
          evaluationData.script_id,
          evaluationData.rating,
          evaluationData.notes,
          evaluationData.tags
        );
      }

      // Get the record
      const getStmt = this.db.prepare('SELECT * FROM script_evaluations WHERE id = ?');
      const evaluation = getStmt.get(result.lastInsertRowid) as DatabaseScriptEvaluation;

      return evaluation;
    } catch (error) {
      throw new Error(`Failed to save evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getEvaluationByScriptId(scriptId: string): Promise<DatabaseScriptEvaluation | null> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM script_evaluations WHERE script_id = ?');
      const evaluation = stmt.get(parseInt(scriptId)) as DatabaseScriptEvaluation | undefined;
      return evaluation || null;
    } catch (error) {
      throw new Error(`Failed to get evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search functionality
  public async searchScripts(query: string): Promise<DatabaseScript[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM scripts 
        WHERE title LIKE ? OR file_path LIKE ?
        ORDER BY created_at DESC
      `);
      const searchTerm = `%${query}%`;
      return stmt.all(searchTerm, searchTerm) as DatabaseScript[];
    } catch (error) {
      throw new Error(`Failed to search scripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export async function initializeDatabase(
  dbPath?: string
): Promise<DatabaseConnection> {
  const manager = getDatabaseManager(dbPath);
  return await manager.connect();
}