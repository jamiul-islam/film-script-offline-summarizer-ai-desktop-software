// Theme configuration for the Script Summarizer App
// This file provides TypeScript types and utilities for the dark theme

export interface ThemeColors {
  dark: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export interface AnimationConfig {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    smooth: string;
    bounce: string;
    inOut: string;
  };
}

export const themeConfig = {
  colors: {
    dark: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    accent: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      inOut: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
} as const;

// CSS Custom Property Utilities
export const cssVars = {
  // Background colors
  bgPrimary: 'var(--color-bg-primary)',
  bgSecondary: 'var(--color-bg-secondary)',
  bgTertiary: 'var(--color-bg-tertiary)',
  bgElevated: 'var(--color-bg-elevated)',

  // Text colors
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textMuted: 'var(--color-text-muted)',

  // Border colors
  borderPrimary: 'var(--color-border-primary)',
  borderSecondary: 'var(--color-border-secondary)',
  borderFocus: 'var(--color-border-focus)',

  // Accent colors
  accentPrimary: 'var(--color-accent-primary)',
  accentSecondary: 'var(--color-accent-secondary)',
  accentHover: 'var(--color-accent-hover)',

  // Status colors
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',

  // Shadows
  shadowSoft: 'var(--shadow-soft)',
  shadowSoftLg: 'var(--shadow-soft-lg)',
  shadowGlow: 'var(--shadow-glow)',
  shadowGlowLg: 'var(--shadow-glow-lg)',

  // Animation
  durationFast: 'var(--duration-fast)',
  durationNormal: 'var(--duration-normal)',
  durationSlow: 'var(--duration-slow)',
  easeSmooth: 'var(--ease-smooth)',
  easeBounce: 'var(--ease-bounce)',
  easeInOut: 'var(--ease-in-out)',
} as const;

// Animation presets for common use cases
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  bounceGentle: 'animate-bounce-gentle',
  pulseSoft: 'animate-pulse-soft',
  float: 'animate-float',
} as const;

// Component style presets
export const componentStyles = {
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  },
  card: {
    default: 'card',
    hover: 'card-hover',
    elevated: 'card-elevated',
  },
  input: {
    default: 'input',
    error: 'input-error',
  },
  nav: {
    item: 'nav-item',
    active: 'nav-item-active',
  },
  interactive: {
    default: 'interactive',
    subtle: 'interactive-subtle',
  },
  text: {
    gradient: 'text-gradient',
    glow: 'text-glow',
  },
  layout: {
    container: 'container-app',
    header: 'header-app',
    main: 'main-app',
    sidebar: 'sidebar-app',
    content: 'content-app',
  },
} as const;

// Utility function to combine classes with proper spacing
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// Theme context type for React components
export interface ThemeContextType {
  colors: ThemeColors;
  animation: AnimationConfig;
  cssVars: typeof cssVars;
  animations: typeof animations;
  componentStyles: typeof componentStyles;
}
