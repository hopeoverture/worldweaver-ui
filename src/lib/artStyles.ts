// Art style system for AI image generation

export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  isBuiltIn: boolean;
  icon?: string;
}

export interface SavedArtStyle extends ArtStyle {
  isBuiltIn: false;
  createdAt: string;
}

// Predefined art styles with optimized prompt modifiers
export const BUILTIN_ART_STYLES: ArtStyle[] = [
  {
    id: 'photorealistic-cinematic',
    name: 'Photorealistic / Cinematic',
    description: 'High-quality photorealistic style with cinematic lighting and composition',
    promptModifier: ', photorealistic, cinematic lighting, professional photography, high detail, 8K resolution, dramatic composition, film quality',
    isBuiltIn: true,
    icon: '📸'
  },
  {
    id: 'hyper-realistic-painting',
    name: 'Hyper-realistic Painting',
    description: 'Oil painting style with incredible detail and texture',
    promptModifier: ', hyper-realistic oil painting, masterpiece artwork, fine art, detailed brushwork, museum quality, classical painting technique',
    isBuiltIn: true,
    icon: '🎨'
  },
  {
    id: 'anime-manga',
    name: 'Anime / Manga',
    description: 'Japanese animation and manga art style',
    promptModifier: ', anime art style, manga illustration, Japanese animation, clean lines, cel shading, vibrant colors, anime aesthetic',
    isBuiltIn: true,
    icon: '🎌'
  },
  {
    id: 'light-watercolor',
    name: 'Light Watercolor',
    description: 'Soft watercolor painting with delicate tones',
    promptModifier: ', light watercolor painting, soft colors, flowing paint, delicate brushstrokes, artistic illustration, pastel tones',
    isBuiltIn: true,
    icon: '🌸'
  },
  {
    id: 'grimdark-bw',
    name: 'Grimdark Black & White',
    description: 'Dark, gritty black and white artwork with heavy contrast',
    promptModifier: ', grimdark art style, black and white, high contrast, dark atmosphere, gothic, dramatic shadows, ink illustration, noir aesthetic',
    isBuiltIn: true,
    icon: '🌑'
  },
  {
    id: 'natural-history-realism',
    name: 'Natural History Realism',
    description: 'Scientific illustration style like natural history books',
    promptModifier: ', natural history illustration, scientific drawing, botanical art style, detailed specimen art, field guide illustration, educational diagram',
    isBuiltIn: true,
    icon: '🔬'
  }
];

// Type for art style selection in components
export type ArtStyleSelection = {
  style: ArtStyle;
  customDescription?: string;
};

// Helper functions
export function getArtStyleById(id: string, savedStyles: SavedArtStyle[] = []): ArtStyle | undefined {
  // Check built-in styles first
  const builtIn = BUILTIN_ART_STYLES.find(style => style.id === id);
  if (builtIn) return builtIn;

  // Check saved styles
  return savedStyles.find(style => style.id === id);
}

export function getAllArtStyles(savedStyles: SavedArtStyle[] = []): ArtStyle[] {
  return [...BUILTIN_ART_STYLES, ...savedStyles];
}

export function createCustomArtStyle(
  name: string,
  description: string,
  promptModifier: string
): SavedArtStyle {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    promptModifier,
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  };
}

export function buildImagePrompt(basePrompt: string, artStyle?: ArtStyle): string {
  if (!artStyle) {
    // Default high quality modifier if no style selected
    return `${basePrompt}. High quality, detailed artwork.`;
  }

  return `${basePrompt}${artStyle.promptModifier}`;
}

// Validation helpers
export function isValidArtStyleName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 50;
}

export function isValidArtStyleDescription(description: string): boolean {
  return description.trim().length <= 200;
}

export function isValidPromptModifier(modifier: string): boolean {
  return modifier.trim().length > 0 && modifier.trim().length <= 500;
}