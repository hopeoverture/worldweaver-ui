/**
 * Component Utility Functions
 * Shared utilities for consistent component behavior using design tokens
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Combines class names efficiently
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Standard component size variants mapped to consistent spacing
 */
export const sizeVariants = {
  xs: {
    padding: 'px-2 py-1',
    fontSize: 'text-xs',
    height: 'h-6',
  },
  sm: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-sm',
    height: 'h-8',
  },
  md: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    height: 'h-10',
  },
  lg: {
    padding: 'px-6 py-3',
    fontSize: 'text-base',
    height: 'h-12',
  },
  xl: {
    padding: 'px-8 py-4',
    fontSize: 'text-lg',
    height: 'h-14',
  },
} as const;

/**
 * Standard focus ring styles using design tokens
 */
export const focusRing = {
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
  error: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2',
  success: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2',
  warning: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-500 focus-visible:ring-offset-2',
} as const;

/**
 * Standard disabled state styles
 */
export const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

/**
 * Standard loading state styles
 */
export const loadingStyles = 'data-[loading=true]:opacity-75 data-[loading=true]:cursor-wait';

/**
 * Standard transition styles using design tokens
 */
export const transitions = {
  default: 'transition-colors duration-normal ease-standard',
  all: 'transition-all duration-normal ease-standard',
  fast: 'transition-colors duration-fast ease-standard',
  slow: 'transition-colors duration-slow ease-standard',
  transform: 'transition-transform duration-normal ease-standard',
  opacity: 'transition-opacity duration-normal ease-standard',
} as const;

/**
 * Standard hover effects
 */
export const hoverEffects = {
  scale: 'hover:scale-105 active:scale-95',
  lift: 'hover:shadow-lg hover:-translate-y-1',
  subtle: 'hover:opacity-80',
  glow: 'hover:shadow-xl',
} as const;

/**
 * Button variant styles using design tokens
 */
export const buttonVariants = {
  primary: cn(
    'bg-brand-600 text-white shadow-sm',
    'hover:bg-brand-700 hover:shadow-md',
    'active:bg-brand-800',
    'disabled:bg-brand-300'
  ),
  secondary: cn(
    'bg-neutral-100 text-neutral-900 shadow-sm',
    'hover:bg-neutral-200 hover:shadow-md',
    'active:bg-neutral-300',
    'dark:bg-neutral-800 dark:text-neutral-100',
    'dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
  ),
  outline: cn(
    'border border-neutral-300 bg-transparent text-neutral-700 shadow-sm',
    'hover:bg-neutral-50 hover:shadow-md',
    'active:bg-neutral-100',
    'dark:border-neutral-600 dark:text-neutral-300',
    'dark:hover:bg-neutral-800 dark:active:bg-neutral-700'
  ),
  ghost: cn(
    'bg-transparent text-neutral-700',
    'hover:bg-neutral-100',
    'active:bg-neutral-200',
    'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-700'
  ),
  destructive: cn(
    'bg-error-600 text-white shadow-sm',
    'hover:bg-error-700 hover:shadow-md',
    'active:bg-error-800',
    'disabled:bg-error-300'
  ),
  success: cn(
    'bg-success-600 text-white shadow-sm',
    'hover:bg-success-700 hover:shadow-md',
    'active:bg-success-800',
    'disabled:bg-success-300'
  ),
  warning: cn(
    'bg-warning-600 text-white shadow-sm',
    'hover:bg-warning-700 hover:shadow-md',
    'active:bg-warning-800',
    'disabled:bg-warning-300'
  ),
} as const;

/**
 * Input variant styles using design tokens
 */
export const inputVariants = {
  default: cn(
    'block w-full rounded-md border border-neutral-300 bg-white px-3 py-2',
    'text-neutral-900 placeholder:text-neutral-400',
    'focus:border-brand-600 focus:ring-1 focus:ring-brand-600',
    'disabled:bg-neutral-50 disabled:text-neutral-500',
    'dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
    'dark:placeholder:text-neutral-500 dark:focus:border-brand-500',
    'dark:disabled:bg-neutral-800'
  ),
  error: cn(
    'block w-full rounded-md border border-error-300 bg-white px-3 py-2',
    'text-neutral-900 placeholder:text-neutral-400',
    'focus:border-error-500 focus:ring-1 focus:ring-error-500',
    'dark:border-error-600 dark:bg-neutral-900 dark:text-neutral-100'
  ),
  success: cn(
    'block w-full rounded-md border border-success-300 bg-white px-3 py-2',
    'text-neutral-900 placeholder:text-neutral-400',
    'focus:border-success-500 focus:ring-1 focus:ring-success-500',
    'dark:border-success-600 dark:bg-neutral-900 dark:text-neutral-100'
  ),
} as const;

/**
 * Card variant styles using design tokens
 */
export const cardVariants = {
  default: cn(
    'rounded-xl border border-neutral-200 bg-white p-6 shadow-card',
    'dark:border-neutral-800 dark:bg-neutral-900'
  ),
  elevated: cn(
    'rounded-xl border border-neutral-200 bg-white p-6 shadow-lg',
    'dark:border-neutral-800 dark:bg-neutral-900'
  ),
  interactive: cn(
    'rounded-xl border border-neutral-200 bg-white p-6 shadow-card',
    'cursor-pointer transition-all duration-normal',
    'hover:shadow-xl hover:-translate-y-1',
    'dark:border-neutral-800 dark:bg-neutral-900'
  ),
  outline: cn(
    'rounded-xl border border-neutral-300 bg-transparent p-6',
    'dark:border-neutral-600'
  ),
} as const;

/**
 * Badge variant styles using design tokens
 */
export const badgeVariants = {
  default: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-neutral-100 text-neutral-800',
    'dark:bg-neutral-800 dark:text-neutral-200'
  ),
  primary: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-brand-100 text-brand-800',
    'dark:bg-brand-900/50 dark:text-brand-200'
  ),
  success: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-success-100 text-success-800',
    'dark:bg-success-900/50 dark:text-success-200'
  ),
  warning: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-warning-100 text-warning-800',
    'dark:bg-warning-900/50 dark:text-warning-200'
  ),
  error: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'bg-error-100 text-error-800',
    'dark:bg-error-900/50 dark:text-error-200'
  ),
  outline: cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    'border border-neutral-300 bg-transparent text-neutral-700',
    'dark:border-neutral-600 dark:text-neutral-300'
  ),
} as const;

/**
 * Alert variant styles using design tokens
 */
export const alertVariants = {
  default: cn(
    'rounded-lg border border-neutral-200 bg-neutral-50 p-4',
    'dark:border-neutral-700 dark:bg-neutral-800/50'
  ),
  info: cn(
    'rounded-lg border border-info-200 bg-info-50 p-4',
    'dark:border-info-700 dark:bg-info-900/50'
  ),
  success: cn(
    'rounded-lg border border-success-200 bg-success-50 p-4',
    'dark:border-success-700 dark:bg-success-900/50'
  ),
  warning: cn(
    'rounded-lg border border-warning-200 bg-warning-50 p-4',
    'dark:border-warning-700 dark:bg-warning-900/50'
  ),
  error: cn(
    'rounded-lg border border-error-200 bg-error-50 p-4',
    'dark:border-error-700 dark:bg-error-900/50'
  ),
} as const;

/**
 * Typography utility classes using design tokens
 */
export const typography = {
  // Headings
  h1: 'text-4xl font-bold leading-tight text-foreground',
  h2: 'text-3xl font-bold leading-tight text-foreground',
  h3: 'text-2xl font-semibold leading-snug text-foreground',
  h4: 'text-xl font-semibold leading-snug text-foreground',
  h5: 'text-lg font-medium leading-normal text-foreground',
  h6: 'text-base font-medium leading-normal text-foreground',
  
  // Body text
  body: 'text-base leading-normal text-foreground',
  bodyLarge: 'text-lg leading-relaxed text-foreground',
  bodySmall: 'text-sm leading-normal text-secondary',
  
  // Utility text
  caption: 'text-xs leading-normal text-tertiary',
  label: 'text-sm font-medium leading-normal text-foreground',
  
  // Links
  link: cn(
    'text-brand-600 underline-offset-4',
    'hover:underline hover:text-brand-700',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
    'dark:text-brand-400 dark:hover:text-brand-300'
  ),
} as const;

/**
 * Layout utility classes
 */
export const layout = {
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  containerSmall: 'mx-auto max-w-4xl px-4 sm:px-6 lg:px-8',
  containerLarge: 'mx-auto max-w-none px-4 sm:px-6 lg:px-8',
  
  // Flexbox utilities
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',
  
  // Grid utilities
  gridCols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  gridCols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  gridCols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
} as const;

/**
 * Animation presets using design tokens
 */
export const animations = {
  fadeIn: 'animate-[fade-in_0.5s_ease-out_forwards]',
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  
  // Custom animation utilities
  scaleIn: 'animate-[scale-in_0.2s_ease-out]',
  slideUp: 'animate-[slide-up_0.3s_ease-out]',
  slideDown: 'animate-[slide-down_0.3s_ease-out]',
} as const;

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Type exports for external usage
export type SizeVariant = keyof typeof sizeVariants;
export type ButtonVariant = keyof typeof buttonVariants;
export type InputVariant = keyof typeof inputVariants;
export type CardVariant = keyof typeof cardVariants;
export type BadgeVariant = keyof typeof badgeVariants;
export type AlertVariant = keyof typeof alertVariants;