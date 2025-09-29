/**
 * Unit tests for file processor factory
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the dependencies before importing
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}));

vi.mock('mammoth', () => ({
  convertToHtml: vi.fn(),
  images: {
    imgElement: vi.fn(),
  },
}));

import {
  FileProcessorFactoryImpl,
  fileProcessorFactory,
} from '../processor-factory';
import { PdfProcessor } from '../pdf-processor';
import { DocxProcessor } from '../docx-processor';
import { TxtProcessor } from '../txt-processor';

describe('FileProcessorFactoryImpl', () => {
  let factory: FileProcessorFactoryImpl;

  beforeEach(() => {
    factory = new FileProcessorFactoryImpl();
  });

  describe('createProcessor', () => {
    it('should create PDF processor', () => {
      const processor = factory.createProcessor('pdf');
      expect(processor).toBeInstanceOf(PdfProcessor);
    });

    it('should create DOCX processor', () => {
      const processor = factory.createProcessor('docx');
      expect(processor).toBeInstanceOf(DocxProcessor);
    });

    it('should create TXT processor', () => {
      const processor = factory.createProcessor('txt');
      expect(processor).toBeInstanceOf(TxtProcessor);
    });

    it('should throw error for unsupported file type', () => {
      expect(() => {
        // @ts-expect-error Testing invalid file type
        factory.createProcessor('unsupported');
      }).toThrow('No processor available for file type: unsupported');
    });
  });

  describe('createProcessorByExtension', () => {
    it('should create processor for PDF extension', () => {
      const processor1 = factory.createProcessorByExtension('.pdf');
      const processor2 = factory.createProcessorByExtension('pdf');

      expect(processor1).toBeInstanceOf(PdfProcessor);
      expect(processor2).toBeInstanceOf(PdfProcessor);
    });

    it('should create processor for DOCX extensions', () => {
      const processor1 = factory.createProcessorByExtension('.docx');
      const processor2 = factory.createProcessorByExtension('docx');
      const processor3 = factory.createProcessorByExtension('.doc');
      const processor4 = factory.createProcessorByExtension('doc');

      expect(processor1).toBeInstanceOf(DocxProcessor);
      expect(processor2).toBeInstanceOf(DocxProcessor);
      expect(processor3).toBeInstanceOf(DocxProcessor);
      expect(processor4).toBeInstanceOf(DocxProcessor);
    });

    it('should create processor for TXT extensions', () => {
      const processor1 = factory.createProcessorByExtension('.txt');
      const processor2 = factory.createProcessorByExtension('txt');
      const processor3 = factory.createProcessorByExtension('.text');
      const processor4 = factory.createProcessorByExtension('text');

      expect(processor1).toBeInstanceOf(TxtProcessor);
      expect(processor2).toBeInstanceOf(TxtProcessor);
      expect(processor3).toBeInstanceOf(TxtProcessor);
      expect(processor4).toBeInstanceOf(TxtProcessor);
    });

    it('should be case insensitive', () => {
      const processor1 = factory.createProcessorByExtension('.PDF');
      const processor2 = factory.createProcessorByExtension('DOCX');
      const processor3 = factory.createProcessorByExtension('.TXT');

      expect(processor1).toBeInstanceOf(PdfProcessor);
      expect(processor2).toBeInstanceOf(DocxProcessor);
      expect(processor3).toBeInstanceOf(TxtProcessor);
    });

    it('should throw error for unsupported extension', () => {
      expect(() => {
        factory.createProcessorByExtension('.xyz');
      }).toThrow('Unsupported file extension: .xyz');

      expect(() => {
        factory.createProcessorByExtension('unknown');
      }).toThrow('Unsupported file extension: unknown');
    });
  });

  describe('isExtensionSupported', () => {
    it('should return true for supported extensions', () => {
      expect(factory.isExtensionSupported('.pdf')).toBe(true);
      expect(factory.isExtensionSupported('pdf')).toBe(true);
      expect(factory.isExtensionSupported('.docx')).toBe(true);
      expect(factory.isExtensionSupported('docx')).toBe(true);
      expect(factory.isExtensionSupported('.doc')).toBe(true);
      expect(factory.isExtensionSupported('doc')).toBe(true);
      expect(factory.isExtensionSupported('.txt')).toBe(true);
      expect(factory.isExtensionSupported('txt')).toBe(true);
      expect(factory.isExtensionSupported('.text')).toBe(true);
      expect(factory.isExtensionSupported('text')).toBe(true);
    });

    it('should return false for unsupported extensions', () => {
      expect(factory.isExtensionSupported('.xyz')).toBe(false);
      expect(factory.isExtensionSupported('unknown')).toBe(false);
      expect(factory.isExtensionSupported('.rtf')).toBe(false);
      expect(factory.isExtensionSupported('.odt')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(factory.isExtensionSupported('.PDF')).toBe(true);
      expect(factory.isExtensionSupported('DOCX')).toBe(true);
      expect(factory.isExtensionSupported('.TXT')).toBe(true);
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return all supported extensions', () => {
      const extensions = factory.getSupportedExtensions();

      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.docx');
      expect(extensions).toContain('.doc');
      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.text');
    });

    it('should return unique extensions', () => {
      const extensions = factory.getSupportedExtensions();
      const uniqueExtensions = [...new Set(extensions)];

      expect(extensions.length).toBe(uniqueExtensions.length);
    });

    it('should return at least the expected extensions', () => {
      const extensions = factory.getSupportedExtensions();
      const expectedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.text'];

      for (const expected of expectedExtensions) {
        expect(extensions).toContain(expected);
      }
    });
  });

  describe('getAvailableProcessors', () => {
    it('should return all available processors', () => {
      const processors = factory.getAvailableProcessors();

      expect(processors.size).toBe(3);
      expect(processors.has('pdf')).toBe(true);
      expect(processors.has('docx')).toBe(true);
      expect(processors.has('txt')).toBe(true);

      expect(processors.get('pdf')).toBeInstanceOf(PdfProcessor);
      expect(processors.get('docx')).toBeInstanceOf(DocxProcessor);
      expect(processors.get('txt')).toBeInstanceOf(TxtProcessor);
    });

    it('should return a copy of the processors map', () => {
      const processors1 = factory.getAvailableProcessors();
      const processors2 = factory.getAvailableProcessors();

      expect(processors1).toEqual(processors2);
      expect(processors1).not.toBe(processors2); // Different map instances
    });
  });
});

describe('fileProcessorFactory singleton', () => {
  it('should be an instance of FileProcessorFactoryImpl', () => {
    expect(fileProcessorFactory).toBeInstanceOf(FileProcessorFactoryImpl);
  });

  it('should provide the same functionality as a new instance', () => {
    const newFactory = new FileProcessorFactoryImpl();

    expect(fileProcessorFactory.getSupportedExtensions()).toEqual(
      newFactory.getSupportedExtensions()
    );

    expect(fileProcessorFactory.isExtensionSupported('.pdf')).toBe(
      newFactory.isExtensionSupported('.pdf')
    );
  });

  it('should create processors successfully', () => {
    expect(() => fileProcessorFactory.createProcessor('pdf')).not.toThrow();
    expect(() => fileProcessorFactory.createProcessor('docx')).not.toThrow();
    expect(() => fileProcessorFactory.createProcessor('txt')).not.toThrow();
  });
});
