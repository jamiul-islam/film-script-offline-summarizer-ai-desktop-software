import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExportProgressModal } from '../ExportProgressModal';
import { ThemeProvider } from '../ThemeProvider';
import type { ExportProgress } from '../../services/export';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider enableAnimations={false}>{component}</ThemeProvider>
  );
};

describe('ExportProgressModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('does not render when closed', () => {
      renderWithTheme(
        <ExportProgressModal
          isOpen={false}
          progress={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Exporting Summary')).not.toBeInTheDocument();
    });

    it('renders when open with default title', () => {
      const progress: ExportProgress = {
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Exporting Summary')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      const progress: ExportProgress = {
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
          title="Custom Export Title"
        />
      );

      expect(screen.getByText('Custom Export Title')).toBeInTheDocument();
    });
  });

  describe('Progress States', () => {
    it('displays preparing stage correctly', () => {
      const progress: ExportProgress = {
        stage: 'preparing',
        progress: 0,
        message: 'Preparing export...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('📋')).toBeInTheDocument(); // preparing icon
      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('Preparing export...')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays formatting stage correctly', () => {
      const progress: ExportProgress = {
        stage: 'formatting',
        progress: 30,
        message: 'Formatting content...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('📝')).toBeInTheDocument(); // formatting icon
      expect(screen.getByText('Formatting')).toBeInTheDocument();
      expect(screen.getByText('Formatting content...')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('displays generating stage correctly', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 70,
        message: 'Generating PDF...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('⚙️')).toBeInTheDocument(); // generating icon
      expect(screen.getByText('Generating')).toBeInTheDocument();
      expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('displays complete stage correctly', () => {
      const progress: ExportProgress = {
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('✅')).toBeInTheDocument(); // complete icon
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(
        screen.getByText('Export completed successfully')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Export completed successfully!')
      ).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('displays error stage correctly', () => {
      const progress: ExportProgress = {
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Network connection failed',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('❌')).toBeInTheDocument(); // error icon
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Export failed')).toBeInTheDocument();
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('shows progress bar for non-error states', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 45,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('hides progress bar for error state', () => {
      const progress: ExportProgress = {
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Something went wrong',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked (complete state)', () => {
      const progress: ExportProgress = {
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Done button is clicked', () => {
      const progress: ExportProgress = {
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Close button is clicked (error state)', () => {
      const progress: ExportProgress = {
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Something went wrong',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Cancel button is clicked', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 50,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not show cancel button when onCancel is not provided', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 50,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('does not show cancel button for complete state', () => {
      const progress: ExportProgress = {
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('does not show cancel button for error state', () => {
      const progress: ExportProgress = {
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: 'Something went wrong',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked (complete state)', () => {
      const progress: ExportProgress = {
        stage: 'complete',
        progress: 100,
        message: 'Export completed successfully',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      // Click on the backdrop (the outer div)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when backdrop is clicked during processing', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 50,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      // Click on the backdrop (the outer div)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles null progress gracefully', () => {
      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Exporting Summary')).toBeInTheDocument();
      // Should not crash and should still show the modal structure
    });

    it('handles progress without error message', () => {
      const progress: ExportProgress = {
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        // no error property
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Export failed')).toBeInTheDocument();
      // Should not crash even without error message
    });
  });

  describe('Accessibility', () => {
    it('has proper modal structure', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 50,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      // Should have proper modal structure for screen readers
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('prevents interaction with background content', () => {
      const progress: ExportProgress = {
        stage: 'generating',
        progress: 50,
        message: 'Generating...',
      };

      renderWithTheme(
        <ExportProgressModal
          isOpen={true}
          progress={progress}
          onClose={mockOnClose}
        />
      );

      // Modal should have backdrop that prevents interaction
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });
  });
});
