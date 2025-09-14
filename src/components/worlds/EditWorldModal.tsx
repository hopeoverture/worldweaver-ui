'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { World } from '@/lib/types';
import { useUpdateWorld } from '@/hooks/mutations/useUpdateWorld';
import { useToast } from '@/components/ui/ToastProvider';

interface EditWorldModalProps {
  open: boolean;
  world: World | null;
  onClose: () => void;
}

export function EditWorldModal({ open, world, onClose }: EditWorldModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    logline: '',
    genreBlend: '',
    overallTone: '',
    keyThemes: '',
    audienceRating: '',
    scopeScale: '',
    technologyLevel: '',
    magicLevel: '',
    cosmologyModel: '',
    climateBiomes: '',
    calendarTimekeeping: '',
    societalOverview: '',
    conflictDrivers: '',
    rulesConstraints: '',
    aestheticDirection: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateWorldMut = useUpdateWorld(world?.id || '');
  const { toast } = useToast();

  useEffect(() => {
    if (world) {
      setFormData({
        name: world.name || '',
        description: world.description || world.summary || '',
        isPublic: world.isPublic || false,
        logline: world.logline || '',
        genreBlend: Array.isArray(world.genreBlend) ? world.genreBlend.join(', ') : (world.genreBlend || ''),
        overallTone: world.overallTone || '',
        keyThemes: Array.isArray(world.keyThemes) ? world.keyThemes.join(', ') : (world.keyThemes || ''),
        audienceRating: world.audienceRating || '',
        scopeScale: world.scopeScale || '',
        technologyLevel: Array.isArray(world.technologyLevel) ? world.technologyLevel.join(', ') : (world.technologyLevel || ''),
        magicLevel: Array.isArray(world.magicLevel) ? world.magicLevel.join(', ') : (world.magicLevel || ''),
        cosmologyModel: world.cosmologyModel || '',
        climateBiomes: Array.isArray(world.climateBiomes) ? world.climateBiomes.join(', ') : (world.climateBiomes || ''),
        calendarTimekeeping: world.calendarTimekeeping || '',
        societalOverview: world.societalOverview || '',
        conflictDrivers: Array.isArray(world.conflictDrivers) ? world.conflictDrivers.join(', ') : (world.conflictDrivers || ''),
        rulesConstraints: world.rulesConstraints || '',
        aestheticDirection: world.aestheticDirection || ''
      });
      setErrors({});
    }
  }, [world]);

  if (!world) return null;

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPublic: formData.isPublic,
      };

      // Add extended fields if they have values
      if (formData.logline.trim()) updateData.logline = formData.logline.trim();
      if (formData.genreBlend.trim()) updateData.genreBlend = formData.genreBlend.split(',').map(s => s.trim()).filter(Boolean);
      if (formData.overallTone.trim()) updateData.overallTone = formData.overallTone.trim();
      if (formData.keyThemes.trim()) updateData.keyThemes = formData.keyThemes.split(',').map(s => s.trim()).filter(Boolean);
      if (formData.audienceRating.trim()) updateData.audienceRating = formData.audienceRating.trim();
      if (formData.scopeScale.trim()) updateData.scopeScale = formData.scopeScale.trim();
      if (formData.technologyLevel.trim()) updateData.technologyLevel = formData.technologyLevel.split(',').map(s => s.trim()).filter(Boolean);
      if (formData.magicLevel.trim()) updateData.magicLevel = formData.magicLevel.split(',').map(s => s.trim()).filter(Boolean);
      if (formData.cosmologyModel.trim()) updateData.cosmologyModel = formData.cosmologyModel.trim();
      if (formData.climateBiomes.trim()) updateData.climateBiomes = formData.climateBiomes.split(',').map(s => s.trim()).filter(Boolean);
      if (formData.calendarTimekeeping.trim()) updateData.calendarTimekeeping = formData.calendarTimekeeping.trim();
      if (formData.societalOverview.trim()) updateData.societalOverview = formData.societalOverview.trim();
      if (formData.conflictDrivers.trim()) updateData.conflictDrivers = formData.conflictDrivers.trim();
      if (formData.rulesConstraints.trim()) updateData.rulesConstraints = formData.rulesConstraints.trim();
      if (formData.aestheticDirection.trim()) updateData.aestheticDirection = formData.aestheticDirection.trim();

      await updateWorldMut.mutateAsync(updateData);
      onClose();
    } catch (e) {
      toast({
        title: 'Failed to update world',
        description: String((e as Error)?.message || e),
        variant: 'error'
      });
    }
  };

  const handleCancel = () => {
    if (world) {
      setFormData({
        name: world.name || '',
        description: world.description || world.summary || '',
        isPublic: world.isPublic || false,
        logline: world.logline || '',
        genreBlend: Array.isArray(world.genreBlend) ? world.genreBlend.join(', ') : (world.genreBlend || ''),
        overallTone: world.overallTone || '',
        keyThemes: Array.isArray(world.keyThemes) ? world.keyThemes.join(', ') : (world.keyThemes || ''),
        audienceRating: world.audienceRating || '',
        scopeScale: world.scopeScale || '',
        technologyLevel: Array.isArray(world.technologyLevel) ? world.technologyLevel.join(', ') : (world.technologyLevel || ''),
        magicLevel: Array.isArray(world.magicLevel) ? world.magicLevel.join(', ') : (world.magicLevel || ''),
        cosmologyModel: world.cosmologyModel || '',
        climateBiomes: Array.isArray(world.climateBiomes) ? world.climateBiomes.join(', ') : (world.climateBiomes || ''),
        calendarTimekeeping: world.calendarTimekeeping || '',
        societalOverview: world.societalOverview || '',
        conflictDrivers: Array.isArray(world.conflictDrivers) ? world.conflictDrivers.join(', ') : (world.conflictDrivers || ''),
        rulesConstraints: world.rulesConstraints || '',
        aestheticDirection: world.aestheticDirection || ''
      });
    }
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleCancel} title="Edit World">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>

          <div>
            <label htmlFor="world-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="world-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter world name"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="world-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Textarea
              id="world-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe your world..."
            />
          </div>

          <div>
            <label htmlFor="world-visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <Select
              id="world-visibility"
              value={formData.isPublic ? 'public' : 'private'}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'public' }))}
            >
              <option value="private">Private (only you and invited members)</option>
              <option value="public">Public (visible to everyone)</option>
            </Select>
          </div>
        </div>

        {/* Extended World Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">World Details</h3>

          <div>
            <label htmlFor="world-logline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logline
            </label>
            <Input
              id="world-logline"
              value={formData.logline}
              onChange={(e) => setFormData(prev => ({ ...prev, logline: e.target.value }))}
              placeholder="A one-sentence summary of your world"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="world-genre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Genre Blend
              </label>
              <Input
                id="world-genre"
                value={formData.genreBlend}
                onChange={(e) => setFormData(prev => ({ ...prev, genreBlend: e.target.value }))}
                placeholder="Fantasy, Sci-fi, Horror (comma-separated)"
              />
            </div>

            <div>
              <label htmlFor="world-tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Overall Tone
              </label>
              <Input
                id="world-tone"
                value={formData.overallTone}
                onChange={(e) => setFormData(prev => ({ ...prev, overallTone: e.target.value }))}
                placeholder="Dark, Hopeful, Gritty, etc."
              />
            </div>
          </div>

          <div>
            <label htmlFor="world-themes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Themes
            </label>
            <Input
              id="world-themes"
              value={formData.keyThemes}
              onChange={(e) => setFormData(prev => ({ ...prev, keyThemes: e.target.value }))}
              placeholder="Power, Redemption, Survival (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="world-audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audience Rating
              </label>
              <Input
                id="world-audience"
                value={formData.audienceRating}
                onChange={(e) => setFormData(prev => ({ ...prev, audienceRating: e.target.value }))}
                placeholder="PG, PG-13, R, etc."
              />
            </div>

            <div>
              <label htmlFor="world-scope" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scope & Scale
              </label>
              <Input
                id="world-scope"
                value={formData.scopeScale}
                onChange={(e) => setFormData(prev => ({ ...prev, scopeScale: e.target.value }))}
                placeholder="City, Country, Planet, Galaxy"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={updateWorldMut.isPending}
          >
            {updateWorldMut.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}