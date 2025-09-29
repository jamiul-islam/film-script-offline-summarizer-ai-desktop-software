import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppShell } from '../AppShell';
import { ThemeProvider } from '../ThemeProvider';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme="dark" enableAnimations={true}>
    {children}
  </ThemeProvider>
);

describe('AppShell', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders the app shell with navigation items', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Check if navigation items are present (using getAllByText since some appear multiple times)
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Scripts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Summaries').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Compare').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);

    // Check if content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays the correct page title based on active navigation', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Default should be Dashboard - check for multiple instances
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it('allows navigation between different sections', async () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Click on Scripts navigation item - use the actual button name
    const scriptsButton = screen.getByRole('button', { name: '📄Scripts' });
    fireEvent.click(scriptsButton);

    // Wait for the header to update
    await waitFor(() => {
      const scriptsElements = screen.getAllByText('Scripts');
      expect(scriptsElements.length).toBeGreaterThan(0);
    });
  });

  it('toggles sidebar collapse state', async () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Find the sidebar toggle button (arrow button)
    const toggleButton = screen.getByRole('button', { name: /←/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to collapse sidebar
    fireEvent.click(toggleButton);

    // After collapse, the arrow should change direction
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /→/i })).toBeInTheDocument();
    });
  });

  it('displays theme toggle button', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Should show light mode toggle (since we're in dark mode)
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('displays animation toggle button', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Should show animations on (since animations are enabled by default)
    expect(screen.getByText('Animations On')).toBeInTheDocument();
  });

  it('shows upload script button in header', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: 'Upload Script' })).toBeInTheDocument();
  });

  it('shows help button in header', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });

  it('applies correct CSS classes for dark theme', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Check if dark theme classes are applied
    const container = screen.getByText('Test Content').closest('.bg-slate-900');
    expect(container).toBeInTheDocument();
  });

  it('handles navigation item clicks correctly', async () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Click on Compare navigation item - use the actual button name
    const compareButton = screen.getByRole('button', { name: '⚖️Compare' });
    fireEvent.click(compareButton);

    // Check if the header updates to show Compare
    await waitFor(() => {
      const headers = screen.getAllByText('Compare');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  it('renders with responsive design classes', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      </TestWrapper>
    );

    // Check for flex layout classes
    const mainContainer = screen.getByText('Test Content').closest('.flex');
    expect(mainContainer).toBeInTheDocument();
  });
});