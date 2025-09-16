'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/browser';
import { SavedArtStyle } from '@/lib/artStyles';
import { useToast } from '@/components/ui/ToastProvider';

export function useSaveArtStyle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (artStyle: SavedArtStyle) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const supabase = createClient();

      // First, get current profile data to preserve existing data
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`Failed to fetch current profile: ${fetchError.message}`);
      }

      const currentData = currentProfile?.data;
      const currentSavedStylesRaw = (currentData && typeof currentData === 'object' && !Array.isArray(currentData) && 'savedArtStyles' in currentData)
        ? currentData.savedArtStyles
        : null;

      const currentSavedStyles = Array.isArray(currentSavedStylesRaw) ? currentSavedStylesRaw : [];

      // Check if style already exists (by ID or name)
      const existingIndex = currentSavedStyles.findIndex((style: any) =>
        style && typeof style === 'object' && (style.id === artStyle.id || style.name === artStyle.name)
      );

      let updatedStyles: any[];
      if (existingIndex >= 0) {
        // Update existing style
        updatedStyles = [...currentSavedStyles];
        updatedStyles[existingIndex] = artStyle;
      } else {
        // Add new style
        updatedStyles = [...currentSavedStyles, artStyle];
      }

      // Update profile with new art styles
      const baseData = currentData && typeof currentData === 'object' && !Array.isArray(currentData) ? currentData : {};
      const updatedData: any = {
        ...baseData,
        savedArtStyles: updatedStyles
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ data: updatedData })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to save art style: ${updateError.message}`);
      }

      return artStyle;
    },
    onSuccess: (savedStyle) => {
      // Invalidate the user art styles query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-art-styles', user?.id] });

      toast({
        title: 'Art style saved',
        description: `"${savedStyle.name}" has been saved for future use.`,
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save art style',
        description: error?.message || 'An unexpected error occurred',
        variant: 'error'
      });
    }
  });
}