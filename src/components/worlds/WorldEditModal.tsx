'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useWorld } from '@/hooks/query/useWorld';
import { useUpdateWorld } from '@/hooks/mutations/useUpdateWorld';
import { useGenerateWorldFields } from '@/hooks/mutations/useGenerateWorldFields';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIPromptModal } from '@/components/ai/AIPromptModal';
import { AIImageUpload } from '@/components/ai/AIImageUpload';

interface WorldEditModalProps {
  isOpen: boolean;
  worldId: string;
  onClose: () => void;
}

interface WorldFormData {
  name: string;
  summary: string;
  genre: string;
  customGenre: string;
  tone: string[];
  customTone: string[];
  theme: string[];
  customTheme: string[];
  magicLevel: string;
  customMagicLevel: string;
  technologyLevel: string;
  customTechnologyLevel: string;
  audienceRating: string;
  customAudienceRating: string;
  conflictDrivers: string[];
  customConflictDrivers: string[];
  travelDifficulty: string[];
  customTravelDifficulty: string[];
  cosmologyModel: string[];
  customCosmologyModel: string[];
}

const genreOptions = [
  'High Fantasy', 'Low Fantasy', 'Sword & Sorcery', 'Weird West', 'Dark Fantasy',
  'Science Fiction', 'Space Opera', 'Cyberpunk', 'Steampunk', 'Dieselpunk',
  'Post-Apocalyptic', 'Gothic Horror', 'Historical', 'Custom'
];

const toneOptions = [
  'Whimsical', 'Cozy', 'Hopeful', 'Heroic', 'Mysterious', 'Noir', 'Gritty',
  'Grimdark', 'Bittersweet', 'Macabre', 'Custom'
];

const themeOptions = [
  'Discovery', 'Survival', 'Corruption', 'Redemption', 'Rebellion',
  'Destiny vs Free Will', 'Power & Its Cost', 'Tradition vs Progress',
  'Identity & Belonging', 'Environmental Balance', 'Custom'
];

const magicOptions = [
  'None', 'Latent', 'Cantrip', 'Hedge', 'Scholastic', 'Regulated',
  'Pervasive', 'High', 'Mythic', 'Apocalyptic', 'Custom'
];

const technologyOptions = [
  'Stone Age', 'Bronze Age', 'Iron Age', 'Medieval', 'Early Gunpowder',
  'Industrial', 'Electrical', 'Information', 'Near-Future', 'Interstellar', 'Custom'
];

const audienceOptions = [
  'All Ages', 'Teen', 'Young Adult', 'Mature', 'Adult', 'Custom'
];

const conflictOptions = [
  'Resource Scarcity', 'Succession Crisis', 'Religious Schism', 'Colonial Expansion',
  'Class Inequality', 'Forbidden Power Arms Race', 'Border Disputes',
  'Plague or Ecocide', 'Ancient Foe Awakens', 'Prophecy Manipulation', 'Custom'
];

const travelDifficultyOptions = [
  'Treacherous Terrain — mountains, swamps, ice, sinkholes',
  'Extreme Weather — blizzards, sandstorms, monsoons, heatwaves',
  'Poor Infrastructure — broken bridges, washed-out roads, no waystations',
  'Banditry/Piracy — ambushes, toll gangs, raiders at chokepoints',
  'Hostile Creatures — monsters, apex predators, swarms',
  'Wars/Blockades — checkpoints, sieges, conscription, embargoes',
  'Borders & Permits — visas, tariffs, tithe gates, bureaucratic delays',
  'Disease/Quarantine — plague zones, inspections, vaccination proof',
  'Arcane/Tech Anomalies — anti-magic fields, EMP zones, rifts, wild surges',
  'Logistics & Navigation — fuel/water scarcity, map drift, dead zones for comms',
  'Custom'
];

const cosmologyOptions = [
  'Axis Mundi (World-Tree) — roots = underworld, trunk = mortal realm, branches = heavens',
  'Layered Planes (Onion/Wheel) — concentric/adjacent planes aligned to concepts (order/chaos, elements)',
  'Flat World on Turtle/Serpent — disc world with edge seas, waterfall rims, cosmic beast bearer',
  'Hollow World (Inner Sun) — inhabited inner shell; polar entrances; sky is the core star',
  'Crystal Spheres (Geocentric) — celestial bodies fixed in nested, transparent spheres; ritual astronomy',
  'Astral Sea & Island Realms — starry ocean between planes; gods sail currents to domain-isles',
  'Shattered Realms (Floating Shards) — world broken into sky-islands/planes linked by gates/leylines',
  'Ringworld / Megastructure — artificial band/shell around a star; gravity by rotation; engineered biomes',
  'Many-Worlds / Branching Timelines — every choice spawns parallels; crossings, echoes, paradox law',
  'Cyclical Ages (Creation/Unmaking) — universe rebirths in eras; residue relics survive resets',
  'Custom'
];

const getInitialFormData = (world: any): WorldFormData => {
  return {
    name: world?.name || '',
    summary: world?.description || world?.summary || '',
    genre: world?.genreBlend?.[0] || '',
    customGenre: '',
    tone: Array.isArray(world?.overallTone) ? world.overallTone : (world?.overallTone ? world.overallTone.split(', ') : []),
    customTone: [],
    theme: world?.keyThemes || [],
    customTheme: [],
    magicLevel: world?.magicLevel?.[0] || '',
    customMagicLevel: '',
    technologyLevel: world?.technologyLevel?.[0] || '',
    customTechnologyLevel: '',
    audienceRating: world?.audienceRating || '',
    customAudienceRating: '',
    conflictDrivers: world?.conflictDrivers || [],
    customConflictDrivers: [],
    travelDifficulty: world?.climateBiomes || [],
    customTravelDifficulty: [],
    cosmologyModel: world?.cosmologyModel ? (typeof world.cosmologyModel === 'string' ? world.cosmologyModel.split(', ') : world.cosmologyModel) : [],
    customCosmologyModel: [],
  };
};

export function WorldEditModal({ isOpen, worldId, onClose }: WorldEditModalProps) {
  const { data: world } = useWorld(worldId);
  const [formData, setFormData] = useState<WorldFormData>(getInitialFormData(world));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateWorld = useUpdateWorld(worldId);
  const generateWorldFields = useGenerateWorldFields();

  // AI generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerationTarget, setAiGenerationTarget] = useState<string | string[]>('');

  // Image-related state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  // Load world data when modal opens
  useEffect(() => {
    if (isOpen && world) {
      setFormData(getInitialFormData(world));
      setCurrentImageUrl(world.imageUrl || null);
      setImageFile(null);
      setAiImageUrl(null);
    }
  }, [isOpen, world]);

  const handleInputChange = (field: keyof WorldFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelect = (field: keyof WorldFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setAiImageUrl(null);
    if (!file) {
      setCurrentImageUrl(null);
    }
  };

  const handleAIImageGenerate = (imageUrl: string) => {
    setAiImageUrl(imageUrl);
    setCurrentImageUrl(imageUrl);
    setImageFile(null);
  };

  const handleAIGenerate = async (prompt: string) => {
    try {
      const fieldsToGenerate = Array.isArray(aiGenerationTarget)
        ? aiGenerationTarget
        : [aiGenerationTarget];

      const result = await generateWorldFields.mutateAsync({
        prompt,
        fieldsToGenerate,
        existingData: formData as any
      });

      setFormData(prev => ({
        ...prev,
        ...result.fields
      }));

      setShowAIModal(false);
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  };

  const openAIModal = (target: string | string[]) => {
    setAiGenerationTarget(target);
    setShowAIModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'World name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderSingleSelect = (
    label: string,
    field: keyof WorldFormData,
    customField: keyof WorldFormData,
    options: string[],
    error?: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <AIGenerateButton onClick={() => openAIModal(field)} />
      </div>
      <Select
        value={formData[field] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={error ? 'border-red-500' : ''}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
      {formData[field] === 'Custom' && (
        <Input
          value={formData[customField] as string}
          onChange={(e) => handleInputChange(customField, e.target.value)}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          className="mt-2"
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const renderMultiSelect = (
    label: string,
    field: keyof WorldFormData,
    customField: keyof WorldFormData,
    options: string[],
    error?: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} (select multiple)
        </label>
        <AIGenerateButton onClick={() => openAIModal(field)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={(formData[field] as string[]).includes(option)}
              onChange={() => handleMultiSelect(field, option)}
              className="rounded border-gray-300 mr-2"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      {(formData[field] as string[]).includes('Custom') && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Custom {label}
          </label>
          <Input
            value={(formData[customField] as string[]).join(', ')}
            onChange={(e) => handleInputChange(customField, e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            placeholder={`Enter custom ${label.toLowerCase()}, separated by commas`}
          />
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Combine regular and custom values for multi-select fields
      const combinedTone = [...formData.tone.filter(t => t !== 'Custom'), ...formData.customTone.filter(t => t.trim())];
      const combinedTheme = [...formData.theme.filter(t => t !== 'Custom'), ...formData.customTheme.filter(t => t.trim())];
      const combinedConflictDrivers = [...formData.conflictDrivers.filter(c => c !== 'Custom'), ...formData.customConflictDrivers.filter(c => c.trim())];
      const combinedTravelDifficulty = [...formData.travelDifficulty.filter(t => t !== 'Custom'), ...formData.customTravelDifficulty.filter(t => t.trim())];
      const combinedCosmologyModel = [...formData.cosmologyModel.filter(c => c !== 'Custom'), ...formData.customCosmologyModel.filter(c => c.trim())];

      // Handle single-select custom fields
      const finalGenre = formData.genre === 'Custom' ? formData.customGenre.trim() : formData.genre;
      const finalMagicLevel = formData.magicLevel === 'Custom' ? formData.customMagicLevel.trim() : formData.magicLevel;
      const finalTechnologyLevel = formData.technologyLevel === 'Custom' ? formData.customTechnologyLevel.trim() : formData.technologyLevel;
      const finalAudienceRating = formData.audienceRating === 'Custom' ? formData.customAudienceRating.trim() : formData.audienceRating;

      // Handle image upload logic
      let finalImageUrl = currentImageUrl;
      if (imageFile) {
        // File upload logic would go here
        finalImageUrl = null; // For now, just clear it
      } else if (aiImageUrl) {
        finalImageUrl = aiImageUrl;
      } else if (currentImageUrl === null && world.imageUrl) {
        finalImageUrl = null;
      }

      await updateWorld.mutateAsync({
        name: formData.name,
        description: formData.summary || undefined,
        genreBlend: finalGenre ? [finalGenre] : undefined,
        overallTone: combinedTone.length > 0 ? combinedTone.join(', ') : undefined,
        keyThemes: combinedTheme.length > 0 ? combinedTheme : undefined,
        magicLevel: finalMagicLevel ? [finalMagicLevel] : undefined,
        technologyLevel: finalTechnologyLevel ? [finalTechnologyLevel] : undefined,
        audienceRating: finalAudienceRating || undefined,
        conflictDrivers: combinedConflictDrivers.length > 0 ? combinedConflictDrivers : undefined,
        climateBiomes: combinedTravelDifficulty.length > 0 ? combinedTravelDifficulty : undefined,
        cosmologyModel: combinedCosmologyModel.length > 0 ? combinedCosmologyModel.join(', ') : undefined,
        imageUrl: finalImageUrl || undefined
      });

      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Edit World">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              World Name *
            </label>
            <div className="flex gap-2">
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter world name..."
                variant={errors.name ? "error" : "default"}
                className="flex-1"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
              <AIGenerateButton onClick={() => openAIModal('name')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Summary
            </label>
            <div className="flex gap-2">
              <Textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief description of your world..."
                rows={3}
                className="flex-1"
              />
              <AIGenerateButton onClick={() => openAIModal('summary')} />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            World Image
          </label>
          <AIImageUpload
            value={currentImageUrl || undefined}
            onChange={handleImageChange}
            onAIGenerate={handleAIImageGenerate}
            worldId={worldId}
          />
        </div>

        {/* Genre */}
        {renderSingleSelect('Genre', 'genre', 'customGenre', genreOptions)}

        {/* Tone */}
        {renderMultiSelect('Tone', 'tone', 'customTone', toneOptions)}

        {/* Theme */}
        {renderMultiSelect('Theme', 'theme', 'customTheme', themeOptions)}

        {/* Magic Level */}
        {renderSingleSelect('Magic Level', 'magicLevel', 'customMagicLevel', magicOptions)}

        {/* Technology Level */}
        {renderSingleSelect('Technology Level', 'technologyLevel', 'customTechnologyLevel', technologyOptions)}

        {/* Audience Rating */}
        {renderSingleSelect('Audience Rating', 'audienceRating', 'customAudienceRating', audienceOptions)}

        {/* Conflict Drivers */}
        {renderMultiSelect('Conflict Drivers', 'conflictDrivers', 'customConflictDrivers', conflictOptions)}

        {/* Travel Difficulty */}
        {renderMultiSelect('Travel Difficulty', 'travelDifficulty', 'customTravelDifficulty', travelDifficultyOptions)}

        {/* Cosmology Model */}
        {renderMultiSelect('Cosmology Model', 'cosmologyModel', 'customCosmologyModel', cosmologyOptions)}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={updateWorld.isPending}
            disabled={!formData.name.trim()}
          >
            Update World
          </Button>
        </div>
      </div>

      <AIPromptModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        isGenerating={generateWorldFields.isPending}
        title="Generate World Fields"
        placeholder="Describe what you want to generate for your world..."
      />
    </Modal>
  );
}
