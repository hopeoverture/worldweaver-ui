/**
 * Design Token TypeScript Exports
 * Programmatic access to design system values
 */

// Color Tokens
export const colors = {
  // Brand colors
  brand: {
    50: 'var(--brand-50)',
    100: 'var(--brand-100)',
    200: 'var(--brand-200)',
    300: 'var(--brand-300)',
    400: 'var(--brand-400)',
    500: 'var(--brand-500)',
    600: 'var(--brand-600)',
    700: 'var(--brand-700)',
    800: 'var(--brand-800)',
    900: 'var(--brand-900)',
    950: 'var(--brand-950)',
  },
  
  // Semantic colors
  success: {
    50: 'var(--success-50)',
    500: 'var(--success-500)',
    600: 'var(--success-600)',
    700: 'var(--success-700)',
  },
  
  warning: {
    50: 'var(--warning-50)',
    500: 'var(--warning-500)',
    600: 'var(--warning-600)',
    700: 'var(--warning-700)',
  },
  
  error: {
    50: 'var(--error-50)',
    500: 'var(--error-500)',
    600: 'var(--error-600)',
    700: 'var(--error-700)',
  },
  
  info: {
    50: 'var(--info-50)',
    500: 'var(--info-500)',
    600: 'var(--info-600)',
    700: 'var(--info-700)',
  },
  
  // Neutral colors
  neutral: {
    50: 'var(--neutral-50)',
    100: 'var(--neutral-100)',
    200: 'var(--neutral-200)',
    300: 'var(--neutral-300)',
    400: 'var(--neutral-400)',
    500: 'var(--neutral-500)',
    600: 'var(--neutral-600)',
    700: 'var(--neutral-700)',
    800: 'var(--neutral-800)',
    900: 'var(--neutral-900)',
    950: 'var(--neutral-950)',
  },
  
  // Semantic aliases
  background: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary: 'var(--bg-tertiary)',
    elevated: 'var(--bg-elevated)',
    overlay: 'var(--bg-overlay)',
  },
  
  foreground: {
    primary: 'var(--fg-primary)',
    secondary: 'var(--fg-secondary)',
    tertiary: 'var(--fg-tertiary)',
    quaternary: 'var(--fg-quaternary)',
    disabled: 'var(--fg-disabled)',
    inverse: 'var(--fg-inverse)',
  },
  
  border: {
    primary: 'var(--border-primary)',
    secondary: 'var(--border-secondary)',
    focus: 'var(--border-focus)',
    error: 'var(--border-error)',
    success: 'var(--border-success)',
    warning: 'var(--border-warning)',
  },
} as const;

// Spacing Tokens
export const spacing = {
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  7: 'var(--space-7)',
  8: 'var(--space-8)',
  9: 'var(--space-9)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
  20: 'var(--space-20)',
} as const;

// Typography Tokens
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  
  fontSize: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
    '4xl': 'var(--text-4xl)',
    '5xl': 'var(--text-5xl)',
  },
  
  lineHeight: {
    none: 'var(--leading-none)',
    tight: 'var(--leading-tight)',
    snug: 'var(--leading-snug)',
    normal: 'var(--leading-normal)',
    relaxed: 'var(--leading-relaxed)',
    loose: 'var(--leading-loose)',
  },
  
  fontWeight: {
    thin: 'var(--font-thin)',
    light: 'var(--font-light)',
    normal: 'var(--font-normal)',
    medium: 'var(--font-medium)',
    semibold: 'var(--font-semibold)',
    bold: 'var(--font-bold)',
    extrabold: 'var(--font-extrabold)',
    black: 'var(--font-black)',
  },
} as const;

// Border Radius Tokens
export const borderRadius = {
  none: 'var(--radius-none)',
  sm: 'var(--radius-sm)',
  base: 'var(--radius-base)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  '3xl': 'var(--radius-3xl)',
  full: 'var(--radius-full)',
  
  // Semantic radius
  button: 'var(--radius-button)',
  card: 'var(--radius-card)',
  modal: 'var(--radius-modal)',
  input: 'var(--radius-input)',
} as const;

// Shadow Tokens
export const shadows = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  base: 'var(--shadow-base)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  
  // Semantic shadows
  card: 'var(--shadow-card)',
  modal: 'var(--shadow-modal)',
  dropdown: 'var(--shadow-dropdown)',
  tooltip: 'var(--shadow-tooltip)',
  
  // Focus shadows
  focus: 'var(--shadow-focus)',
  focusError: 'var(--shadow-focus-error)',
  focusSuccess: 'var(--shadow-focus-success)',
} as const;

// Motion Tokens
export const motion = {
  duration: {
    instant: 'var(--duration-instant)',
    fast: 'var(--duration-fast)',
    normal: 'var(--duration-normal)',
    slow: 'var(--duration-slow)',
    slower: 'var(--duration-slower)',
  },
  
  easing: {
    linear: 'var(--ease-linear)',
    in: 'var(--ease-in)',
    out: 'var(--ease-out)',
    inOut: 'var(--ease-in-out)',
    standard: 'var(--ease-standard)',
    emphasized: 'var(--ease-emphasized)',
    bounce: 'var(--ease-bounce)',
  },
} as const;

// Z-Index Tokens
export const zIndex = {
  hide: 'var(--z-hide)',
  base: 'var(--z-base)',
  docked: 'var(--z-docked)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  banner: 'var(--z-banner)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  skiplink: 'var(--z-skiplink)',
  toast: 'var(--z-toast)',
  tooltip: 'var(--z-tooltip)',
} as const;

// Component-specific token groups
export const components = {
  button: {
    borderRadius: borderRadius.button,
    shadow: shadows.sm,
    focusShadow: shadows.focus,
  },
  
  card: {
    borderRadius: borderRadius.card,
    shadow: shadows.card,
    background: colors.background.elevated,
  },
  
  modal: {
    borderRadius: borderRadius.modal,
    shadow: shadows.modal,
    background: colors.background.elevated,
    overlay: colors.background.overlay,
    zIndex: zIndex.modal,
  },
  
  input: {
    borderRadius: borderRadius.input,
    borderColor: colors.border.primary,
    focusBorderColor: colors.border.focus,
    focusShadow: shadows.focus,
  },
} as const;

// Helper functions for theme management
export const themes = {
  setTheme: (theme: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    // Store preference
    localStorage.setItem('theme', theme);
  },
  
  getTheme: (): 'light' | 'dark' | 'auto' => {
    if (typeof window === 'undefined') return 'auto';
    
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
    return stored || 'auto';
  },
  
  getSystemTheme: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  getCurrentTheme: (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    
    const theme = themes.getTheme();
    
    if (theme === 'auto') {
      return themes.getSystemTheme();
    }
    
    return theme;
  },
} as const;

// Export everything as a default object
export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  zIndex,
  components,
  themes,
} as const;

export default tokens;