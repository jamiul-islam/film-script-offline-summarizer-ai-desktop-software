/**
 * Integration tests for database operations through IPC
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../../database/connection';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Database Integration Tests', () => {
  let dbManager: DatabaseManager;
  let tempDbPath: string;

  beforeEach(async () => {
    // Create temporary database for testing
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'script-summarizer-test-')
    );
    tempDbPath = path.join(tempDir, 'test.db');

    dbManager = new DatabaseManager(tempDbPath);
    await dbManager.connect();
  });

  afterEach(async () => {
    await dbManager.close();

    // Clean up temporary files
    try {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
      const tempDir = path.dirname(tempDbPath);
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Failed to clean up test database:', error);
    }
  });

  describe('Script Operations', () => {
    it('should save and retrieve a script', async () => {
      const scriptData = {
        title: 'Test Script',
        file_path: '/path/to/test-script.pdf',
        content_hash: 'abc123',
        word_count: 1500,
      };

      const savedScript = await dbManager.saveScript(scriptData);

      expect(savedScript.id).toBeDefined();
      expect(savedScript.title).toBe(scriptData.title);
      expect(savedScript.file_path).toBe(scriptData.file_path);
      expect(savedScript.content_hash).toBe(scriptData.content_hash);
      expect(savedScript.word_count).toBe(scriptData.word_count);
      expect(savedScript.created_at).toBeDefined();
      expect(savedScript.updated_at).toBeDefined();

      const retrievedScript = await dbManager.getScript(
        savedScript.id.toString()
      );
      expect(retrievedScript).toEqual(savedScript);
    });

    it('should update a script', async () => {
      const scriptData = {
        title: 'Original Title',
        file_path: '/path/to/script.pdf',
        content_hash: 'hash123',
        word_count: 1000,
      };

      const savedScript = await dbManager.saveScript(scriptData);

      const updates = {
        title: 'Updated Title',
        word_count: 1200,
      };

      const updatedScript = await dbManager.updateScript(
        savedScript.id.toString(),
        updates
      );

      expect(updatedScript.title).toBe('Updated Title');
      expect(updatedScript.word_count).toBe(1200);
      expect(updatedScript.file_path).toBe(scriptData.file_path); // Unchanged
    });

    it('should delete a script and its related data', async () => {
      const scriptData = {
        title: 'Script to Delete',
        file_path: '/path/to/delete.pdf',
        content_hash: 'delete123',
        word_count: 800,
      };

      const savedScript = await dbManager.saveScript(scriptData);

      // Add a summary
      const summaryData = {
        script_id: savedScript.id,
        plot_overview: 'Test plot',
        characters: JSON.stringify([]),
        themes: JSON.stringify([]),
        production_notes: JSON.stringify([]),
        genre: 'Drama',
        model_used: 'test-model',
      };

      await dbManager.saveSummary(summaryData);

      // Add an evaluation
      const evaluationData = {
        script_id: savedScript.id,
        rating: 4,
        notes: 'Good script',
        tags: JSON.stringify(['drama', 'indie']),
      };

      await dbManager.saveEvaluation(evaluationData);

      // Delete the script
      await dbManager.deleteScript(savedScript.id.toString());

      // Verify script is deleted
      const deletedScript = await dbManager.getScript(
        savedScript.id.toString()
      );
      expect(deletedScript).toBeNull();

      // Verify related data is deleted
      const deletedSummary = await dbManager.getSummaryByScriptId(
        savedScript.id.toString()
      );
      expect(deletedSummary).toBeNull();

      const deletedEvaluation = await dbManager.getEvaluationByScriptId(
        savedScript.id.toString()
      );
      expect(deletedEvaluation).toBeNull();
    });

    it('should search scripts by title and file path', async () => {
      const scripts = [
        {
          title: 'Action Movie Script',
          file_path: '/movies/action/hero.pdf',
          content_hash: 'action123',
          word_count: 2000,
        },
        {
          title: 'Drama Script',
          file_path: '/movies/drama/story.pdf',
          content_hash: 'drama123',
          word_count: 1800,
        },
        {
          title: 'Comedy Script',
          file_path: '/movies/comedy/funny.pdf',
          content_hash: 'comedy123',
          word_count: 1600,
        },
      ];

      // Save all scripts
      for (const script of scripts) {
        await dbManager.saveScript(script);
      }

      // Search by title
      const actionResults = await dbManager.searchScripts('Action');
      expect(actionResults).toHaveLength(1);
      expect(actionResults[0].title).toBe('Action Movie Script');

      // Search by file path
      const dramaResults = await dbManager.searchScripts('drama');
      expect(dramaResults).toHaveLength(1);
      expect(dramaResults[0].title).toBe('Drama Script');

      // Search with no results
      const noResults = await dbManager.searchScripts('nonexistent');
      expect(noResults).toHaveLength(0);
    });
  });

  describe('Summary Operations', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        title: 'Test Script for Summary',
        file_path: '/path/to/summary-test.pdf',
        content_hash: 'summary123',
        word_count: 1200,
      };

      testScript = await dbManager.saveScript(scriptData);
    });

    it('should save and retrieve a summary', async () => {
      const summaryData = {
        script_id: testScript.id,
        plot_overview: 'A compelling story about...',
        characters: JSON.stringify([
          { name: 'John', role: 'protagonist' },
          { name: 'Jane', role: 'antagonist' },
        ]),
        themes: JSON.stringify(['love', 'betrayal', 'redemption']),
        production_notes: JSON.stringify([
          { category: 'budget', note: 'Low budget production' },
        ]),
        genre: 'Thriller',
        model_used: 'llama2',
      };

      const savedSummary = await dbManager.saveSummary(summaryData);

      expect(savedSummary.id).toBeDefined();
      expect(savedSummary.script_id).toBe(testScript.id);
      expect(savedSummary.plot_overview).toBe(summaryData.plot_overview);
      expect(savedSummary.genre).toBe(summaryData.genre);
      expect(savedSummary.created_at).toBeDefined();

      const retrievedSummary = await dbManager.getSummaryByScriptId(
        testScript.id.toString()
      );
      expect(retrievedSummary).toEqual(savedSummary);
    });
  });

  describe('Evaluation Operations', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        title: 'Test Script for Evaluation',
        file_path: '/path/to/eval-test.pdf',
        content_hash: 'eval123',
        word_count: 1400,
      };

      testScript = await dbManager.saveScript(scriptData);
    });

    it('should save and retrieve an evaluation', async () => {
      const evaluationData = {
        script_id: testScript.id,
        rating: 5,
        notes: 'Excellent script with great potential',
        tags: JSON.stringify(['award-worthy', 'commercial', 'original']),
      };

      const savedEvaluation = await dbManager.saveEvaluation(evaluationData);

      expect(savedEvaluation.id).toBeDefined();
      expect(savedEvaluation.script_id).toBe(testScript.id);
      expect(savedEvaluation.rating).toBe(5);
      expect(savedEvaluation.notes).toBe(evaluationData.notes);
      expect(savedEvaluation.created_at).toBeDefined();

      const retrievedEvaluation = await dbManager.getEvaluationByScriptId(
        testScript.id.toString()
      );
      expect(retrievedEvaluation).toEqual(savedEvaluation);
    });

    it('should update existing evaluation instead of creating duplicate', async () => {
      const initialEvaluation = {
        script_id: testScript.id,
        rating: 3,
        notes: 'Initial thoughts',
        tags: JSON.stringify(['draft']),
      };

      const firstSave = await dbManager.saveEvaluation(initialEvaluation);

      const updatedEvaluation = {
        script_id: testScript.id,
        rating: 4,
        notes: 'Updated after second read',
        tags: JSON.stringify(['promising', 'needs-work']),
      };

      const secondSave = await dbManager.saveEvaluation(updatedEvaluation);

      // Should be the same ID (updated, not new)
      expect(secondSave.id).toBe(firstSave.id);
      expect(secondSave.rating).toBe(4);
      expect(secondSave.notes).toBe('Updated after second read');

      // Verify only one evaluation exists
      const retrieved = await dbManager.getEvaluationByScriptId(
        testScript.id.toString()
      );
      expect(retrieved?.rating).toBe(4);
    });
  });

  describe('Database Health and Connection', () => {
    it('should perform health check successfully', async () => {
      const isHealthy = await dbManager.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should report connection status correctly', () => {
      expect(dbManager.isConnected()).toBe(true);
    });

    it('should handle connection after close', async () => {
      await dbManager.close();
      expect(dbManager.isConnected()).toBe(false);

      const isHealthy = await dbManager.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});
