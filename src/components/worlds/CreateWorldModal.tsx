'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useCreateWorld } from '@/hooks/mutations/useCreateWorld';
import { useGenerateWorldFields } from '@/hooks/mutations/useGenerateWorldFields';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIPromptModal } from '@/components/ai/AIPromptModal';

interface CreateWorldModalProps {
  isOpen: boolean;
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

const initialFormData: WorldFormData = {
  name: '',
  summary: '',
  genre: '',
  customGenre: '',
  tone: [],
  customTone: [],
  theme: [],
  customTheme: [],
  magicLevel: '',
  customMagicLevel: '',
  technologyLevel: '',
  customTechnologyLevel: '',
  audienceRating: '',
  customAudienceRating: '',
  conflictDrivers: [],
  customConflictDrivers: [],
  travelDifficulty: [],
  customTravelDifficulty: [],
  cosmologyModel: [],
  customCosmologyModel: [],
};

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

export function CreateWorldModal({ isOpen, onClose }: CreateWorldModalProps) {
  const [formData, setFormData] = useState<WorldFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createWorld = useCreateWorld();
  const generateWorldFields = useGenerateWorldFields();

  // AI generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerationTarget, setAiGenerationTarget] = useState<string | string[]>('');

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

      // Update form data with generated fields
      setFormData(prev => ({
        ...prev,
        ...result.fields
      }));

      setShowAIModal(false);
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('AI generation failed:', error);
    }
  };

  const openAIModal = (target: string | string[]) => {
    setAiGenerationTarget(target);
    setShowAIModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only require world name
    if (!formData.name.trim()) {
      newErrors.name = 'World name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
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

        await createWorld.mutateAsync({
          name: formData.name,
          description: formData.summary || undefined,
          // Map new fields to existing database schema
          genreBlend: finalGenre ? [finalGenre] : undefined,
          overallTone: combinedTone.length > 0 ? combinedTone.join(', ') : undefined,
          keyThemes: combinedTheme.length > 0 ? combinedTheme : undefined,
          magicLevel: finalMagicLevel ? [finalMagicLevel] : undefined,
          technologyLevel: finalTechnologyLevel ? [finalTechnologyLevel] : undefined,
          audienceRating: finalAudienceRating || undefined,
          conflictDrivers: combinedConflictDrivers.length > 0 ? combinedConflictDrivers : undefined,
          // Store travel difficulty and cosmology model in existing fields or settings
          climateBiomes: combinedTravelDifficulty.length > 0 ? combinedTravelDifficulty : undefined, // Temp mapping
          cosmologyModel: combinedCosmologyModel.length > 0 ? combinedCosmologyModel.join(', ') : undefined,
        });

        // Reset form and close modal
        setFormData(initialFormData);
        setErrors({});
        onClose();
      } catch (e) {
        setErrors(prev => ({ ...prev, name: 'Failed to create world' }));
      }
    }
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
          {label}
        </label>
      </div>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 min-h-[100px]">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleMultiSelect(field, option)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              (formData[field] as string[]).includes(option)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
            }`}
          >
            {option}
          </button>
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

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <button
        aria-hidden='true'
        tabIndex={-1}
        className='absolute inset-0 bg-black/50 backdrop-blur-[2px]'
        onClick={onClose}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label="Create New World"
        className='relative w-full max-w-4xl max-h-[90vh] rounded-lg bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5 flex flex-col'
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create New World
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define the core parameters of your world
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label='Close'
              className='h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Basic Information
                </h3>
              </div>

              {/* World Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    World Name *
                  </label>
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter the name of your world"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* World Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    World Summary
                  </label>
                  <AIGenerateButton
                    onClick={() => openAIModal('summary')}
                    disabled={generateWorldFields.isPending}
                    isGenerating={generateWorldFields.isPending}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Generate
                  </AIGenerateButton>
                </div>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="A brief description of your world..."
                  rows={3}
                />
              </div>
            </div>

            {/* Core Settings */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Core Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSingleSelect('Genre', 'genre', 'customGenre', genreOptions, errors.genre)}
                {renderSingleSelect('Magic Level', 'magicLevel', 'customMagicLevel', magicOptions)}
                {renderSingleSelect('Technology Level', 'technologyLevel', 'customTechnologyLevel', technologyOptions)}
                {renderSingleSelect('Audience Rating', 'audienceRating', 'customAudienceRating', audienceOptions)}
              </div>
            </div>

            {/* Multi-Select Fields */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                World Characteristics
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderMultiSelect('Tone', 'tone', 'customTone', toneOptions)}
                {renderMultiSelect('Theme', 'theme', 'customTheme', themeOptions)}
                {renderMultiSelect('Conflict Drivers', 'conflictDrivers', 'customConflictDrivers', conflictOptions)}
                {renderMultiSelect('Travel Difficulty', 'travelDifficulty', 'customTravelDifficulty', travelDifficultyOptions)}
              </div>

              <div className="col-span-full">
                {renderMultiSelect('Cosmology Model', 'cosmologyModel', 'customCosmologyModel', cosmologyOptions)}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-neutral-700">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWorld.isPending}
                loading={createWorld.isPending}
              >
                {createWorld.isPending ? 'Creating...' : 'Create World'}
              </Button>
            </div>
          </form>
        </div>

        {/* AI Prompt Modal */}
        <AIPromptModal
          open={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerate={handleAIGenerate}
          isGenerating={generateWorldFields.isPending}
          title="Generate World Field Values"
          description="Generate content for the selected world fields. The AI will create values based on existing fields and your world context. You can leave the prompt empty to generate based on context alone."
          placeholder="Optional: Describe the style, tone, or specific direction for generating these field values..."
        />
      </div>
    </div>
  );
}