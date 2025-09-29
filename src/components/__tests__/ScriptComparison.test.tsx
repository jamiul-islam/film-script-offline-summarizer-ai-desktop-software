import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ScriptComparison } from '../ScriptComparison';
import { ThemeProvider } from '../ThemeProvider';
import { ScriptWithSummary } from '../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
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
    content: 'Script content 1',
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
      productionNotes: [],
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
    content: 'Script content 2',
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
        {
          name: 'Love Interest 2',
          description: 'Second protagonist',
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
  {
    id: 'script3',
    title: 'Action Romance',
    filePath: '/path/to/script3.pdf',
    contentHash: 'hash3',
    wordCount: 18000,
    fileSize: 600000,
    fileType: 'pdf',
    uploadedAt: new Date('2024-01-03'),
    lastModified: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    content: 'Script content 3',
    status: 'analyzed',
    summary: {
      id: 'summary3',
      scriptId: 'script3',
      plotOverview: 'Action meets romance',
      mainCharacters: [
        {
          name: 'Action Hero',
          description: 'Tough protagonist',
          importance: 'protagonist',
          relationships: [],
        },
        {
          name: 'Love Interest',
          description: 'Romantic interest',
          importance: 'main',
          relationships: [],
        },
      ],
      themes: ['action', 'love', 'adventure'],
      productionNotes: [],
      genre: 'Action',
      modelUsed: 'test-model',
      generationOptions: { length: 'detailed', focusAreas: [] },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ScriptComparison', () => {
  const mockOnScriptSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comparison interface with header', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(screen.getByText('Script Comparison')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Compare scripts side-by-side to identify similarities and differences'
      )
    ).toBeInTheDocument();
  });

  it('shows script selection interface when no scripts are selected', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(
      screen.getByText('Select Scripts to Compare (0/2)')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search scripts...')
    ).toBeInTheDocument();
  });

  it('displays available scripts for selection', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(screen.getByText('Action Hero')).toBeInTheDocument();
    expect(screen.getByText('Romantic Comedy')).toBeInTheDocument();
    expect(screen.getByText('Action Romance')).toBeInTheDocument();
  });

  it('filters scripts based on search query', async () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search scripts...');
    fireEvent.change(searchInput, { target: { value: 'Action' } });

    await waitFor(() => {
      expect(screen.getByText('Action Hero')).toBeInTheDocument();
      expect(screen.getByText('Action Romance')).toBeInTheDocument();
      expect(screen.queryByText('Romantic Comedy')).not.toBeInTheDocument();
    });
  });

  it('calls onScriptSelect when a script is clicked', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    const scriptCard = screen
      .getByText('Action Hero')
      .closest('div[role="button"], button');
    if (scriptCard) {
      fireEvent.click(scriptCard);
    }

    expect(mockOnScriptSelect).toHaveBeenCalledWith([mockScripts[0]]);
  });

  it('displays selected scripts', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(screen.getByText('Action Hero')).toBeInTheDocument();
    expect(
      screen.getByText('Select Scripts to Compare (1/2)')
    ).toBeInTheDocument();
  });

  it('shows comparison metrics when two scripts are selected', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[2]]} // Action Hero and Action Romance
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(screen.getByText('Comparison Metrics')).toBeInTheDocument();
    expect(screen.getByText('Theme Similarity')).toBeInTheDocument();
    expect(screen.getByText('Genre Match')).toBeInTheDocument();
    expect(screen.getByText('Shared Themes')).toBeInTheDocument();
    expect(screen.getByText('Character Diff')).toBeInTheDocument();
  });

  it('calculates correct similarity metrics', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[2]]} // Both have 'action' theme and same genre
        onScriptSelect={mockOnScriptSelect}
      />
    );

    // Should show genre match (both Action)
    const genreMatchElements = screen.getAllByText('✓');
    expect(genreMatchElements.length).toBeGreaterThan(0);

    // Should show shared themes in the metrics section
    expect(screen.getByText('Shared Themes:')).toBeInTheDocument();
    const sharedThemesSection = screen
      .getByText('Shared Themes:')
      .closest('div');
    expect(sharedThemesSection).toHaveTextContent('action');
  });

  it('displays side-by-side comparison view', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[1]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(screen.getAllByText('Plot Overview')).toHaveLength(2);
    expect(screen.getAllByText('Characters (2)')).toHaveLength(2);
    expect(screen.getAllByText('Themes')).toHaveLength(2);
    expect(screen.getAllByText('Genre')).toHaveLength(2);
  });

  it('allows removing selected scripts', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    expect(mockOnScriptSelect).toHaveBeenCalledWith([]);
  });

  it('toggles comparison modes', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[1]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    const overlayButton = screen.getByText('Overlay');
    fireEvent.click(overlayButton);

    expect(
      screen.getByText('Overlay comparison mode coming soon')
    ).toBeInTheDocument();
  });

  it('toggles highlighting differences', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[1]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    const highlightButton = screen.getByText('🔍 Highlighting On');
    fireEvent.click(highlightButton);

    expect(screen.getByText('🔍 Highlighting Off')).toBeInTheDocument();
  });

  it('handles scripts without summaries', () => {
    const scriptsWithoutSummary = [
      {
        ...mockScripts[0],
        summary: undefined,
        status: 'uploaded' as const,
      },
    ];

    renderWithTheme(
      <ScriptComparison
        scripts={scriptsWithoutSummary}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    expect(
      screen.getByText('No analyzed scripts available for comparison')
    ).toBeInTheDocument();
  });

  it('prevents selecting more than 2 scripts', () => {
    renderWithTheme(
      <ScriptComparison
        scripts={mockScripts}
        selectedScripts={[mockScripts[0], mockScripts[1]]}
        onScriptSelect={mockOnScriptSelect}
      />
    );

    // Should not show script selection interface when 2 scripts are selected
    expect(
      screen.queryByText('Select Scripts to Compare')
    ).not.toBeInTheDocument();
  });
});
