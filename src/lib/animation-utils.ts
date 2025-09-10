/**
 * Animation utility functions and class generators for consistent animations
 * across components. Reduces code duplication and ensures consistent timing.
 */

/**
 * Standard animation durations for consistent timing
 */
export const ANIMATION_DURATION = {
  fast: 150,        // Quick interactions like button hovers
  normal: 300,      // Standard hover effects
  slow: 500,        // Complex transitions
  slowest: 700,     // Loading states and complex effects
  ultra: 1000       // Geometric animations and shine effects
} as const;

/**
 * Standard easing curves for different animation types
 */
export const ANIMATION_EASING = {
  default: 'ease-out',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const;

/**
 * Card animation class generator
 * Provides consistent hover effects for card components
 */
export function cardAnimation({
  hoverTranslate = 'hover:-translate-y-1',
  hoverShadow = 'hover:shadow-xl',
  hoverScale = '',
  duration = ANIMATION_DURATION.normal
}: {
  hoverTranslate?: string;
  hoverShadow?: string;
  hoverScale?: string;
  duration?: number;
} = {}) {
  const scaleClass = hoverScale ? ` ${hoverScale}` : '';
  return `transition-all duration-${duration} ${hoverTranslate} ${hoverShadow}${scaleClass}`;
}

/**
 * World card specific animation (more dramatic effects)
 */
export function worldCardAnimation() {
  return cardAnimation({
    hoverTranslate: 'hover:-translate-y-2',
    hoverShadow: 'hover:shadow-2xl',
    hoverScale: 'hover:scale-[1.02]',
    duration: ANIMATION_DURATION.slow
  });
}

/**
 * Folder/Entity card animation (subtle effects)
 */
export function itemCardAnimation() {
  return cardAnimation({
    hoverTranslate: 'hover:-translate-y-1',
    hoverShadow: 'hover:shadow-xl',
    duration: ANIMATION_DURATION.normal
  });
}

/**
 * Gradient overlay animation for cards
 */
export function gradientOverlay({
  gradient = 'bg-gradient-to-br',
  from = 'from-blue-50/50',
  to = 'to-transparent',
  darkFrom = 'dark:from-blue-900/20',
  duration = ANIMATION_DURATION.normal
}: {
  gradient?: string;
  from?: string;
  to?: string;
  darkFrom?: string;
  duration?: number;
} = {}) {
  return {
    className: `absolute inset-0 ${gradient} ${from} ${to} ${darkFrom} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-${duration}`,
    style: {}
  };
}

/**
 * Floating orbs animation for world cards
 */
export function floatingOrbs() {
  return [
    { 
      className: "absolute top-4 right-4 w-2 h-2 bg-brand-400/40 rounded-full animate-pulse",
      style: { animationDelay: '0ms' }
    },
    {
      className: "absolute top-8 right-12 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse", 
      style: { animationDelay: '300ms' }
    },
    {
      className: "absolute bottom-8 left-6 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse",
      style: { animationDelay: '600ms' }
    },
    {
      className: "absolute bottom-12 right-8 w-1 h-1 bg-brand-400/30 rounded-full animate-pulse",
      style: { animationDelay: '900ms' }
    }
  ];
}

/**
 * Geometric pattern animation for world cards
 */
export function geometricPattern() {
  return [
    {
      className: "absolute -top-4 -right-4 w-16 h-16 border border-brand-200/30 dark:border-brand-700/30 rounded-full group-hover:rotate-12 transition-transform duration-1000"
    },
    {
      className: "absolute -bottom-4 -left-4 w-12 h-12 border border-purple-200/30 dark:border-purple-700/30 rounded-full group-hover:-rotate-12 transition-transform duration-1000"
    },
    {
      className: "absolute top-1/2 right-0 w-8 h-8 border border-blue-200/30 dark:border-blue-700/30 rounded-full group-hover:rotate-45 transition-transform duration-1000"
    }
  ];
}

/**
 * Shine effect animation
 */
export function shineEffect() {
  return {
    containerClass: "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
    shineClass: "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
  };
}

/**
 * Button hover animation
 */
export function buttonHover({
  scale = 'hover:scale-105',
  shadow = 'hover:shadow-lg',
  duration = ANIMATION_DURATION.fast
}: {
  scale?: string;
  shadow?: string; 
  duration?: number;
} = {}) {
  return `${scale} ${shadow} transition-transform duration-${duration}`;
}

/**
 * Loading spinner animation
 */
export function loadingSpinner({
  size = 'w-8 h-8',
  borderWidth = 'border-4',
  colors = {
    base: 'border-gray-200 dark:border-neutral-700',
    active: 'border-t-blue-600'
  }
}: {
  size?: string;
  borderWidth?: string;
  colors?: {
    base: string;
    active: string;
  };
} = {}) {
  return `${size} ${borderWidth} ${colors.base} ${colors.active} rounded-full animate-spin`;
}

/**
 * Pulse dots animation for loading states
 */
export function pulseDots() {
  return [
    {
      className: "w-2 h-2 bg-blue-600 rounded-full animate-pulse",
      style: { animationDelay: '0ms' }
    },
    {
      className: "w-2 h-2 bg-blue-600 rounded-full animate-pulse", 
      style: { animationDelay: '150ms' }
    },
    {
      className: "w-2 h-2 bg-blue-600 rounded-full animate-pulse",
      style: { animationDelay: '300ms' }
    }
  ];
}

/**
 * Text color transition for hover effects
 */
export function textColorTransition(baseColor?: string, hoverColor?: string) {
  const base = baseColor || 'text-gray-900 dark:text-gray-100';
  const hover = hoverColor || 'group-hover:text-brand-700 dark:group-hover:text-brand-400';
  return `${base} ${hover} transition-colors duration-${ANIMATION_DURATION.normal}`;
}

/**
 * Icon background transition for folder colors
 */
export function iconBackgroundTransition(colorScheme: {
  iconBg: string;
  textHover: string;
}) {
  return {
    iconBg: `${colorScheme.iconBg} transition-colors`,
    textHover: `${colorScheme.textHover} transition-colors`
  };
}

/**
 * Staggered fade-in animation for lists
 */
export function staggeredFadeIn(index: number, baseDelay = 100) {
  return {
    className: "animate-fade-in",
    style: { 
      animationDelay: `${index * baseDelay}ms`,
      animationFillMode: 'both'
    }
  };
}