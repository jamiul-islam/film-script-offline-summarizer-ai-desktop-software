import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScriptLibrary } from '../ScriptLibrary';
import { ThemeProvider } from '../ThemeProvider';
import type { ScriptWithSummary } from '../../types/script';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: unknown) => <>{children}</>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme="dark" enableAnimations={true}>
    {children}
  </ThemeProvider>
);

// Mock script data
const createMockScript = (overrides: Partial<ScriptWithSummary> = {}): ScriptWithSummary => ({
  id: 'script-1',
  title: 'Test Script',
  filePath: '/path/to/script.pdf',
  contentHash: 'hash123',
  wordCount: 1000,
  fileSize: 1024 * 1024, // 1MB
  fileType: 'pdf',
  uploadedAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  status: 'analyzed',
  evaluation: {
    id: 'eval-1',
    scriptId: 'script-1',
    rating: 4,
    notes: 'Great script with compelling characters',
    tags: ['drama', 'thriller'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  ...overrides,
});

describe('ScriptLibrary', () => {
  const mockOnScriptSelect = vi.fn();
  const mockOnScriptDelete = vi.fn();
  const mockOnScriptRate = vi.fn();

  beforeEach(() => {
    mockOnScriptSelect.mockClear();
    mockOnScriptDelete.mockClear();
    mockOnScriptRate.mockClear();
  });

  it('renders empty state when no scripts provided', () => {
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={[]}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No scripts yet')).toBeInTheDocument();
    expect(screen.getByText('Upload your first script to get started')).toBeInTheDocument();
  });

  it('renders scripts in grid view by default', () => {
    const scripts = [
      createMockScript({ id: 'script-1', title: 'Script One' }),
      createMockScript({ id: 'script-2', title: 'Script Two' }),
    ];

    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Script One')).toBeInTheDocument();
    expect(screen.getByText('Script Two')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 scripts')).toBeInTheDocument();
  });

  it('switches between grid and list view', () => {
    const scripts = [createMockScript()];

    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    // Find view toggle buttons
    const listViewButton = screen.getByRole('button', { name: '☰' });
    const gridViewButton = screen.getByRole('button', { name: '⊞' });

    // Grid view should be active by default
    expect(gridViewButton).toHaveClass('btn-primary');
    expect(listViewButton).toHaveClass('btn-ghost');

    // Switch to list view
    fireEvent.click(listViewButton);
    expect(listViewButton).toHaveClass('btn-primary');
    expect(gridViewButton).toHaveClass('btn-ghost');
  });

  it('filters scripts by search query', async () => {
    const scripts = [
      createMockScript({ id: 'script-1', title: 'Action Movie' }),
      createMockScript({ id: 'script-2', title: 'Drama Film' }),
    ];

    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search scripts by title or notes...');
    
    fireEvent.change(searchInput, { target: { value: 'Action' } });

    await waitFor(() => {
      expect(screen.getByText('Action Movie')).toBeInTheDocument();
      expect(screen.queryByText('Drama Film')).not.toBeInTheDocument();
      expect(screen.getByText('1 of 2 scripts')).toBeInTheDocument();
    });
  });

  it('sorts scripts by different criteria', () => {
    const scripts = [
      createMockScript({ 
        id: 'script-1', 
        title: 'B Script',
        uploadedAt: new Date('2024-01-02'),
        evaluation: { ...createMockScript().evaluation!, rating: 3 }
      }),
      createMockScript({ 
        id: 'script-2', 
        title: 'A Script',
        uploadedAt: new Date('2024-01-01'),
        evaluation: { ...createMockScript().evaluation!, rating: 5 }
      }),
    ];

    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    // Test title sorting
    const titleSortButton = screen.getByRole('button', { name: /title/i });
    fireEvent.click(titleSortButton);

    // Should show A Script first when sorted by title descending
    const scriptTitles = screen.getAllByText(/Script/);
    expect(scriptTitles[0]).toHaveTextContent('B Script'); // desc by default
    
    // Click again to reverse order
    fireEvent.click(titleSortButton);
    const updatedTitles = screen.getAllByText(/Script/);
    expect(updatedTitles[0]).toHaveTextContent('A Script'); // asc
  });

  it('filters scripts by tags', async () => {
    const scripts = [
      createMockScript({ 
        id: 'script-1', 
        title: 'Drama Script',
        evaluation: { 
          ...createMockScript().evaluation!, 
          tags: ['drama', 'romance'] 
        }
      }),
      createMockScript({ 
        id: 'script-2', 
        title: 'Action Script',
        evaluation: { 
          ...createMockScript().evaluation!, 
          tags: ['action', 'thriller'] 
        }
      }),
    ];

    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    // Click on drama tag filter
    const dramaTagButton = screen.getByRole('button', { name: 'drama' });
    fireEvent.click(dramaTagButton);

    await waitFor(() => {
      expect(screen.getByText('Drama Script')).toBeInTheDocument();
      expect(screen.queryByText('Action Script')).not.toBeInTheDocument();
      expect(screen.getByText('1 of 2 scripts')).toBeInTheDocument();
    });
  });

  it('calls onScriptSelect when script is clicked', () => {
    const script = createMockScript();
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={[script]}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    // Find the script card by looking for the title and then finding its clickable parent
    const scriptTitle = screen.getByText('Test Script');
    const scriptCard = scriptTitle.closest('div');
    
    // Click on the card
    if (scriptCard) {
      fireEvent.click(scriptCard);
      expect(mockOnScriptSelect).toHaveBeenCalledWith(script);
    } else {
      // Fallback: click directly on the title element
      fireEvent.click(scriptTitle);
      expect(mockOnScriptSelect).toHaveBeenCalledWith(script);
    }
  });

  it('calls onScriptDelete when delete button is clicked', () => {
    const script = createMockScript();
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={[script]}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: '🗑️' });
    fireEvent.click(deleteButton);

    expect(mockOnScriptDelete).toHaveBeenCalledWith('script-1');
    expect(mockOnScriptSelect).not.toHaveBeenCalled(); // Should not trigger select
  });

  it('calls onScriptRate when star rating is clicked', () => {
    const script = createMockScript();
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={[script]}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    // Find star rating buttons (should have 5 stars)
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.textContent === '⭐'
    );
    
    // Click on the 5th star
    fireEvent.click(starButtons[4]);

    expect(mockOnScriptRate).toHaveBeenCalledWith('script-1', 5);
  });

  it('displays script metadata correctly', () => {
    const script = createMockScript({
      fileSize: 2 * 1024 * 1024, // 2MB
      wordCount: 5000,
      fileType: 'docx',
      uploadedAt: new Date('2024-01-15T10:30:00'),
    });
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={[script]}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Size: 2 MB')).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
    expect(screen.getByText('Words: 5,000')).toBeInTheDocument();
    expect(screen.getByText(/Uploaded: Jan 15, 2024/)).toBeInTheDocument();
  });

  it('shows script status with correct styling', () => {
    const scripts = [
      createMockScript({ id: 'script-1', status: 'processing' }),
      createMockScript({ id: 'script-2', status: 'error' }),
      createMockScript({ id: 'script-3', status: 'analyzed' }),
    ];
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Analyzed')).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    const scripts = [createMockScript()];
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search scripts by title or notes...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(clearButton);

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    const scripts = [createMockScript({ title: 'Action Movie' })];
    
    render(
      <TestWrapper>
        <ScriptLibrary
          scripts={scripts}
          onScriptSelect={mockOnScriptSelect}
          onScriptDelete={mockOnScriptDelete}
          onScriptRate={mockOnScriptRate}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search scripts by title or notes...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No scripts match your filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
    });
  });
});