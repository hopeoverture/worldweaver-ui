'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/browser';
import { SavedArtStyle } from '@/lib/artStyles';

export function useUserArtStyles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-art-styles', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch user art styles: ${error.message}`);
      }

      // Extract saved art styles from profile data
      const profileData = profile?.data;
      const savedArtStylesRaw = (profileData && typeof profileData === 'object' && !Array.isArray(profileData) && 'savedArtStyles' in profileData)
        ? profileData.savedArtStyles
        : null;

      const savedArtStyles = Array.isArray(savedArtStylesRaw) ? savedArtStylesRaw : [];

      // Validate that the saved styles match our SavedArtStyle interface
      const validatedStyles: SavedArtStyle[] = (savedArtStyles as any[]).filter((style: any) =>
        style &&
        typeof style === 'object' &&
        typeof style.id === 'string' &&
        typeof style.name === 'string' &&
        typeof style.description === 'string' &&
        typeof style.promptModifier === 'string' &&
        style.isBuiltIn === false &&
        typeof style.createdAt === 'string'
      );

      return validatedStyles;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}