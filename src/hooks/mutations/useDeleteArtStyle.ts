'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/browser';
import { SavedArtStyle } from '@/lib/artStyles';
import { useToast } from '@/components/ui/ToastProvider';

export function useDeleteArtStyle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (artStyleId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const supabase = createClient();

      // Get current profile data
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current profile: ${fetchError.message}`);
      }

      const currentData = currentProfile?.data;
      const currentSavedStylesRaw = (currentData && typeof currentData === 'object' && !Array.isArray(currentData) && 'savedArtStyles' in currentData)
        ? currentData.savedArtStyles
        : null;

      const currentSavedStyles = Array.isArray(currentSavedStylesRaw) ? currentSavedStylesRaw : [];

      // Find the style to delete
      const styleToDelete = currentSavedStyles.find((style: any) =>
        style && typeof style === 'object' && style.id === artStyleId
      );
      if (!styleToDelete) {
        throw new Error('Art style not found');
      }

      // Remove the style from the array
      const updatedStyles = currentSavedStyles.filter((style: any) =>
        !(style && typeof style === 'object' && style.id === artStyleId)
      );

      // Update profile with updated art styles
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
        throw new Error(`Failed to delete art style: ${updateError.message}`);
      }

      return styleToDelete as unknown as SavedArtStyle;
    },
    onSuccess: (deletedStyle) => {
      // Invalidate the user art styles query to refetch
      queryClient.invalidateQueries({ queryKey: ['user-art-styles', user?.id] });

      toast({
        title: 'Art style deleted',
        description: `"${deletedStyle.name}" has been removed from your saved styles.`,
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete art style',
        description: error?.message || 'An unexpected error occurred',
        variant: 'error'
      });
    }
  });
}