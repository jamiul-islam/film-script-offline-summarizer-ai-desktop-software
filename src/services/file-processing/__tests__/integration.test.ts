/**
 * Integration tests for file processing service
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileProcessorFactory } from '../processor-factory';

// Mock external dependencies
vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({
    text: 'Mocked PDF content',
    numpages: 1,
    version: '1.4',
    info: { Title: 'Test PDF' }
  })
}));

vi.mock('mammoth', () => ({
  convertToHtml: vi.fn().mockResolvedValue({
    value: '<p>Mocked DOCX content</p>',
    messages: []
  }),
  images: {
    imgElement: vi.fn()
  }
}));

describe('File Processing Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, 'temp-integration-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should process all supported file types through factory', async () => {
    // Test TXT file
    const txtFile = path.join(tempDir, 'test.txt');
    await fs.writeFile(txtFile, 'This is a test text file.');
    
    const txtProcessor = fileProcessorFactory.createProcessorByExtension('.txt');
    const txtResult = await txtProcessor.parseFile(txtFile, 'txt');
    
    expect(txtResult.content).toBe('This is a test text file.');
    expect(txtResult.title).toBe('test');
    expect(txtResult.metadata.wordCount).toBe(6);

    // Test PDF file (mocked)
    const pdfFile = path.join(tempDir, 'test.pdf');
    await fs.writeFile(pdfFile, Buffer.from('%PDF-1.4\nMocked content'));
    
    const pdfProcessor = fileProcessorFactory.createProcessorByExtension('.pdf');
    const pdfResult = await pdfProcessor.parseFile(pdfFile, 'pdf');
    
    expect(pdfResult.content).toBe('Mocked PDF content');
    expect(pdfResult.title).toBe('Test PDF');

    // Test DOCX file (mocked)
    const docxFile = path.join(tempDir, 'test.docx');
    await fs.writeFile(docxFile, Buffer.from('PK\x03\x04Mocked DOCX'));
    
    const docxProcessor = fileProcessorFactory.createProcessorByExtension('.docx');
    const docxResult = await docxProcessor.parseFile(docxFile, 'docx');
    
    expect(docxResult.content).toBe('Mocked DOCX content'); // HTML is converted to plain text
    expect(docxResult.title).toBe('test');
  });

  it('should validate all supported file types', async () => {
    const supportedExtensions = fileProcessorFactory.getSupportedExtensions();
    
    expect(supportedExtensions).toContain('.pdf');
    expect(supportedExtensions).toContain('.docx');
    expect(supportedExtensions).toContain('.doc');
    expect(supportedExtensions).toContain('.txt');
    expect(supportedExtensions).toContain('.text');
  });

  it('should handle validation errors consistently', async () => {
    const nonExistentFile = path.join(tempDir, 'nonexistent.txt');
    
    const processor = fileProcessorFactory.createProcessorByExtension('.txt');
    
    await expect(processor.parseFile(nonExistentFile, 'txt')).rejects.toThrow(
      'TXT validation failed'
    );
  });

  it('should provide consistent interface across all processors', () => {
    const processors = fileProcessorFactory.getAvailableProcessors();
    
    for (const [fileType, processor] of processors) {
      expect(processor.getSupportedExtensions).toBeDefined();
      expect(processor.isSupported).toBeDefined();
      expect(processor.validateFile).toBeDefined();
      expect(processor.parseFile).toBeDefined();
      
      // Test that each processor supports its expected extensions
      const extensions = processor.getSupportedExtensions();
      expect(extensions.length).toBeGreaterThan(0);
      
      for (const ext of extensions) {
        expect(processor.isSupported(ext)).toBe(true);
      }
    }
  });
});