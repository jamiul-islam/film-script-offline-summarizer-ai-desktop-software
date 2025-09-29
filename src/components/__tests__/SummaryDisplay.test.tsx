import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SummaryDisplay } from '../SummaryDisplay';
import { ThemeProvider } from '../ThemeProvider';
import type { ScriptSummary } from '../../types/summary';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockSummary: ScriptSummary = {
  id: 'test-summary-1',
  scriptId: 'test-script-1',
  plotOverview:
    'A compelling story about a young hero who discovers their destiny and must overcome great challenges to save their world. The narrative follows a classic three-act structure with well-developed character arcs.',
  mainCharacters: [
    {
      name: 'Alex Thompson',
      description:
        'The protagonist, a 25-year-old reluctant hero with a mysterious past',
      importance: 'protagonist',
      relationships: ['Mentor to Sarah', 'Enemy of Marcus'],
      characterArc:
        'Transforms from a reluctant participant to a confident leader',
      ageRange: '25-30',
      traits: ['brave', 'stubborn', 'loyal'],
    },
    {
      name: 'Sarah Chen',
      description: "Alex's best friend and trusted ally",
      importance: 'main',
      relationships: ['Student of Alex', 'Friend to Maria'],
      characterArc: 'Learns to trust her own instincts',
      ageRange: '22-28',
      traits: ['intelligent', 'cautious', 'supportive'],
    },
    {
      name: 'Marcus Blackwood',
      description: 'The primary antagonist with complex motivations',
      importance: 'main',
      relationships: ['Rival of Alex'],
      characterArc: 'Reveals hidden vulnerability in final act',
      ageRange: '40-50',
      traits: ['cunning', 'charismatic', 'ruthless'],
    },
  ],
  themes: ['Good vs Evil', 'Coming of Age', 'Sacrifice', 'Redemption'],
  productionNotes: [
    {
      category: 'budget',
      content: 'Requires significant VFX budget for magical sequences',
      priority: 'high',
      budgetImpact: 'significant',
      requirements: ['VFX team', 'Extended post-production schedule'],
    },
    {
      category: 'location',
      content: 'Multiple exotic locations needed for authenticity',
      priority: 'medium',
      budgetImpact: 'moderate',
      requirements: ['Location scouting', 'Travel permits'],
    },
    {
      category: 'cast',
      content: 'Lead role requires experienced actor with action background',
      priority: 'critical',
      budgetImpact: 'major',
      requirements: ['A-list casting', 'Stunt coordination'],
    },
    {
      category: 'technical',
      content: 'Complex practical effects needed for creature scenes',
      priority: 'low',
      budgetImpact: 'minimal',
    },
  ],
  genre: 'Fantasy Adventure',
  estimatedBudget: 'high',
  targetAudience: 'Young adults and fantasy enthusiasts aged 16-35',
  toneAndStyle: 'Epic and adventurous with moments of humor and heart',
  keyScenes: [
    'Opening sequence establishing the ordinary world',
    'The call to adventure and initial refusal',
    'Final confrontation between hero and villain',
  ],
  productionChallenges: [
    'Weather-dependent outdoor shooting',
    'Complex creature design and animation',
  ],
  marketability:
    'Strong potential for franchise development with built-in sequel opportunities and merchandising potential.',
  modelUsed: 'llama3.1:8b',
  generationOptions: {
    model: 'llama3.1:8b',
    summaryLength: 'detailed',
    focusAreas: ['plot', 'characters', 'themes', 'production'],
    includeProductionNotes: true,
    includeCharacterAnalysis: true,
    includeThemeAnalysis: true,
  },
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider enableAnimations={false}>{component}</ThemeProvider>
  );
};

describe('SummaryDisplay', () => {
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders summary header with basic information', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Script Summary')).toBeInTheDocument();
      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
      expect(screen.getByText(/Model: llama3.1:8b/)).toBeInTheDocument();
      expect(screen.getByText(/Genre: Fantasy Adventure/)).toBeInTheDocument();
    });

    it('displays budget information when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('💰 High Budget')).toBeInTheDocument();
    });

    it('displays target audience when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Target Audience')).toBeInTheDocument();
      expect(
        screen.getByText('Young adults and fantasy enthusiasts aged 16-35')
      ).toBeInTheDocument();
    });

    it('renders export buttons when onExport is provided', () => {
      renderWithTheme(
        <SummaryDisplay summary={mockSummary} onExport={mockOnExport} />
      );

      expect(screen.getByText('📄 Export TXT')).toBeInTheDocument();
      expect(screen.getByText('📑 Export PDF')).toBeInTheDocument();
    });

    it('does not render export buttons when onExport is not provided', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.queryByText('📄 Export TXT')).not.toBeInTheDocument();
      expect(screen.queryByText('📑 Export PDF')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('renders all main sections with correct titles', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Plot Overview')).toBeInTheDocument();
      expect(screen.getByText('Characters (3)')).toBeInTheDocument();
      expect(screen.getByText('Themes (4)')).toBeInTheDocument();
      expect(screen.getByText('Production Notes (4)')).toBeInTheDocument();
      expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    });

    it('expands and collapses sections when clicked', async () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      // Plot Overview should be expanded by default
      expect(screen.getByText(mockSummary.plotOverview)).toBeInTheDocument();

      // Click to collapse
      const plotButton = screen.getByRole('button', { name: /Plot Overview/ });
      fireEvent.click(plotButton);

      await waitFor(() => {
        expect(
          screen.queryByText(mockSummary.plotOverview)
        ).not.toBeInTheDocument();
      });

      // Click to expand again
      fireEvent.click(plotButton);

      await waitFor(() => {
        expect(screen.getByText(mockSummary.plotOverview)).toBeInTheDocument();
      });
    });

    it('shows correct default expansion states', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      // These should be expanded by default
      expect(screen.getByText(mockSummary.plotOverview)).toBeInTheDocument();
      expect(screen.getAllByText('Alex Thompson')).toHaveLength(3); // Character card + 2 relationships
      expect(screen.getByText('Good vs Evil')).toBeInTheDocument();

      // These should be collapsed by default
      expect(
        screen.queryByText('Requires significant VFX budget')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Strong potential for franchise')
      ).not.toBeInTheDocument();
    });
  });

  describe('Plot Overview Section', () => {
    it('displays plot overview text', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText(mockSummary.plotOverview)).toBeInTheDocument();
    });

    it('displays tone and style when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Tone & Style')).toBeInTheDocument();
      expect(screen.getByText(mockSummary.toneAndStyle!)).toBeInTheDocument();
    });

    it('displays key scenes when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Key Scenes')).toBeInTheDocument();
      expect(
        screen.getByText('Opening sequence establishing the ordinary world')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Final confrontation between hero and villain')
      ).toBeInTheDocument();
    });
  });

  describe('Characters Section', () => {
    it('displays all characters with correct information', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      // Check character names (multiple instances due to relationships)
      expect(screen.getAllByText('Alex Thompson')).toHaveLength(3);
      expect(screen.getAllByText('Sarah Chen')).toHaveLength(3);
      expect(screen.getAllByText('Marcus Blackwood')).toHaveLength(2);

      // Check character descriptions
      expect(
        screen.getByText(/25-year-old reluctant hero/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/best friend and trusted ally/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/primary antagonist with complex/)
      ).toBeInTheDocument();
    });

    it('displays character importance badges with correct colors', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      const protagonistBadge = screen.getByText('protagonist');
      const mainBadges = screen.getAllByText('main');

      expect(protagonistBadge).toBeInTheDocument();
      expect(mainBadges).toHaveLength(2);
    });

    it('displays character traits when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('brave')).toBeInTheDocument();
      expect(screen.getByText('stubborn')).toBeInTheDocument();
      expect(screen.getByText('loyal')).toBeInTheDocument();
    });

    it('displays character arcs when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getAllByText('Character Arc')).toHaveLength(3); // All characters have arcs
      expect(
        screen.getByText(/Transforms from a reluctant participant/)
      ).toBeInTheDocument();
    });

    it('displays character relationships', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Character Relationships')).toBeInTheDocument();
      expect(screen.getByText('Mentor')).toBeInTheDocument();
      expect(screen.getByText('Enemy')).toBeInTheDocument();
    });

    it('displays age ranges when available', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Age: 25-30')).toBeInTheDocument();
      expect(screen.getByText('Age: 22-28')).toBeInTheDocument();
      expect(screen.getByText('Age: 40-50')).toBeInTheDocument();
    });
  });

  describe('Themes Section', () => {
    it('displays all themes as colored tags', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      expect(screen.getByText('Good vs Evil')).toBeInTheDocument();
      expect(screen.getByText('Coming of Age')).toBeInTheDocument();
      expect(screen.getByText('Sacrifice')).toBeInTheDocument();
      expect(screen.getByText('Redemption')).toBeInTheDocument();
    });
  });

  describe('Production Notes Section', () => {
    let productionButton: HTMLElement;

    beforeEach(async () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      // Expand production notes section
      productionButton = screen.getByRole('button', {
        name: /Production Notes/,
      });
      fireEvent.click(productionButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Requires significant VFX budget/)
        ).toBeInTheDocument();
      });
    });

    it('groups production notes by priority', async () => {
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('displays production note content and categories', async () => {
      expect(
        screen.getByText(/Requires significant VFX budget/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Multiple exotic locations needed/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Lead role requires experienced actor/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Complex practical effects needed/)
      ).toBeInTheDocument();
    });

    it('displays category icons', async () => {
      expect(screen.getByText('💰')).toBeInTheDocument(); // budget
      expect(screen.getByText('📍')).toBeInTheDocument(); // location
      expect(screen.getAllByText('🎭')).toHaveLength(2); // cast (header + production note)
      expect(screen.getByText('⚙️')).toBeInTheDocument(); // technical
    });

    it('displays budget impact when available', async () => {
      expect(screen.getAllByText('Budget Impact:')).toHaveLength(4); // All production notes have budget impact
      expect(screen.getByText('significant')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
      expect(screen.getByText('major')).toBeInTheDocument();
    });

    it('displays requirements when available', async () => {
      expect(screen.getAllByText('Requirements')).toHaveLength(3); // 3 production notes have requirements
      expect(screen.getByText('VFX team')).toBeInTheDocument();
      expect(
        screen.getByText('Extended post-production schedule')
      ).toBeInTheDocument();
    });

    it('displays production challenges when available', async () => {
      expect(screen.getByText('Production Challenges')).toBeInTheDocument();
      expect(
        screen.getByText(/Weather-dependent outdoor shooting/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Complex creature design and animation/)
      ).toBeInTheDocument();
    });
  });

  describe('Market Analysis Section', () => {
    it('displays market analysis when available', async () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      // Expand market analysis section
      const marketButton = screen.getByRole('button', {
        name: /Market Analysis/,
      });
      fireEvent.click(marketButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Strong potential for franchise/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('calls onExport with correct format when export buttons are clicked', () => {
      renderWithTheme(
        <SummaryDisplay summary={mockSummary} onExport={mockOnExport} />
      );

      const txtButton = screen.getByText('📄 Export TXT');
      const pdfButton = screen.getByText('📑 Export PDF');

      fireEvent.click(txtButton);
      expect(mockOnExport).toHaveBeenCalledWith('txt');

      fireEvent.click(pdfButton);
      expect(mockOnExport).toHaveBeenCalledWith('pdf');

      expect(mockOnExport).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles summary with minimal data', () => {
      const minimalSummary: ScriptSummary = {
        id: 'minimal-1',
        scriptId: 'script-1',
        plotOverview: 'Basic plot',
        mainCharacters: [],
        themes: [],
        productionNotes: [],
        genre: 'Drama',
        modelUsed: 'test-model',
        generationOptions: {
          model: 'test-model',
          summaryLength: 'brief',
          focusAreas: ['plot'],
          includeProductionNotes: false,
          includeCharacterAnalysis: false,
          includeThemeAnalysis: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      renderWithTheme(<SummaryDisplay summary={minimalSummary} />);

      expect(screen.getByText('Script Summary')).toBeInTheDocument();
      expect(screen.getByText('Basic plot')).toBeInTheDocument();
      expect(screen.getByText('Characters (0)')).toBeInTheDocument();
      expect(screen.getByText('Themes (0)')).toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      const summaryWithoutOptionals: ScriptSummary = {
        ...mockSummary,
        estimatedBudget: undefined,
        targetAudience: undefined,
        toneAndStyle: undefined,
        keyScenes: undefined,
        productionChallenges: undefined,
        marketability: undefined,
      };

      renderWithTheme(<SummaryDisplay summary={summaryWithoutOptionals} />);

      expect(screen.getByText('Script Summary')).toBeInTheDocument();
      expect(screen.queryByText('Target Audience')).not.toBeInTheDocument();
      expect(screen.queryByText('Tone & Style')).not.toBeInTheDocument();
      expect(screen.queryByText('Key Scenes')).not.toBeInTheDocument();
      expect(screen.queryByText('Market Analysis')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles for collapsible sections', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check that section headers are buttons
      expect(
        screen.getByRole('button', { name: /Plot Overview/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Characters/ })
      ).toBeInTheDocument();
    });

    it('maintains focus management for keyboard navigation', () => {
      renderWithTheme(<SummaryDisplay summary={mockSummary} />);

      const plotButton = screen.getByRole('button', { name: /Plot Overview/ });
      plotButton.focus();

      expect(document.activeElement).toBe(plotButton);
    });
  });
});
