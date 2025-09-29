/**
 * Unit tests for base file processor validation
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseFileProcessor } from '../base-processor';
import { ParsedScript, ValidationResult } from '../../../types/file-processing';
import { FileType } from '../../../types/script';

// Mock implementation for testing
class TestFileProcessor extends BaseFileProcessor {
  constructor() {
    super(['.txt', '.test'], 1024 * 1024); // 1MB for testing
  }

  async parseFile(filePath: string, fileType: FileType): Promise<ParsedScript> {
    const content = await fs.readFile(filePath, 'utf-8');
    const title = path.basename(filePath, path.extname(filePath));
    const metadata = this.createScriptMetadata(title, content, content.length);
    
    return {
      content,
      title,
      metadata,
      confidence: 1.0
    };
  }
}

describe('BaseFileProcessor', () => {
  let processor: TestFileProcessor;
  let tempDir: string;

  beforeEach(async () => {
    processor = new TestFileProcessor();
    tempDir = await fs.mkdtemp(path.join(__dirname, 'temp-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateFile', () => {
    it('should validate a normal file successfully', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'This is a test file with some content.');

      const result = await processor.validateFile(testFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.detectedFileType).toBe('txt');
      expect(result.isReadable).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should detect file not found error', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      const result = await processor.validateFile(nonExistentFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('FILE_NOT_FOUND');
      expect(result.isReadable).toBe(false);
    });

    it('should detect empty file error', async () => {
      const emptyFile = path.join(tempDir, 'empty.txt');
      await fs.writeFile(emptyFile, '');

      const result = await processor.validateFile(emptyFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EMPTY_FILE');
      expect(result.fileSize).toBe(0);
    });

    it('should detect file too large error', async () => {
      const largeFile = path.join(tempDir, 'large.txt');
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB, exceeds 1MB limit
      await fs.writeFile(largeFile, largeContent);

      const result = await processor.validateFile(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
      expect(result.fileSize).toBeGreaterThan(1024 * 1024);
    });

    it('should detect unsupported format error', async () => {
      const unsupportedFile = path.join(tempDir, 'test.xyz');
      await fs.writeFile(unsupportedFile, 'Some content');

      const result = await processor.validateFile(unsupportedFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNSUPPORTED_FORMAT');
      expect(result.detectedFileType).toBeUndefined();
    });

    it('should warn about large files', async () => {
      // Create a processor with smaller max size to test warning threshold
      const testProcessor = new TestFileProcessor();
      // Override maxFileSize to 20MB for this test
      (testProcessor as any).maxFileSize = 20 * 1024 * 1024;
      
      const largeFile = path.join(tempDir, 'large.txt');
      const largeContent = 'x'.repeat(15 * 1024 * 1024); // 15MB, should trigger warning but not error
      await fs.writeFile(largeFile, largeContent);

      const result = await testProcessor.validateFile(largeFile);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('LARGE_FILE_SIZE');
    });

    it('should handle directory instead of file', async () => {
      const testDir = path.join(tempDir, 'testdir');
      await fs.mkdir(testDir);

      const result = await processor.validateFile(testDir);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return supported extensions', () => {
      const extensions = processor.getSupportedExtensions();
      expect(extensions).toEqual(['.txt', '.test']);
    });

    it('should return a copy of the extensions array', () => {
      const extensions1 = processor.getSupportedExtensions();
      const extensions2 = processor.getSupportedExtensions();
      
      expect(extensions1).toEqual(extensions2);
      expect(extensions1).not.toBe(extensions2); // Different array instances
    });
  });

  describe('isSupported', () => {
    it('should return true for supported extensions', () => {
      expect(processor.isSupported('.txt')).toBe(true);
      expect(processor.isSupported('txt')).toBe(true);
      expect(processor.isSupported('.test')).toBe(true);
      expect(processor.isSupported('test')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(processor.isSupported('.pdf')).toBe(false);
      expect(processor.isSupported('xyz')).toBe(false);
      expect(processor.isSupported('.unknown')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(processor.isSupported('.TXT')).toBe(true);
      expect(processor.isSupported('TXT')).toBe(true);
      expect(processor.isSupported('.Test')).toBe(true);
    });
  });

  describe('detectFileType', () => {
    it('should detect file types correctly', () => {
      expect(processor['detectFileType']('.pdf')).toBe('pdf');
      expect(processor['detectFileType']('.docx')).toBe('docx');
      expect(processor['detectFileType']('.doc')).toBe('docx');
      expect(processor['detectFileType']('.txt')).toBe('txt');
      expect(processor['detectFileType']('.text')).toBe('txt');
    });

    it('should return undefined for unknown extensions', () => {
      expect(processor['detectFileType']('.xyz')).toBeUndefined();
      expect(processor['detectFileType']('.unknown')).toBeUndefined();
    });

    it('should be case insensitive', () => {
      expect(processor['detectFileType']('.PDF')).toBe('pdf');
      expect(processor['detectFileType']('.DOCX')).toBe('docx');
      expect(processor['detectFileType']('.TXT')).toBe('txt');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(processor['formatFileSize'](100)).toBe('100.0 B');
      expect(processor['formatFileSize'](1024)).toBe('1.0 KB');
      expect(processor['formatFileSize'](1024 * 1024)).toBe('1.0 MB');
      expect(processor['formatFileSize'](1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(processor['formatFileSize'](1536)).toBe('1.5 KB');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(processor['countWords']('Hello world')).toBe(2);
      expect(processor['countWords']('  Hello   world  ')).toBe(2);
      expect(processor['countWords']('')).toBe(0);
      expect(processor['countWords']('   ')).toBe(0);
      expect(processor['countWords']('Single')).toBe(1);
      expect(processor['countWords']('One two three four five')).toBe(5);
    });

    it('should handle different whitespace characters', () => {
      expect(processor['countWords']('Hello\tworld\ntest')).toBe(3);
      expect(processor['countWords']('Hello\r\nworld')).toBe(2);
    });
  });

  describe('extractTitleFromContent', () => {
    it('should extract title from first line', () => {
      const content = 'My Script Title\n\nThis is the content of the script...';
      const title = processor['extractTitleFromContent'](content, 'fallback');
      expect(title).toBe('My Script Title');
    });

    it('should use fallback for empty content', () => {
      const title = processor['extractTitleFromContent']('', 'fallback');
      expect(title).toBe('fallback');
    });

    it('should use fallback for very long first line', () => {
      const longLine = 'x'.repeat(150);
      const content = `${longLine}\n\nContent...`;
      const title = processor['extractTitleFromContent'](content, 'fallback');
      expect(title).toBe('fallback');
    });

    it('should use fallback for first line with periods', () => {
      const content = 'This is a sentence with periods.\n\nContent...';
      const title = processor['extractTitleFromContent'](content, 'fallback');
      expect(title).toBe('fallback');
    });
  });

  describe('createScriptMetadata', () => {
    it('should create metadata correctly', () => {
      const content = 'Hello world test content';
      const metadata = processor['createScriptMetadata']('Test Title', content, 1000);

      expect(metadata.title).toBe('Test Title');
      expect(metadata.wordCount).toBe(4);
      expect(metadata.characterCount).toBe(content.length);
      expect(metadata.fileSize).toBe(1000);
    });

    it('should include additional metadata', () => {
      const content = 'Test content';
      const additional = { author: 'Test Author', pages: 10 };
      const metadata = processor['createScriptMetadata']('Test', content, 100, additional);

      expect(metadata.additionalMetadata).toEqual(additional);
    });
  });

  describe('validateFileContent', () => {
    it('should warn about low text content', async () => {
      const warnings = await processor['validateFileContent']('Short');
      
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('LOW_TEXT_CONTENT');
    });

    it('should warn about encoding issues', async () => {
      const contentWithReplacementChar = 'Hello � world - this content is long enough to avoid low content warning';
      const warnings = await processor['validateFileContent'](contentWithReplacementChar);
      
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('POTENTIAL_ENCODING_ISSUE');
    });

    it('should return no warnings for good content', async () => {
      const goodContent = 'This is a good piece of content with sufficient length and no encoding issues.';
      const warnings = await processor['validateFileContent'](goodContent);
      
      expect(warnings).toHaveLength(0);
    });

    it('should detect multiple issues', async () => {
      const problematicContent = 'Short �';
      const warnings = await processor['validateFileContent'](problematicContent);
      
      expect(warnings).toHaveLength(2);
      expect(warnings.map(w => w.code)).toContain('LOW_TEXT_CONTENT');
      expect(warnings.map(w => w.code)).toContain('POTENTIAL_ENCODING_ISSUE');
    });
  });

  describe('parseFile integration', () => {
    it('should parse a valid file', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      const content = 'This is a test script content with multiple words.';
      await fs.writeFile(testFile, content);

      const result = await processor.parseFile(testFile, 'txt');

      expect(result.content).toBe(content);
      expect(result.title).toBe('test');
      expect(result.metadata.wordCount).toBe(9);
      expect(result.metadata.characterCount).toBe(content.length);
      expect(result.confidence).toBe(1.0);
    });
  });
});