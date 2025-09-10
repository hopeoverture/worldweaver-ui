'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useCreateWorld } from '@/hooks/mutations/useCreateWorld';

interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorldFormData {
  name: string;
  logline: string;
  genreBlend: string[];
  overallTone: string;
  keyThemes: string[];
  audienceRating: string;
  scopeScale: string;
  technologyLevel: string[];
  magicLevel: string[];
  cosmologyModel: string;
  climateBiomes: string[];
  calendarTimekeeping: string;
  societalOverview: string;
  conflictDrivers: string[];
  rulesConstraints: string;
  aestheticDirection: string;
}

const initialFormData: WorldFormData = {
  name: '',
  logline: '',
  genreBlend: [],
  overallTone: '',
  keyThemes: [],
  audienceRating: '',
  scopeScale: '',
  technologyLevel: [],
  magicLevel: [],
  cosmologyModel: '',
  climateBiomes: [],
  calendarTimekeeping: '',
  societalOverview: '',
  conflictDrivers: [],
  rulesConstraints: '',
  aestheticDirection: '',
};

const genreOptions = [
  'Fantasy', 'Science-Fiction', 'Post-Apocalyptic', 'Horror', 'Historical', 
  'Mystery', 'Romance', 'Adventure', 'Cyberpunk', 'Steampunk', 'Urban Fantasy',
  'Space Opera', 'Dystopian', 'Superhero', 'Western'
];

const toneOptions = [
  'Bright', 'Hopeful', 'Neutral', 'Dark', 'Grim', 'Whimsical', 'Gritty', 
  'Melancholic', 'Satirical', 'Epic', 'Intimate'
];

const themeOptions = [
  'Survival', 'Found Family', 'Power Corrupts', 'Destiny vs. Choice', 
  'Nature vs. Industry', 'Coming of Age', 'Redemption', 'Sacrifice', 
  'Identity', 'Freedom', 'Justice', 'Love', 'Betrayal', 'Legacy'
];

const audienceOptions = [
  'All Ages', 'Teen', 'Mature', 'Young Adult', 'Adult'
];

const scopeOptions = [
  'Localized', 'Regional', 'Continental', 'Planetary', 'Multi-world/Planar', 
  'Galactic', 'Universal', 'Interdimensional'
];

const technologyOptions = [
  'Stone-Age', 'Bronze-Age', 'Iron-Age', 'Medieval', 'Renaissance', 
  'Industrial', 'Modern', 'Near-Future', 'Futuristic', 'Post-Singularity'
];

const magicOptions = [
  'None', 'Low', 'Moderate', 'High', 'Soft Magic', 'Hard Magic', 
  'Divine Magic', 'Elemental', 'Psychic', 'Ritualistic'
];

const cosmologyOptions = [
  'Naturalistic', 'Mythic', 'Planar/Multiverse', 'Spacefaring', 
  'Dreamlike/Surreal', 'Cyclical', 'Linear', 'Fractal'
];

const climateOptions = [
  'Temperate', 'Tropical', 'Arid', 'Polar', 'Oceanic', 'Alpine', 
  'Desert', 'Swamp', 'Steppe', 'Tundra', 'Volcanic', 'Floating Islands'
];

const conflictOptions = [
  'Scarcity', 'Ideology', 'Territory', 'Revolution', 'Colonization', 
  'Cosmic Threat', 'Plague', 'Ancient Secrets', 'Religious War', 
  'Economic Collapse', 'Environmental Disaster', 'Technological Singularity'
];

export function CreateWorldModal({ isOpen, onClose }: CreateWorldModalProps) {
  const [formData, setFormData] = useState<WorldFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createWorld = useCreateWorld();

  const totalSteps = 3;

  const handleInputChange = (field: keyof WorldFormData, value: string) => {
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

  const handleTagInput = (field: keyof WorldFormData, value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, [field]: tags }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'World name is required';
      if (!formData.logline.trim()) newErrors.logline = 'Logline is required';
      if (formData.genreBlend.length === 0) newErrors.genreBlend = 'Select at least one genre';
      if (!formData.overallTone) newErrors.overallTone = 'Overall tone is required';
      if (formData.keyThemes.length === 0) newErrors.keyThemes = 'Add at least one theme';
    }

    if (step === 2) {
      if (!formData.audienceRating) newErrors.audienceRating = 'Audience rating is required';
      if (!formData.scopeScale) newErrors.scopeScale = 'Scope & scale is required';
      if (!formData.cosmologyModel) newErrors.cosmologyModel = 'Cosmology model is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        await createWorld.mutateAsync({
          name: formData.name,
          // Keep description as a general summary; use logline for dedicated column too
          description: formData.logline,
          logline: formData.logline,
          genreBlend: formData.genreBlend,
          overallTone: formData.overallTone || undefined,
          keyThemes: formData.keyThemes,
          audienceRating: formData.audienceRating || undefined,
          scopeScale: formData.scopeScale || undefined,
          technologyLevel: formData.technologyLevel,
          magicLevel: formData.magicLevel,
          cosmologyModel: formData.cosmologyModel || undefined,
          climateBiomes: formData.climateBiomes,
          calendarTimekeeping: formData.calendarTimekeeping || undefined,
          societalOverview: formData.societalOverview || undefined,
          conflictDrivers: formData.conflictDrivers,
          rulesConstraints: formData.rulesConstraints || undefined,
          aestheticDirection: formData.aestheticDirection || undefined,
        });
        // Reset form and close modal
        setFormData(initialFormData);
        setCurrentStep(1);
        setErrors({});
        onClose();
      } catch (e) {
        setErrors(prev => ({ ...prev, name: 'Failed to create world' }));
      }
    }
  };

  const renderMultiSelect = (
    label: string,
    field: keyof WorldFormData,
    options: string[],
    error?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const renderTagInput = (
    label: string,
    field: keyof WorldFormData,
    placeholder: string,
    error?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <Input
        placeholder={placeholder}
        onChange={(e) => handleTagInput(field, e.target.value)}
        className={error ? 'border-red-500' : ''}
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Separate multiple items with commas
      </p>
      {(formData[field] as string[]).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(formData[field] as string[]).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
    >
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
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i + 1 <= currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-neutral-600'
                    }`}
                  />
                ))}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Core Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  World Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter the name of your world"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  One-Sentence Logline *
                </label>
                <Input
                  value={formData.logline}
                  onChange={(e) => handleInputChange('logline', e.target.value)}
                  placeholder="A tight hook for the world's premise"
                  className={errors.logline ? 'border-red-500' : ''}
                />
                {errors.logline && <p className="mt-1 text-sm text-red-600">{errors.logline}</p>}
              </div>

              {renderMultiSelect('Genre Blend *', 'genreBlend', genreOptions, errors.genreBlend)}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Tone *
                </label>
                <Select
                  value={formData.overallTone}
                  onChange={(e) => handleInputChange('overallTone', e.target.value)}
                  className={errors.overallTone ? 'border-red-500' : ''}
                >
                  <option value="">Select overall tone</option>
                  {toneOptions.map(tone => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </Select>
                {errors.overallTone && <p className="mt-1 text-sm text-red-600">{errors.overallTone}</p>}
              </div>

              {renderTagInput('Key Themes *', 'keyThemes', 'e.g., Survival, Found Family, Power Corrupts', errors.keyThemes)}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                World Parameters
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intended Audience Rating *
                </label>
                <Select
                  value={formData.audienceRating}
                  onChange={(e) => handleInputChange('audienceRating', e.target.value)}
                  className={errors.audienceRating ? 'border-red-500' : ''}
                >
                  <option value="">Select audience rating</option>
                  {audienceOptions.map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </Select>
                {errors.audienceRating && <p className="mt-1 text-sm text-red-600">{errors.audienceRating}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scope & Scale *
                </label>
                <Select
                  value={formData.scopeScale}
                  onChange={(e) => handleInputChange('scopeScale', e.target.value)}
                  className={errors.scopeScale ? 'border-red-500' : ''}
                >
                  <option value="">Select scope and scale</option>
                  {scopeOptions.map(scope => (
                    <option key={scope} value={scope}>{scope}</option>
                  ))}
                </Select>
                {errors.scopeScale && <p className="mt-1 text-sm text-red-600">{errors.scopeScale}</p>}
              </div>

              {renderMultiSelect('Technology Level', 'technologyLevel', technologyOptions)}
              {renderMultiSelect('Magic Level', 'magicLevel', magicOptions)}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cosmology Model *
                </label>
                <Select
                  value={formData.cosmologyModel}
                  onChange={(e) => handleInputChange('cosmologyModel', e.target.value)}
                  className={errors.cosmologyModel ? 'border-red-500' : ''}
                >
                  <option value="">Select cosmology model</option>
                  {cosmologyOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </Select>
                {errors.cosmologyModel && <p className="mt-1 text-sm text-red-600">{errors.cosmologyModel}</p>}
              </div>

              {renderMultiSelect('Climate & Biomes', 'climateBiomes', climateOptions)}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                World Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calendar & Timekeeping
                </label>
                <Textarea
                  value={formData.calendarTimekeeping}
                  onChange={(e) => handleInputChange('calendarTimekeeping', e.target.value)}
                  placeholder="Day length, year length, seasons count, number of moons/suns, notable cycles..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Societal Overview
                </label>
                <Textarea
                  value={formData.societalOverview}
                  onChange={(e) => handleInputChange('societalOverview', e.target.value)}
                  placeholder="Social organization, common institutions, economic patterns, cultural mix..."
                  rows={4}
                />
              </div>

              {renderMultiSelect('Conflict Drivers', 'conflictDrivers', conflictOptions)}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rules & Constraints
                </label>
                <Textarea
                  value={formData.rulesConstraints}
                  onChange={(e) => handleInputChange('rulesConstraints', e.target.value)}
                  placeholder="Physics dials, taboos, supernatural rules, what can/can't happen, costs/limits for power/tech..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aesthetic Direction
                </label>
                <Textarea
                  value={formData.aestheticDirection}
                  onChange={(e) => handleInputChange('aestheticDirection', e.target.value)}
                  placeholder="Visual motifs, textures, architecture vibes, soundscape, color palette keywords..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-neutral-700">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Create World
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
