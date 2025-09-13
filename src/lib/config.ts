/**
 * Application Configuration Management
 * 
 * Centralizes all configuration values, feature flags, and constants.
 * Replaces hardcoded values throughout the application with type-safe configuration.
 */

import { getEnv } from './env-validation';

// Application constants
export const APP_CONFIG = {
  // Application metadata
  APP_NAME: 'WorldWeaver',
  APP_DESCRIPTION: 'Collaborative world-building platform',
  APP_VERSION: '1.0.0',
  
  // API configuration
  API: {
    BASE_URL: '/api',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Database configuration
  DATABASE: {
    MAX_QUERY_LIMIT: 1000,
    DEFAULT_PAGE_SIZE: 20,
    MAX_BATCH_SIZE: 100,
  },

  // UI/UX constants
  UI: {
    // Toast notifications
    TOAST_DURATION: 5000, // 5 seconds (increased from 3.5s based on review)
    TOAST_MAX_VISIBLE: 5,
    
    // Modal and animation timings
    MODAL_ANIMATION_DURATION: 200,
    SKELETON_ANIMATION_DURATION: 1500,
    
    // Grid and layout
    DEFAULT_GRID_COLUMNS: 3,
    MAX_GRID_COLUMNS: 6,
    CARD_MIN_WIDTH: 280,
    
    // Form validation
    DEBOUNCE_DELAY: 500, // Input debouncing
    VALIDATION_DELAY: 300, // Validation feedback delay
  },

  // Content limits
  LIMITS: {
    // Text field limits
    WORLD_NAME_MAX_LENGTH: 100,
    WORLD_DESCRIPTION_MAX_LENGTH: 2000,
    ENTITY_NAME_MAX_LENGTH: 100,
    ENTITY_DESCRIPTION_MAX_LENGTH: 5000,
    TEMPLATE_NAME_MAX_LENGTH: 100,
    TEMPLATE_DESCRIPTION_MAX_LENGTH: 1000,
    FOLDER_NAME_MAX_LENGTH: 100,
    FOLDER_DESCRIPTION_MAX_LENGTH: 500,
    
    // Relationship limits
    RELATIONSHIP_LABEL_MAX_LENGTH: 50,
    RELATIONSHIP_DESCRIPTION_MAX_LENGTH: 200,
    
    // File upload limits
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES_PER_UPLOAD: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'],
    
    // Collection limits
    MAX_ENTITIES_PER_WORLD: 10000,
    MAX_TEMPLATES_PER_WORLD: 100,
    MAX_FOLDERS_PER_WORLD: 50,
    MAX_MEMBERS_PER_WORLD: 50,
  },

  // Performance settings
  PERFORMANCE: {
    // Virtualization thresholds
    VIRTUAL_GRID_THRESHOLD: 50, // Items before virtualization kicks in
    VIRTUAL_SCROLL_ITEM_HEIGHT: 200,
    
    // Lazy loading
    LAZY_LOAD_THRESHOLD: '100px',
    IMAGE_LAZY_LOADING: true,
    
    // Query settings
    STALE_TIME: 5 * 60 * 1000, // 5 minutes
    CACHE_TIME: 10 * 60 * 1000, // 10 minutes
    
    // Debouncing
    SEARCH_DEBOUNCE: 300,
    AUTOSAVE_DEBOUNCE: 2000, // 2 seconds
  },

  // Feature flags
  FEATURES: {
    ENABLE_DARK_MODE: true,
    ENABLE_REAL_TIME_UPDATES: false, // TODO: Implement with Supabase realtime
    ENABLE_COLLABORATION: false, // TODO: Implement collaborative editing
    ENABLE_AI_ASSISTANCE: false, // TODO: Implement AI-powered suggestions
    ENABLE_WORLD_TEMPLATES: false, // TODO: Implement world template system
    ENABLE_ADVANCED_SEARCH: false, // TODO: Implement full-text search
    ENABLE_EXPORT_IMPORT: true,
    ENABLE_RELATIONSHIP_GRAPH: true,
    ENABLE_MEMBER_MANAGEMENT: true,
    ENABLE_WORLD_SHARING: true,
  },

  // Security settings
  SECURITY: {
    // Session settings
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
    
    // Password requirements
    MIN_PASSWORD_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
    
    // Rate limiting (overrides for specific features)
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    
    // Content security
    MAX_HTML_LENGTH: 10000, // Max length for rich text content
    ALLOWED_HTML_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
  },

  // Accessibility settings
  ACCESSIBILITY: {
    // Focus management
    FOCUS_RING_WIDTH: 2,
    FOCUS_RING_COLOR: '#3B82F6', // Blue-500
    
    // Screen reader
    ANNOUNCE_DELAYS: true,
    ANNOUNCEMENT_DELAY: 150,
    
    // Keyboard navigation
    ENABLE_SKIP_LINKS: true,
    ENABLE_FOCUS_TRAPPING: true,
    
    // Color contrast
    MIN_CONTRAST_RATIO: 4.5, // WCAG AA standard
    LARGE_TEXT_CONTRAST_RATIO: 3.0, // WCAG AA for large text
  },
} as const;

/**
 * Environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getEnv();
  
  return {
    // Development vs Production settings
    IS_DEVELOPMENT: env.NODE_ENV === 'development',
    IS_PRODUCTION: env.NODE_ENV === 'production',
    IS_TEST: env.NODE_ENV === 'test',
    
    // Debug settings
    ENABLE_DEBUG_LOGGING: env.NODE_ENV === 'development',
    ENABLE_PERFORMANCE_MONITORING: env.NODE_ENV === 'production',
    ENABLE_ERROR_REPORTING: env.NODE_ENV === 'production',
    
    // API settings
    ENABLE_API_MOCKING: false, // Could be controlled by env var
    API_BASE_URL: env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
    
    // Feature flags that might depend on environment
    ENABLE_ADMIN_FEATURES: env.ADMIN_SEED_ENABLED || false,
    ENABLE_EXPERIMENTAL_FEATURES: env.NODE_ENV === 'development',
  };
}

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(feature: keyof typeof APP_CONFIG.FEATURES): boolean {
  return APP_CONFIG.FEATURES[feature];
}

/**
 * Get UI configuration with responsive breakpoints
 */
export function getUIConfig() {
  return {
    ...APP_CONFIG.UI,
    
    // Responsive breakpoints (Tailwind CSS compatible)
    BREAKPOINTS: {
      SM: 640,
      MD: 768,
      LG: 1024,
      XL: 1280,
      '2XL': 1536,
    },
    
    // Z-index layers
    Z_INDEX: {
      DROPDOWN: 50,
      MODAL_BACKDROP: 100,
      MODAL: 101,
      TOAST: 200,
      TOOLTIP: 300,
    },
  };
}

/**
 * Get performance configuration based on environment
 */
export function getPerformanceConfig() {
  const envConfig = getEnvironmentConfig();
  
  return {
    ...APP_CONFIG.PERFORMANCE,
    
    // Adjust for development vs production
    STALE_TIME: envConfig.IS_DEVELOPMENT ? 30 * 1000 : APP_CONFIG.PERFORMANCE.STALE_TIME, // 30s in dev
    ENABLE_QUERY_DEVTOOLS: envConfig.IS_DEVELOPMENT,
    ENABLE_BUNDLE_ANALYZER: envConfig.IS_DEVELOPMENT,
  };
}

/**
 * Validation rules based on configuration
 */
export function getValidationRules() {
  return {
    // Text length validators
    worldName: {
      minLength: 1,
      maxLength: APP_CONFIG.LIMITS.WORLD_NAME_MAX_LENGTH,
      required: true,
    },
    worldDescription: {
      minLength: 0,
      maxLength: APP_CONFIG.LIMITS.WORLD_DESCRIPTION_MAX_LENGTH,
      required: false,
    },
    entityName: {
      minLength: 1,
      maxLength: APP_CONFIG.LIMITS.ENTITY_NAME_MAX_LENGTH,
      required: true,
    },
    folderName: {
      minLength: 1,
      maxLength: APP_CONFIG.LIMITS.FOLDER_NAME_MAX_LENGTH,
      required: true,
    },
    
    // Password validation
    password: {
      minLength: APP_CONFIG.SECURITY.MIN_PASSWORD_LENGTH,
      requireUppercase: APP_CONFIG.SECURITY.REQUIRE_UPPERCASE,
      requireLowercase: APP_CONFIG.SECURITY.REQUIRE_LOWERCASE,
      requireNumbers: APP_CONFIG.SECURITY.REQUIRE_NUMBERS,
      requireSymbols: APP_CONFIG.SECURITY.REQUIRE_SYMBOLS,
    },
    
    // File upload validation
    fileUpload: {
      maxSize: APP_CONFIG.LIMITS.MAX_FILE_SIZE,
      maxFiles: APP_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD,
      allowedTypes: APP_CONFIG.LIMITS.ALLOWED_FILE_TYPES,
      allowedImageTypes: APP_CONFIG.LIMITS.ALLOWED_IMAGE_TYPES,
    },
  };
}

/**
 * Theme configuration
 */
export function getThemeConfig() {
  return {
    // Color palette
    COLORS: {
      PRIMARY: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        900: '#1e3a8a',
      },
      SUCCESS: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
      },
      WARNING: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
      },
      ERROR: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
      },
    },
    
    // Typography scale
    TYPOGRAPHY: {
      FONT_FAMILY: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      FONT_SIZES: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
    },
    
    // Spacing scale
    SPACING: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  };
}

// Export default configuration
export default APP_CONFIG;