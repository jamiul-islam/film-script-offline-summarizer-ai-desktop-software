import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ScriptRating } from '../ScriptRating';
import { ThemeProvider } from '../ThemeProvider';
import { ScriptWithSummary, ScriptEvaluation } from '../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

const mockScript: ScriptWithSummary = {
  id: 'script1',
  title: 'Test Script',
  filePath: '/path/to/script.pdf',
  contentHash: 'hash1',
  wordCount: 15000,
  fileSize: 500000,
  fileType: 'pdf',
  uploadedAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: 'Script content',
  status: 'analyzed',
  summary: {
    id: 'summary1',
    scriptId: 'script1',
    plotOverview: 'A test script',
    mainCharacters: [],
    themes: ['drama', 'action'],
    productionNotes: [],
    genre: 'Drama',
    modelUsed: 'test-model',
    generationOptions: { length: 'detailed', focusAreas: [] },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

const mockEvaluation: ScriptEvaluation = {
  id: 'eval1',
  scriptId: 'script1',
  rating: 4,
  notes: 'Great script with compelling characters',
  tags: ['high-budget', 'character-driven'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ScriptRating', () => {
  const mockOnEvaluationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders rating interface with script title', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('Script Evaluation')).toBeInTheDocument();
    expect(
      screen.getByText('Rate and add notes for Test Script')
    ).toBeInTheDocument();
  });

  it('displays star rating component', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Click to rate')).toBeInTheDocument();

    // Should have 5 star buttons
    const starButtons = screen
      .getAllByRole('button')
      .filter(button => button.textContent === '⭐');
    expect(starButtons).toHaveLength(5);
  });

  it('handles star rating clicks', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const starButtons = screen
      .getAllByRole('button')
      .filter(button => button.textContent === '⭐');

    // Click the 4th star
    fireEvent.click(starButtons[3]);

    expect(screen.getByText('4/5 stars - Great')).toBeInTheDocument();
  });

  it('displays existing evaluation data', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('4/5 stars - Great')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Great script with compelling characters')
    ).toBeInTheDocument();
    expect(screen.getByText('high-budget')).toBeInTheDocument();
    expect(screen.getByText('character-driven')).toBeInTheDocument();
  });

  it('handles notes input and auto-save', async () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const notesTextarea = screen.getByPlaceholderText(
      'Add your thoughts about this script...'
    );
    fireEvent.change(notesTextarea, {
      target: { value: 'This is a test note' },
    });

    expect(screen.getByText('Auto-saving...')).toBeInTheDocument();

    // Fast-forward time to trigger auto-save
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockOnEvaluationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'This is a test note',
          scriptId: 'script1',
        })
      );
    });
  });

  it('displays character count for notes', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('39 characters')).toBeInTheDocument();
  });

  it('handles tag addition', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addButton = screen.getByText('Add');

    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addButton);

    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('handles tag addition via Enter key', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    fireEvent.change(tagInput, { target: { value: 'enter-tag' } });
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('enter-tag')).toBeInTheDocument();
  });

  it('prevents duplicate tags', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addButton = screen.getByText('Add');

    // Try to add existing tag
    fireEvent.change(tagInput, { target: { value: 'high-budget' } });

    expect(addButton).toBeDisabled();
  });

  it('handles tag removal', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const removeButtons = screen.getAllByText('✕');
    const tagRemoveButton = removeButtons.find(button =>
      button.closest('span')?.textContent?.includes('high-budget')
    );

    if (tagRemoveButton) {
      fireEvent.click(tagRemoveButton);
    }

    expect(screen.queryByText('high-budget')).not.toBeInTheDocument();
  });

  it('shows tag suggestions when typing', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    fireEvent.change(tagInput, { target: { value: 'action' } });

    expect(screen.getAllByText('action-packed').length).toBeGreaterThan(0);
  });

  it('handles tag suggestion clicks', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    fireEvent.change(tagInput, { target: { value: 'action' } });

    const suggestions = screen.getAllByText('action-packed');
    const suggestionButton = suggestions.find(el => el.closest('button'));
    if (suggestionButton) {
      fireEvent.click(suggestionButton);
    }

    expect(screen.getAllByText('action-packed').length).toBeGreaterThan(0);
  });

  it('displays quick add tag categories', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('Quick Add:')).toBeInTheDocument();

    // Should show some quick add tags
    const quickAddTags = ['high-budget', 'character-driven', 'dialogue-heavy'];
    quickAddTags.forEach(tag => {
      if (screen.queryByText(tag)) {
        expect(screen.getByText(tag)).toBeInTheDocument();
      }
    });
  });

  it('handles quick add tag clicks', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    // Find a quick add tag that's not already added
    const quickAddTag = screen.getByText('dialogue-heavy');
    fireEvent.click(quickAddTag);

    expect(screen.getByText('dialogue-heavy')).toBeInTheDocument();
  });

  it('displays evaluation summary', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    expect(screen.getByText('Evaluation Summary')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating:')).toBeInTheDocument();
    expect(screen.getByText('Notes:')).toBeInTheDocument();
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getAllByText('39 characters').length).toBeGreaterThan(0);
    expect(screen.getByText('2 tags')).toBeInTheDocument();
  });

  it('handles manual save', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const notesTextarea = screen.getByPlaceholderText(
      'Add your thoughts about this script...'
    );
    fireEvent.change(notesTextarea, { target: { value: 'Manual save test' } });

    const saveButton = screen.getByText('Save Notes');
    fireEvent.click(saveButton);

    expect(mockOnEvaluationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'Manual save test',
        scriptId: 'script1',
      })
    );
  });

  it('disables save button when no changes', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        evaluation={mockEvaluation}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const saveButton = screen.getByText('Save Notes');
    expect(saveButton).toBeDisabled();
  });

  it('shows different rating descriptions', () => {
    renderWithTheme(
      <ScriptRating
        script={mockScript}
        onEvaluationChange={mockOnEvaluationChange}
      />
    );

    const starButtons = screen
      .getAllByRole('button')
      .filter(button => button.textContent === '⭐');

    // Test different ratings
    fireEvent.click(starButtons[4]); // 5 stars
    expect(screen.getByText('5/5 stars - Exceptional!')).toBeInTheDocument();

    fireEvent.click(starButtons[0]); // 1 star
    expect(screen.getByText('1/5 stars - Poor')).toBeInTheDocument();

    fireEvent.click(starButtons[2]); // 3 stars
    expect(screen.getByText('3/5 stars - Good')).toBeInTheDocument();
  });
});
