import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  themeConfig,
  cssVars,
  animations,
  componentStyles,
  ThemeContextType,
} from '../styles/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'dark' | 'light';
  enableAnimations?: boolean;
}

interface ThemeState {
  theme: 'dark' | 'light';
  animationsEnabled: boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleAnimations: () => void;
}

const ThemeContext = createContext<(ThemeContextType & ThemeState) | undefined>(
  undefined
);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
  enableAnimations = true,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(defaultTheme);
  const [animationsEnabled, setAnimationsEnabled] = useState(enableAnimations);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', theme);

    // Apply animation preference
    if (animationsEnabled) {
      root.classList.remove('reduce-motion');
    } else {
      root.classList.add('reduce-motion');
    }
  }, [theme, animationsEnabled]);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('script-summarizer-theme') as
      | 'dark'
      | 'light'
      | null;
    const savedAnimations = localStorage.getItem(
      'script-summarizer-animations'
    );

    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    }

    if (savedAnimations !== null) {
      setAnimationsEnabled(savedAnimations === 'true');
    }
  }, []);

  // Save theme preference to localStorage
  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('script-summarizer-theme', newTheme);
  };

  // Toggle animations and save preference
  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    localStorage.setItem('script-summarizer-animations', newValue.toString());
  };

  const contextValue: ThemeContextType & ThemeState = {
    colors: themeConfig.colors,
    animation: themeConfig.animation,
    cssVars,
    animations,
    componentStyles,
    theme,
    animationsEnabled,
    setTheme: handleSetTheme,
    toggleAnimations,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hook for animation classes
export const useAnimations = () => {
  const { animationsEnabled, animations } = useTheme();

  const getAnimationClass = (animationName: keyof typeof animations) => {
    return animationsEnabled ? animations[animationName] : '';
  };

  const withAnimation = (
    baseClass: string,
    animationName: keyof typeof animations
  ) => {
    return animationsEnabled
      ? `${baseClass} ${animations[animationName]}`
      : baseClass;
  };

  return {
    enabled: animationsEnabled,
    getAnimationClass,
    withAnimation,
  };
};

// Utility hook for component styles
export const useComponentStyles = () => {
  const { componentStyles } = useTheme();
  return componentStyles;
};
