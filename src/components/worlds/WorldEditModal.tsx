'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useUpdateWorld } from '@/hooks/mutations/useUpdateWorld';

interface WorldEditModalProps {
  isOpen: boolean;
  worldId: string;
  onClose: () => void;
}

// Use the same comprehensive form structure as CreateWorldModal
const genreOptions = [
  'High Fantasy', 'Low Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Epic Fantasy',
  'Science Fiction', 'Hard Sci-Fi', 'Space Opera', 'Cyberpunk', 'Dystopian',
  'Horror', 'Supernatural', 'Mystery', 'Thriller', 'Adventure',
  'Historical', 'Alternate History', 'Steampunk', 'Post-Apocalyptic', 'Western',
  'Contemporary', 'Literary Fiction', 'Magical Realism', 'Superhero', 'Other'
];

const toneOptions = [
  'Dark & Gritty', 'Light & Whimsical', 'Epic & Heroic', 'Mysterious & Atmospheric',
  'Comedic & Satirical', 'Romantic & Dramatic', 'Action-Packed', 'Philosophical',
  'Noir & Cynical', 'Optimistic & Hopeful', 'Surreal & Dreamlike', 'Realistic & Grounded'
];

const themesOptions = [
  'Good vs Evil', 'Coming of Age', 'Love & Sacrifice', 'Power & Corruption',
  'Identity & Belonging', 'Freedom vs Control', 'Nature vs Technology', 'Faith & Doubt',
  'Redemption', 'Revenge', 'Survival', 'Family & Legacy', 'Justice & Morality',
  'Knowledge & Ignorance', 'Tradition vs Progress', 'War & Peace'
];

const audienceOptions = [
  'All Ages', 'Young Adult', 'Mature Teen (13+)', 'Adult', 'Mature Adult (18+)'
];

const scopeOptions = [
  'Personal/Intimate', 'Local Community', 'City/Region', 'Continental', 'Global/Planetary', 'Galactic/Universal'
];

const techLevelOptions = [
  'Stone Age', 'Bronze Age', 'Iron Age', 'Medieval', 'Renaissance', 'Industrial',
  'Modern', 'Near Future', 'Far Future', 'Post-Apocalyptic', 'Mixed Periods'
];

const magicLevelOptions = [
  'No Magic', 'Rare/Legendary', 'Uncommon', 'Common', 'Ubiquitous', 'Reality-Defining'
];

const cosmologyOptions = [
  'Single World', 'Multiple Planets', 'Multiple Dimensions', 'Layered Planes',
  'Pocket Universes', 'Infinite Cosmos', 'Cyclical Reality', 'Simulated World'
];

const climateOptions = [
  'Temperate', 'Tropical', 'Arid/Desert', 'Arctic/Tundra', 'Mediterranean',
  'Continental', 'Oceanic', 'Monsoon', 'Volcanic', 'Magical Climate'
];

export function WorldEditModal({ isOpen, worldId, onClose }: WorldEditModalProps) {
  const { worlds } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateWorldMut = useUpdateWorld(worldId);
  
  // Form state - using same structure as CreateWorldModal
  const [formData, setFormData] = useState({
    name: '',
    logline: '',
    genreBlend: [] as string[],
    tone: [] as string[],
    themes: [] as string[],
    audienceRating: '',
    scope: '',
    techLevel: '',
    magicLevel: '',
    cosmology: '',
    climateBiomes: [] as string[],
    calendar: '',
    society: '',
    conflictDrivers: '',
    rulesConstraints: '',
    aestheticDirection: ''
  });

  // Find the world to edit
  const world = worlds.find(w => w.id === worldId);

  // Load world data when modal opens
  useEffect(() => {
    if (isOpen && world) {
      setFormData({
        name: world.name || '',
        logline: world.summary || '',
        genreBlend: [], // TODO: Load from stored world data when available
        tone: [],
        themes: [],
        audienceRating: '',
        scope: '',
        techLevel: '',
        magicLevel: '',
        cosmology: '',
        climateBiomes: [],
        calendar: '',
        society: '',
        conflictDrivers: '',
        rulesConstraints: '',
        aestheticDirection: ''
      });
      setCurrentStep(1);
    }
  }, [isOpen, world]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!world) return;
    
    setIsSubmitting(true);
    try {
      await updateWorldMut.mutateAsync({
        name: formData.name,
        description: formData.logline,
      });
      onClose();
    } catch (error) {
      console.error('Error updating world:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    onClose();
  };

  if (!world) return null;

  const isStep1Valid = formData.name.trim().length > 0;
  const isStep2Valid = formData.audienceRating && formData.scope;
  const canSubmit = isStep1Valid && isStep2Valid;

  // Multi-select field rendering helper
  const renderMultiSelectField = (
    label: string,
    field: keyof typeof formData,
    options: string[],
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <Input
        placeholder={placeholder + " (separate with commas)"}
        onChange={(e) => {
          const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
          handleInputChange(field, values);
        }}
        value={Array.isArray(formData[field]) ? (formData[field] as string[]).join(', ') : ''}
      />
      {Array.isArray(formData[field]) && (formData[field] as string[]).length > 0 && (
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
    </div>
  );

  const renderSelectField = (
    label: string,
    field: keyof typeof formData,
    options: string[],
    placeholder: string,
    required = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && '*'}
      </label>
      <select
        className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        value={formData[field] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
    >
      <button
        aria-hidden='true'
        tabIndex={-1}
        className='absolute inset-0 bg-black/50 backdrop-blur-[2px]'
        onClick={handleClose}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label="Edit World"
        className='relative w-full max-w-4xl max-h-[90vh] rounded-lg bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5 flex flex-col'
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Edit World
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of 3
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step === currentStep
                        ? 'bg-brand-600'
                        : step < currentStep
                        ? 'bg-brand-300'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleClose}
                aria-label='Close'
                className='h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
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
                  placeholder="Enter your world's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  One-Line Logline
                </label>
                <Textarea
                  value={formData.logline}
                  onChange={(e) => handleInputChange('logline', e.target.value)}
                  placeholder="A brief, compelling description of your world"
                  rows={2}
                />
              </div>

              {renderMultiSelectField('Genre Blend', 'genreBlend', genreOptions, 'Select primary genres')}
              {renderMultiSelectField('Tone & Mood', 'tone', toneOptions, 'Select the world\'s emotional tone')}
              {renderMultiSelectField('Central Themes', 'themes', themesOptions, 'Select major thematic elements')}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                World Parameters
              </h3>

              {renderSelectField('Audience Rating', 'audienceRating', audienceOptions, 'Select target audience', true)}
              {renderSelectField('Scope & Scale', 'scope', scopeOptions, 'Select the world\'s scope', true)}
              {renderSelectField('Technology Level', 'techLevel', techLevelOptions, 'Select technology level')}
              {renderSelectField('Magic Level', 'magicLevel', magicLevelOptions, 'Select magic prevalence')}
              {renderSelectField('Cosmology', 'cosmology', cosmologyOptions, 'Select world structure')}
              {renderMultiSelectField('Climate & Biomes', 'climateBiomes', climateOptions, 'Select climate types')}
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
                  value={formData.calendar}
                  onChange={(e) => handleInputChange('calendar', e.target.value)}
                  placeholder="Describe how time is measured and significant dates"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Societal Overview
                </label>
                <Textarea
                  value={formData.society}
                  onChange={(e) => handleInputChange('society', e.target.value)}
                  placeholder="Overview of civilizations, cultures, and social structures"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conflict Drivers
                </label>
                <Textarea
                  value={formData.conflictDrivers}
                  onChange={(e) => handleInputChange('conflictDrivers', e.target.value)}
                  placeholder="What creates tension and drives stories in this world?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rules & Constraints
                </label>
                <Textarea
                  value={formData.rulesConstraints}
                  onChange={(e) => handleInputChange('rulesConstraints', e.target.value)}
                  placeholder="Physical laws, magic rules, technological limitations"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aesthetic Direction
                </label>
                <Textarea
                  value={formData.aestheticDirection}
                  onChange={(e) => handleInputChange('aestheticDirection', e.target.value)}
                  placeholder="Visual style, architecture, fashion, art direction"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-neutral-700">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 1 && !isStep1Valid}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update World'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
