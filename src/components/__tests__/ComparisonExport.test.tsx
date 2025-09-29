import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ComparisonExport } from '../ComparisonExport';
import { ThemeProvider } from '../ThemeProvider';
import { ScriptWithSummary, ScriptEvaluation } from '../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockScripts: ScriptWithSummary[] = [
  {
    id: 'script1',
    title: 'Action Hero',
    filePath: '/path/to/script1.pdf',
    contentHash: 'hash1',
    wordCount: 15000,
    fileSize: 500000,
    fileType: 'pdf',
    uploadedAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    content:
      'Script content 1 with many words to test word counting functionality',
    status: 'analyzed',
    summary: {
      id: 'summary1',
      scriptId: 'script1',
      plotOverview: 'An action-packed adventure',
      mainCharacters: [
        {
          name: 'Hero',
          description: 'The protagonist',
          importance: 'protagonist',
          relationships: [],
        },
        {
          name: 'Villain',
          description: 'The antagonist',
          importance: 'main',
          relationships: [],
        },
      ],
      themes: ['action', 'heroism', 'justice'],
      productionNotes: [
        {
          category: 'technical',
          content: 'Complex VFX required',
          priority: 'high',
          budgetImpact: 'major',
        },
      ],
      genre: 'Action',
      modelUsed: 'test-model',
      generationOptions: { length: 'detailed', focusAreas: [] },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  },
  {
    id: 'script2',
    title: 'Romantic Comedy',
    filePath: '/path/to/script2.pdf',
    contentHash: 'hash2',
    wordCount: 12000,
    fileSize: 400000,
    fileType: 'pdf',
    uploadedAt: new Date('2024-01-02'),
    lastModified: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    content: 'Script content 2 with different word count',
    status: 'analyzed',
    summary: {
      id: 'summary2',
      scriptId: 'script2',
      plotOverview: 'A heartwarming love story',
      mainCharacters: [
        {
          name: 'Love Interest 1',
          description: 'First protagonist',
          importance: 'protagonist',
          relationships: [],
        },
      ],
      themes: ['love', 'comedy', 'relationships'],
      productionNotes: [],
      genre: 'Romance',
      modelUsed: 'test-model',
      generationOptions: { length: 'detailed', focusAreas: [] },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  },
];

const mockEvaluations: Record<string, ScriptEvaluation> = {
  script1: {
    id: 'eval1',
    scriptId: 'script1',
    rating: 5,
    notes: 'Excellent action script',
    tags: ['high-budget', 'blockbuster'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  script2: {
    id: 'eval2',
    scriptId: 'script2',
    rating: 3,
    notes: 'Good romantic comedy',
    tags: ['low-budget', 'feel-good'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ComparisonExport', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export interface with header', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Export Comparison')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Generate a comprehensive comparison report for 2 scripts'
      )
    ).toBeInTheDocument();
  });

  it('displays export format options', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('TXT')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('allows format selection', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    const txtButton = screen.getByText('TXT');
    fireEvent.click(txtButton);

    expect(screen.getByText('Export as TXT')).toBeInTheDocument();
  });

  it('displays include options with checkboxes', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Include in Export')).toBeInTheDocument();
    expect(screen.getByLabelText('Ratings')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Metrics')).toBeInTheDocument();
  });

  it('toggles include options', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    const ratingsCheckbox = screen.getByLabelText(
      'Ratings'
    ) as HTMLInputElement;
    expect(ratingsCheckbox.checked).toBe(true);

    fireEvent.click(ratingsCheckbox);
    expect(ratingsCheckbox.checked).toBe(false);
  });

  it('displays report preview with summary stats', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Report Preview')).toBeInTheDocument();
    expect(screen.getByText('Scripts')).toBeInTheDocument();
    expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument(); // Average rating (5+3)/2 = 4

    // Check for scripts count in the context of the Scripts label
    const scriptsSection = screen.getByText('Scripts').closest('div');
    expect(scriptsSection).toHaveTextContent('2');
  });

  it('shows scripts in report preview', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Scripts in Report:')).toBeInTheDocument();
    expect(screen.getByText('Action Hero')).toBeInTheDocument();
    expect(screen.getByText('Romantic Comedy')).toBeInTheDocument();
    expect(screen.getByText('(Action)')).toBeInTheDocument();
    expect(screen.getByText('(Romance)')).toBeInTheDocument();
  });

  it('displays ratings in preview when enabled', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Rating for script1
    expect(screen.getByText('3')).toBeInTheDocument(); // Rating for script2
  });

  it('displays production complexity metrics', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('medium complexity')).toBeInTheDocument(); // Action Hero complexity
    expect(screen.getByText('low complexity')).toBeInTheDocument(); // Romance has no complex production notes
  });

  it('shows recommendations when available', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Key Recommendations:')).toBeInTheDocument();
    expect(
      screen.getByText('Strong portfolio with high-quality scripts')
    ).toBeInTheDocument();
  });

  it('handles export button click', async () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByText('Export as PDF');
    fireEvent.click(exportButton);

    expect(exportButton).toHaveTextContent('Loading...');

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith(
        'pdf',
        expect.objectContaining({
          title: 'Script Comparison Report - 2 Scripts',
          scripts: expect.arrayContaining([
            expect.objectContaining({
              script: expect.objectContaining({ id: 'script1' }),
              evaluation: expect.objectContaining({ rating: 5 }),
            }),
          ]),
          summary: expect.objectContaining({
            totalScripts: 2,
            averageRating: 4,
          }),
        })
      );
    });
  });

  it('disables export when no scripts', () => {
    renderWithTheme(
      <ComparisonExport scripts={[]} evaluations={{}} onExport={mockOnExport} />
    );

    const exportButton = screen.getByText('Export as PDF');
    expect(exportButton).toBeDisabled();
  });

  it('calculates correct genre distribution', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    // Check for genres count in the context of the Genres label
    const genresSection = screen.getByText('Genres').closest('div');
    expect(genresSection).toHaveTextContent('2'); // 2 different genres
  });

  it('handles scripts without evaluations', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={{}} // No evaluations
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('0.0')).toBeInTheDocument(); // Average rating should be 0
  });

  it('updates preview when include options change', () => {
    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExport}
      />
    );

    // Initially ratings should be visible
    expect(screen.getByText('5')).toBeInTheDocument();

    // Disable ratings
    const ratingsCheckbox = screen.getByLabelText('Ratings');
    fireEvent.click(ratingsCheckbox);

    // Ratings should no longer be visible in preview
    const ratingElements = screen.queryAllByText('5').filter(
      el => el.closest('[class*="space-x-4"]') // Rating display context
    );
    expect(ratingElements).toHaveLength(0);
  });

  it('generates recommendations based on portfolio quality', () => {
    const lowRatedEvaluations = {
      script1: { ...mockEvaluations.script1, rating: 2 },
      script2: { ...mockEvaluations.script2, rating: 1 },
    };

    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={lowRatedEvaluations}
        onExport={mockOnExport}
      />
    );

    expect(
      screen.getByText(
        'Consider focusing on script development before production'
      )
    ).toBeInTheDocument();
  });

  it('handles export errors gracefully', async () => {
    const mockOnExportError = vi
      .fn()
      .mockRejectedValue(new Error('Export failed'));

    renderWithTheme(
      <ComparisonExport
        scripts={mockScripts}
        evaluations={mockEvaluations}
        onExport={mockOnExportError}
      />
    );

    const exportButton = screen.getByText('Export as PDF');
    fireEvent.click(exportButton);

    // Wait for the error to be handled and button to reset
    await waitFor(
      () => {
        expect(exportButton).toHaveTextContent('Export as PDF'); // Should reset after error
      },
      { timeout: 3000 }
    );
  });
});
