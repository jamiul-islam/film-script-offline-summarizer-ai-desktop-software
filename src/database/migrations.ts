import { DatabaseManager } from './connection';
import { MigrationRecord } from './types';
import fs from 'fs';
import path from 'path';

export interface Migration {
  version: string;
  description: string;
  up: string;
  down?: string;
}

export class MigrationManager {
  private dbManager: DatabaseManager;
  private migrationsPath: string;

  constructor(dbManager: DatabaseManager, migrationsPath?: string) {
    this.dbManager = dbManager;
    this.migrationsPath = migrationsPath || path.join(__dirname, 'migrations');
  }

  public async runMigrations(): Promise<void> {
    const db = this.dbManager.getConnection();

    try {
      // Get applied migrations
      const appliedMigrations = this.getAppliedMigrations();
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));

      // Get available migrations
      const availableMigrations = this.getAvailableMigrations();

      // Filter out already applied migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedVersions.has(migration.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      // Sort migrations by version
      pendingMigrations.sort((a, b) => a.version.localeCompare(b.version));

      // Run migrations in transaction
      const runMigrations = db.transaction(() => {
        for (const migration of pendingMigrations) {
          console.log(
            `Running migration: ${migration.version} - ${migration.description}`
          );

          // Execute migration
          db.exec(migration.up);

          // Record migration
          const insertMigration = db.prepare(`
            INSERT INTO migrations (version) VALUES (?)
          `);
          insertMigration.run(migration.version);

          console.log(`Migration ${migration.version} completed`);
        }
      });

      runMigrations();
    } catch (error) {
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getAppliedMigrations(): MigrationRecord[] {
    const db = this.dbManager.getConnection();

    try {
      const stmt = db.prepare('SELECT * FROM migrations ORDER BY version');
      return stmt.all() as MigrationRecord[];
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      return [];
    }
  }

  private getAvailableMigrations(): Migration[] {
    const migrations: Migration[] = [];

    // Check if migrations directory exists
    if (!fs.existsSync(this.migrationsPath)) {
      return migrations;
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Parse migration file
      const migration = this.parseMigrationFile(file, content);
      if (migration) {
        migrations.push(migration);
      }
    }

    return migrations;
  }

  private parseMigrationFile(
    filename: string,
    content: string
  ): Migration | null {
    try {
      // Extract version from filename (e.g., "001_initial_schema.sql" -> "001")
      const versionMatch = filename.match(/^(\d+)_/);
      if (!versionMatch) {
        console.warn(`Invalid migration filename format: ${filename}`);
        return null;
      }

      const version = versionMatch[1];

      // Extract description from filename
      const description = filename
        .replace(/^\d+_/, '')
        .replace(/\.sql$/, '')
        .replace(/_/g, ' ');

      // Split content by -- DOWN marker if present
      const parts = content.split(/^-- DOWN$/m);
      const up = parts[0].trim();
      const down = parts[1]?.trim() || undefined;

      return {
        version,
        description,
        up,
        down,
      };
    } catch (error) {
      console.error(`Error parsing migration file ${filename}:`, error);
      return null;
    }
  }

  public async rollback(targetVersion?: string): Promise<void> {
    const db = this.dbManager.getConnection();

    try {
      const appliedMigrations = this.getAppliedMigrations().sort((a, b) =>
        b.version.localeCompare(a.version)
      ); // Reverse order for rollback

      const availableMigrations = this.getAvailableMigrations();
      const migrationMap = new Map(
        availableMigrations.map(m => [m.version, m])
      );

      const rollbackMigrations = db.transaction(() => {
        for (const appliedMigration of appliedMigrations) {
          if (targetVersion && appliedMigration.version <= targetVersion) {
            break;
          }

          const migration = migrationMap.get(appliedMigration.version);
          if (!migration || !migration.down) {
            throw new Error(
              `Cannot rollback migration ${appliedMigration.version}: no down migration found`
            );
          }

          console.log(
            `Rolling back migration: ${migration.version} - ${migration.description}`
          );

          // Execute rollback
          db.exec(migration.down);

          // Remove migration record
          const deleteMigration = db.prepare(`
            DELETE FROM migrations WHERE version = ?
          `);
          deleteMigration.run(migration.version);

          console.log(`Migration ${migration.version} rolled back`);
        }
      });

      rollbackMigrations();
    } catch (error) {
      throw new Error(
        `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public getStatus(): { applied: MigrationRecord[]; pending: Migration[] } {
    const applied = this.getAppliedMigrations();
    const available = this.getAvailableMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));

    const pending = available.filter(m => !appliedVersions.has(m.version));

    return { applied, pending };
  }
}
