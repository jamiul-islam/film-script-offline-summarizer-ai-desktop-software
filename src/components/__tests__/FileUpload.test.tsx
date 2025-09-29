import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileUpload } from '../FileUpload';
import { ThemeProvider } from '../ThemeProvider';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme="dark" enableAnimations={true}>
    {children}
  </ThemeProvider>
);

// Helper function to create mock files
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

  it('renders the upload area with correct text', () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    expect(screen.getByText('Upload Script Files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your script files here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .pdf, .docx, .txt • Max size: 50MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Files' })).toBeInTheDocument();
  });

  it('shows drag over state when files are dragged over', () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        files: [createMockFile('test.pdf', 1000, 'application/pdf')]
      }
    });

    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });

  it('handles file drop correctly', async () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    const mockFile = createMockFile('test.pdf', 1000, 'application/pdf');

    // Simulate file drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [mockFile]
      }
    });

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('Processing Files...')).toBeInTheDocument();
    });

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile]);
    }, { timeout: 3000 });
  });

  it('validates file types correctly', async () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    const invalidFile = createMockFile('test.jpg', 1000, 'image/jpeg');

    // Simulate file drop with invalid type
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [invalidFile]
      }
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/File type \.jpg not supported/)).toBeInTheDocument();
    });

    // Should not call onFilesSelected for invalid files
    expect(mockOnFilesSelected).not.toHaveBeenCalled();
  });

  it('validates file size correctly', async () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} maxFileSize={1} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    const largeFile = createMockFile('large.pdf', 2 * 1024 * 1024, 'application/pdf'); // 2MB

    // Simulate file drop with large file
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [largeFile]
      }
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/File size.*exceeds maximum allowed size/)).toBeInTheDocument();
    });

    // Should not call onFilesSelected for oversized files
    expect(mockOnFilesSelected).not.toHaveBeenCalled();
  });

  it('handles multiple files correctly', async () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} multiple={true} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    const file1 = createMockFile('test1.pdf', 1000, 'application/pdf');
    const file2 = createMockFile('test2.docx', 2000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Simulate multiple file drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file1, file2]
      }
    });

    // Wait for processing to complete
    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([file1, file2]);
    }, { timeout: 3000 });
  });

  it('shows progress for each file during upload', async () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    const mockFile = createMockFile('test.pdf', 1000, 'application/pdf');

    // Simulate file drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [mockFile]
      }
    });

    // Wait for progress to appear
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('Processing Files...')).toBeInTheDocument();
    });
  });

  it('handles browse button click', () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const browseButton = screen.getByRole('button', { name: 'Browse Files' });
    
    // Mock the file input click
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    fireEvent.click(browseButton);

    expect(clickSpy).toHaveBeenCalled();
    
    clickSpy.mockRestore();
  });

  it('accepts custom accepted types', () => {
    render(
      <TestWrapper>
        <FileUpload 
          onFilesSelected={mockOnFilesSelected} 
          acceptedTypes={['.pdf', '.txt']}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Supported formats: .pdf, .txt • Max size: 50MB')).toBeInTheDocument();
  });

  it('accepts custom max file size', () => {
    render(
      <TestWrapper>
        <FileUpload 
          onFilesSelected={mockOnFilesSelected} 
          maxFileSize={25}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Supported formats: .pdf, .docx, .txt • Max size: 25MB')).toBeInTheDocument();
  });

  it('handles drag leave correctly', () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    
    // First drag enter
    fireEvent.dragEnter(dropZone!);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();

    // Then drag leave
    fireEvent.dragLeave(dropZone!);
    expect(screen.getByText('Upload Script Files')).toBeInTheDocument();
  });

  it('prevents default behavior on drag events', () => {
    render(
      <TestWrapper>
        <FileUpload onFilesSelected={mockOnFilesSelected} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Upload Script Files').closest('div');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(dropZone!, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});