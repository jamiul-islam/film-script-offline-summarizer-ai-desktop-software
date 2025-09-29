import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider';

// Test component that uses the theme
const TestComponent: React.FC = () => {
  const { theme, animationsEnabled, setTheme, toggleAnimations } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="animations-enabled">{animationsEnabled.toString()}</div>
      <button
        data-testid="toggle-theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        Toggle Theme
      </button>
      <button data-testid="toggle-animations" onClick={toggleAnimations}>
        Toggle Animations
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide default dark theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('true');
  });

  it('should toggle theme when setTheme is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');

    // Initially dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Toggle to light
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Toggle back to dark
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('should toggle animations when toggleAnimations is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-animations');

    // Initially enabled
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('true');

    // Toggle to disabled
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('false');

    // Toggle back to enabled
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('true');
  });

  it('should apply theme class to document root', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should persist theme preference to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleButton);

    expect(localStorage.getItem('script-summarizer-theme')).toBe('light');
  });

  it('should persist animation preference to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-animations');
    fireEvent.click(toggleButton);

    expect(localStorage.getItem('script-summarizer-animations')).toBe('false');
  });
});
