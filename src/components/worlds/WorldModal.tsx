'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useCreateWorld } from '@/hooks/mutations/useCreateWorld';
import { useUpdateWorld } from '@/hooks/mutations/useUpdateWorld';
import { useWorld } from '@/hooks/query/useWorld';
import { useGenerateWorldFields } from '@/hooks/mutations/useGenerateWorldFields';
import { LazyAIGenerateButton, LazyAIPromptModal, AILoadingFallback } from '@/components/ai';
import { Suspense } from 'react';
import type { World } from '@/lib/types';

interface WorldModalProps {
  isOpen: boolean;
  worldId?: string; // If provided, edit mode. If not, create mode
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

const getInitialFormData = (world?: World): WorldFormData => {
  if (!world) {
    return initialFormData;
  }

  return {
    name: world.name || '',
    summary: world.description || world.summary || '',
    genre: world.genreBlend?.[0] || '',
    customGenre: '',
    tone: Array.isArray(world.overallTone) ? world.overallTone : (world.overallTone ? world.overallTone.split(', ') : []),
    customTone: [],
    theme: world.keyThemes || [],
    customTheme: [],
    magicLevel: world.magicLevel?.[0] || '',
    customMagicLevel: '',
    technologyLevel: world.technologyLevel?.[0] || '',
    customTechnologyLevel: '',
    audienceRating: world.audienceRating || '',
    customAudienceRating: '',
    conflictDrivers: world.conflictDrivers || [],
    customConflictDrivers: [],
    travelDifficulty: world.climateBiomes || [],
    customTravelDifficulty: [],
    cosmologyModel: world.cosmologyModel ? (typeof world.cosmologyModel === 'string' ? world.cosmologyModel.split(', ') : world.cosmologyModel) : [],
    customCosmologyModel: [],
  };
};

export function WorldModal({ isOpen, worldId, onClose }: WorldModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!worldId;

  // Fetch world data for edit mode
  const { data: world } = useWorld(worldId || '');

  // Initialize form data
  const [formData, setFormData] = useState<WorldFormData>(getInitialFormData(world));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hooks for create/update operations
  const createWorld = useCreateWorld();
  const updateWorld = useUpdateWorld(worldId || '');
  const generateWorldFields = useGenerateWorldFields();

  // Update form data when world data changes (edit mode)
  useEffect(() => {
    if (world && isEditMode) {
      setFormData(getInitialFormData(world));
    }
  }, [world, isEditMode]);

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
    console.log('🚀 Starting AI generation for world summary');
    console.log('📋 AI Generation Target:', aiGenerationTarget);
    console.log('💬 User Prompt:', prompt);

    try {
      const fieldsToGenerate = Array.isArray(aiGenerationTarget)
        ? aiGenerationTarget
        : [aiGenerationTarget];

      console.log('🎯 Fields to Generate:', fieldsToGenerate);

      // Transform form data to include ALL fields for comprehensive AI context
      const existingData = {
        name: formData.name,
        summary: formData.summary,
        genreBlend: formData.genre === 'Custom' ? [formData.customGenre.trim()] : formData.genre ? [formData.genre] : undefined,
        overallTone: [...formData.tone.filter(t => t !== 'Custom'), ...formData.customTone.filter(t => t.trim())].join(', ') || undefined,
        keyThemes: [...formData.theme.filter(t => t !== 'Custom'), ...formData.customTheme.filter(t => t.trim())],
        audienceRating: formData.audienceRating === 'Custom' ? formData.customAudienceRating.trim() : formData.audienceRating || undefined,
        technologyLevel: formData.technologyLevel === 'Custom' ? [formData.customTechnologyLevel.trim()] : formData.technologyLevel ? [formData.technologyLevel] : undefined,
        magicLevel: formData.magicLevel === 'Custom' ? [formData.customMagicLevel.trim()] : formData.magicLevel ? [formData.magicLevel] : undefined,
        cosmologyModel: [...formData.cosmologyModel.filter(c => c !== 'Custom'), ...formData.customCosmologyModel.filter(c => c.trim())].join(', ') || undefined,
        conflictDrivers: [...formData.conflictDrivers.filter(c => c !== 'Custom'), ...formData.customConflictDrivers.filter(c => c.trim())],
        climateBiomes: [...formData.travelDifficulty.filter(t => t !== 'Custom'), ...formData.customTravelDifficulty.filter(t => t.trim())],
      };

      console.log('📊 Existing Data Context:', {
        ...existingData,
        // Log arrays and strings differently for clarity
        genreBlend: existingData.genreBlend,
        keyThemes: existingData.keyThemes,
        conflictDrivers: existingData.conflictDrivers,
        climateBiomes: existingData.climateBiomes,
        hasName: !!existingData.name,
        hasSummary: !!existingData.summary,
        contextFieldsCount: Object.keys(existingData).filter(key => existingData[key as keyof typeof existingData]).length
      });

      console.log('📡 Making API request to generate world fields...');
      const requestStartTime = Date.now();

      const result = await generateWorldFields.mutateAsync({
        prompt,
        fieldsToGenerate,
        existingData
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log(`✅ AI generation completed in ${requestDuration}ms`);
      console.log('📄 Generated Result:', {
        fieldsGenerated: Object.keys(result.fields || {}),
        resultKeys: Object.keys(result || {}),
        hasFields: !!result.fields,
        fieldsCount: Object.keys(result.fields || {}).length
      });

      if (result.fields) {
        console.log('📝 Generated Field Values:', result.fields);
      }

      // Update form data with generated fields, handling field mapping correctly
      setFormData(prev => {
        // Process AI-generated fields to match WorldModal form structure
        const processedFields: Partial<WorldFormData> = {};

        // Handle each AI-generated field with proper mapping
        Object.entries(result.fields).forEach(([key, value]) => {
          switch (key) {
            case 'summary':
              processedFields.summary = value as string;
              break;
            case 'name':
              processedFields.name = value as string;
              break;
            case 'genreBlend':
              if (Array.isArray(value) && value.length > 0) {
                processedFields.genre = value[0];
              }
              break;
            case 'overallTone':
              if (typeof value === 'string') {
                processedFields.tone = value.split(', ').filter(t => t.trim());
              } else if (Array.isArray(value)) {
                processedFields.tone = value;
              }
              break;
            case 'keyThemes':
              if (Array.isArray(value)) {
                processedFields.theme = value;
              }
              break;
            case 'magicLevel':
              if (Array.isArray(value) && value.length > 0) {
                processedFields.magicLevel = value[0];
              }
              break;
            case 'technologyLevel':
              if (Array.isArray(value) && value.length > 0) {
                processedFields.technologyLevel = value[0];
              }
              break;
            case 'audienceRating':
              processedFields.audienceRating = value as string;
              break;
            case 'conflictDrivers':
              if (Array.isArray(value)) {
                processedFields.conflictDrivers = value;
              }
              break;
            case 'climateBiomes':
              if (Array.isArray(value)) {
                processedFields.travelDifficulty = value;
              }
              break;
            case 'cosmologyModel':
              if (typeof value === 'string') {
                processedFields.cosmologyModel = value.split(', ').filter(c => c.trim());
              } else if (Array.isArray(value)) {
                processedFields.cosmologyModel = value;
              }
              break;
            default:
              // For any unmapped fields, log them for debugging
              console.log(`🔍 Unmapped AI field: ${key} = ${value}`);
              break;
          }
        });

        const newFormData = {
          ...prev,
          ...processedFields
        };

        console.log('🔄 Updating form data with generated fields');
        console.log('📋 Form data before update:', { summary: prev.summary });
        console.log('📋 Form data after update:', { summary: newFormData.summary });
        console.log('📊 Processed AI fields:', processedFields);

        return newFormData;
      });

      console.log('✨ AI generation process completed successfully');
      setShowAIModal(false);
    } catch (error) {
      console.error('❌ AI generation failed with error:', error);

      // Enhanced error logging
      if (error instanceof Error) {
        console.error('❌ Error Details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
        });
      }

      // Check if it's a network/fetch error
      if (error && typeof error === 'object' && 'cause' in error) {
        console.error('❌ Error Cause:', error.cause);
      }

      // Log the current state for debugging
      console.error('❌ Current State:', {
        aiGenerationTarget,
        fieldsToGenerate: Array.isArray(aiGenerationTarget) ? aiGenerationTarget : [aiGenerationTarget],
        hasPrompt: !!prompt,
        promptLength: prompt?.length || 0,
        formDataKeys: Object.keys(formData),
        isPending: generateWorldFields.isPending,
        timestamp: new Date().toISOString()
      });

      // Additional error context
      console.error('❌ Generation Context:', {
        worldId: worldId || 'new-world',
        isEditMode: !!worldId,
        existingDataFieldCount: Object.keys(formData).filter(key => formData[key as keyof typeof formData]).length
      });
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

        const worldData = {
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
        };

        if (isEditMode) {
          await updateWorld.mutateAsync(worldData);
        } else {
          await createWorld.mutateAsync(worldData);
        }

        // Reset form and close modal (only reset to initial in create mode)
        if (!isEditMode) {
          setFormData(initialFormData);
        }
        setErrors({});
        onClose();
      } catch (e) {
        setErrors(prev => ({ ...prev, name: `Failed to ${isEditMode ? 'update' : 'create'} world` }));
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
        aria-label={isEditMode ? "Edit World" : "Create New World"}
        className='relative w-full max-w-4xl max-h-[90vh] rounded-lg bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5 flex flex-col'
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditMode ? 'Edit World' : 'Create New World'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditMode ? 'Update the parameters of your world' : 'Define the core parameters of your world'}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Uses form context
                    </span>
                    <Suspense fallback={<AILoadingFallback />}>
                      <LazyAIGenerateButton
                        type="button"
                        onClick={() => openAIModal('summary')}
                        disabled={generateWorldFields.isPending}
                        isGenerating={generateWorldFields.isPending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Generate
                      </LazyAIGenerateButton>
                    </Suspense>
                  </div>
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
                disabled={isEditMode ? updateWorld.isPending : createWorld.isPending}
                loading={isEditMode ? updateWorld.isPending : createWorld.isPending}
              >
                {(isEditMode ? updateWorld.isPending : createWorld.isPending)
                  ? (isEditMode ? 'Saving...' : 'Creating...')
                  : (isEditMode ? 'Save Changes' : 'Create World')}
              </Button>
            </div>
          </form>
        </div>

        {/* AI Prompt Modal */}
        <Suspense fallback={null}>
          <LazyAIPromptModal
            open={showAIModal}
            onClose={() => setShowAIModal(false)}
            onGenerate={handleAIGenerate}
            isGenerating={generateWorldFields.isPending}
            title="Generate World Summary"
            description="Generate a compelling summary for your world based on all the details you've filled in above. The AI will use your world's genre, themes, tone, and other parameters as context."
            placeholder="Optional: Describe the writing style, focus, or specific elements to emphasize in the summary..."
          />
        </Suspense>
      </div>
    </div>
  );
}