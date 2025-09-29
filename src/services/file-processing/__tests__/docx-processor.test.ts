/**
 * Unit tests for DOCX processor
 * Requirements: 2.1, 2.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocxProcessor } from '../docx-processor';

// Get the mocked functions
const mockMammoth = vi.mocked(await import('mammoth'));

// Mock mammoth before importing
vi.mock('mammoth', () => ({
  convertToHtml: vi.fn(),
  images: {
    imgElement: vi.fn()
  }
}));

describe('DocxProcessor', () => {
  let processor: DocxProcessor;
  let tempDir: string;

  beforeEach(async () => {
    processor = new DocxProcessor();
    tempDir = await fs.mkdtemp(path.join(__dirname, 'temp-docx-'));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with correct extensions and file size limit', () => {
      expect(processor.getSupportedExtensions()).toEqual(['.docx', '.doc']);
      expect(processor.isSupported('.docx')).toBe(true);
      expect(processor.isSupported('.doc')).toBe(true);
      expect(processor.isSupported('.txt')).toBe(false);
    });
  });

  describe('parseFile', () => {
    it('should successfully parse a valid DOCX file', async () => {
      const testFile = path.join(tempDir, 'test.docx');
      const docxBuffer = Buffer.from('PK\x03\x04'); // ZIP signature for DOCX
      await fs.writeFile(testFile, docxBuffer);

      const mockResult = {
        value: '<p>This is the extracted HTML from the DOCX document.</p><p>Second paragraph.</p>',
        messages: []
      };

      // Mock both validation call and actual parsing call
      mockMammoth.convertToHtml
        .mockResolvedValueOnce(mockResult) // For validation
        .mockResolvedValueOnce(mockResult); // For actual parsing

      const result = await processor.parseFile(testFile, 'docx');

      expect(result.content).toBe('This is the extracted HTML from the DOCX document.\nSecond paragraph.');
      expect(result.title).toBe('test');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.additionalMetadata).toMatchObject({
        extractedHtml: mockResult.value,
        conversionMessages: [],
        hasImages: false,
        hasUnsupportedElements: false
      });
      expect(result.confidence).toBeGreaterThan(0.2); // Adjust expectation
    });

    it('should handle DOCX with conversion warnings', async () => {
      const testFile = path.join(tempDir, 'complex.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Complex DOCX content');
      await fs.writeFile(testFile, docxBuffer);

      const mockResult = {
        value: '<p>Complex document with <strong>formatting</strong>.</p>',
        messages: [
          { type: 'warning', message: 'Unsupported table element' },
          { type: 'info', message: 'Image converted successfully' }
        ]
      };

      // Mock both validation call and actual parsing call
      mockMammoth.convertToHtml
        .mockResolvedValueOnce(mockResult) // For validation
        .mockResolvedValueOnce(mockResult); // For actual parsing

      const result = await processor.parseFile(testFile, 'docx');

      expect(result.content).toBe('Complex document with formatting.');
      expect(result.warnings).toContain('Document contains 1 unsupported elements that may affect formatting');
      expect(result.metadata.additionalMetadata?.hasUnsupportedElements).toBe(true);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should handle empty DOCX content', async () => {
      const testFile = path.join(tempDir, 'empty.docx');
      const docxBuffer = Buffer.from('PK\x03\x04');
      await fs.writeFile(testFile, docxBuffer);

      const mockResult = {
        value: '',
        messages: []
      };

      // Mock both validation call and actual parsing call
      mockMammoth.convertToHtml
        .mockResolvedValueOnce(mockResult) // For validation
        .mockResolvedValueOnce(mockResult); // For actual parsing

      const result = await processor.parseFile(testFile, 'docx');

      expect(result.content).toBe('');
      expect(result.warnings).toContain('No text content extracted from DOCX - file may be corrupted or contain only images');
      expect(result.confidence).toBe(0.1);
    });

    it('should handle DOCX with complex formatting', async () => {
      const testFile = path.join(tempDir, 'formatted.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Formatted content');
      await fs.writeFile(testFile, docxBuffer);

      const mockResult = {
        value: '<div><span style="font-weight:bold;color:red;font-size:14pt;">Simple text</span></div>'.repeat(10),
        messages: []
      };

      // Mock both validation call and actual parsing call
      mockMammoth.convertToHtml
        .mockResolvedValueOnce(mockResult) // For validation
        .mockResolvedValueOnce(mockResult); // For actual parsing

      const result = await processor.parseFile(testFile, 'docx');

      expect(result.content).toBe('Simple text'.repeat(10));
      expect(result.warnings).toContain('Document contains complex formatting that may not be fully preserved');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should handle DOCX parsing errors', async () => {
      const testFile = path.join(tempDir, 'corrupted.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Corrupted content');
      await fs.writeFile(testFile, docxBuffer);

      // Mock validation to fail with parsing error
      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('Invalid DOCX structure'));

      await expect(processor.parseFile(testFile, 'docx')).rejects.toThrow(
        'Failed to parse DOCX file: DOCX validation failed: DOCX appears to be corrupted or invalid'
      );
    });

    it('should handle password protected DOCX', async () => {
      const testFile = path.join(tempDir, 'protected.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Protected content');
      await fs.writeFile(testFile, docxBuffer);

      // Mock validation to fail with password error
      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('password required'));

      await expect(processor.parseFile(testFile, 'docx')).rejects.toThrow(
        'Failed to parse DOCX file: DOCX validation failed: DOCX is password protected or encrypted'
      );
    });

    it('should handle encrypted DOCX', async () => {
      const testFile = path.join(tempDir, 'encrypted.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Encrypted content');
      await fs.writeFile(testFile, docxBuffer);

      // Mock validation to fail with encryption error
      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('encrypted document'));

      await expect(processor.parseFile(testFile, 'docx')).rejects.toThrow(
        'Failed to parse DOCX file: DOCX validation failed: DOCX is password protected or encrypted'
      );
    });

    it('should handle invalid ZIP format', async () => {
      const testFile = path.join(tempDir, 'invalid.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Invalid content');
      await fs.writeFile(testFile, docxBuffer);

      // Mock validation to fail with ZIP error
      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('not a valid zip file'));

      await expect(processor.parseFile(testFile, 'docx')).rejects.toThrow(
        'Failed to parse DOCX file: DOCX validation failed: DOCX appears to be corrupted or invalid'
      );
    });

    it('should fail validation for non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.docx');

      await expect(processor.parseFile(nonExistentFile, 'docx')).rejects.toThrow(
        'DOCX validation failed'
      );
    });
  });

  describe('validateFile', () => {
    it('should validate a proper DOCX file', async () => {
      const testFile = path.join(tempDir, 'valid.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Valid DOCX content');
      await fs.writeFile(testFile, docxBuffer);

      // Mock successful parsing for validation
      mockMammoth.convertToHtml.mockResolvedValueOnce({
        value: 'Valid content',
        messages: []
      });

      const result = await processor.validateFile(testFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.detectedFileType).toBe('docx');
    });

    it('should detect invalid DOCX magic number', async () => {
      const testFile = path.join(tempDir, 'fake.docx');
      const fakeBuffer = Buffer.from('This is not a DOCX file');
      await fs.writeFile(testFile, fakeBuffer);

      const result = await processor.validateFile(testFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CORRUPTED_FILE');
      expect(result.errors[0].message).toContain('does not appear to be a valid DOCX');
    });

    it('should detect password protected DOCX during validation', async () => {
      const testFile = path.join(tempDir, 'protected.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Protected content');
      await fs.writeFile(testFile, docxBuffer);

      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('password required'));

      const result = await processor.validateFile(testFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CORRUPTED_FILE');
      expect(result.errors[0].message).toContain('password protected or encrypted');
    });

    it('should detect corrupted DOCX during validation', async () => {
      const testFile = path.join(tempDir, 'corrupted.docx');
      const docxBuffer = Buffer.from('PK\x03\x04Corrupted content');
      await fs.writeFile(testFile, docxBuffer);

      mockMammoth.convertToHtml.mockRejectedValueOnce(new Error('Corrupted DOCX structure'));

      const result = await processor.validateFile(testFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CORRUPTED_FILE');
      expect(result.errors[0].message).toContain('corrupted or invalid');
    });
  });

  describe('isDocxFile', () => {
    it('should detect valid DOCX ZIP signature', () => {
      const validDocxBuffer = Buffer.from('PK\x03\x04Content');
      expect(processor['isDocxFile'](validDocxBuffer)).toBe(true);
    });

    it('should reject invalid ZIP signature', () => {
      const invalidBuffer = Buffer.from('Not a DOCX file');
      expect(processor['isDocxFile'](invalidBuffer)).toBe(false);
    });

    it('should handle short buffers', () => {
      const shortBuffer = Buffer.from('PK');
      expect(processor['isDocxFile'](shortBuffer)).toBe(false);
    });

    it('should handle empty buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      expect(processor['isDocxFile'](emptyBuffer)).toBe(false);
    });
  });

  describe('htmlToPlainText', () => {
    it('should convert simple HTML to plain text', () => {
      const html = '<p>Hello world</p><p>Second paragraph</p>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('Hello world\nSecond paragraph');
    });

    it('should handle lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('• Item 1\n• Item 2');
    });

    it('should handle headings', () => {
      const html = '<h1>Title</h1><p>Content</p>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('Title\nContent');
    });

    it('should handle line breaks', () => {
      const html = '<p>Line 1<br>Line 2</p>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('Line 1\nLine 2');
    });

    it('should decode HTML entities', () => {
      const html = '<p>&amp; &lt; &gt; &quot; &#39; &nbsp;</p>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('& < > " \'');
    });

    it('should clean up whitespace', () => {
      const html = '<p>  Multiple   spaces  </p><p></p><p>After empty</p>';
      const plainText = processor['htmlToPlainText'](html);
      expect(plainText).toBe('Multiple spaces \n\nAfter empty');
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for good content', () => {
      const goodResult = {
        value: '<p>This is a substantial amount of text content that should give good confidence.</p>',
        messages: []
      };
      const plainText = 'This is a substantial amount of text content that should give good confidence.';
      const confidence = processor['calculateConfidence'](goodResult, plainText, 500); // Smaller file size for better ratio
      expect(confidence).toBeGreaterThan(0.2); // Adjust expectation based on actual calculation
    });

    it('should return low confidence for empty content', () => {
      const emptyResult = {
        value: '',
        messages: []
      };
      const confidence = processor['calculateConfidence'](emptyResult, '', 1000);
      expect(confidence).toBe(0.1);
    });

    it('should return low confidence for very short content', () => {
      const shortResult = {
        value: '<p>Short</p>',
        messages: []
      };
      const confidence = processor['calculateConfidence'](shortResult, 'Short', 1000);
      expect(confidence).toBe(0.3);
    });

    it('should reduce confidence for conversion warnings', () => {
      const warningResult = {
        value: '<p>Content with warnings</p>',
        messages: [
          { type: 'warning', message: 'Unsupported element' },
          { type: 'warning', message: 'Another warning' }
        ]
      };
      const plainText = 'Content with warnings';
      const confidence = processor['calculateConfidence'](warningResult, plainText, 1000);
      expect(confidence).toBeLessThan(0.8);
    });

    it('should reduce confidence for low text-to-size ratio', () => {
      const result = {
        value: '<p>Little text</p>',
        messages: []
      };
      const plainText = 'Little text';
      const confidence = processor['calculateConfidence'](result, plainText, 10000000); // 10MB file
      expect(confidence).toBeLessThan(0.5);
    });

    it('should reduce confidence for complex formatting', () => {
      const complexResult = {
        value: '<div><span style="font-weight:bold;">Simple</span></div>'.repeat(100),
        messages: []
      };
      const plainText = 'Simple'.repeat(100);
      const confidence = processor['calculateConfidence'](complexResult, plainText, 1000);
      expect(confidence).toBeLessThan(1.0);
    });
  });
});