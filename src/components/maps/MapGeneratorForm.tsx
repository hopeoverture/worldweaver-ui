'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  mapGeneratorSchema,
  MapGeneratorFormData,
  mapGeneratorDefaults
} from '@/lib/schemas/mapGenerator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/use-toast';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import {
  Upload,
  Sparkles,
  Map,
  Grid3X3,
  Link,
  Download,
  AlertCircle,
  ImageIcon,
  Users,
  X
} from 'lucide-react';

interface MapGeneratorFormProps {
  worldId: string;
  worldName: string;
  onSuccess: (mapId: string) => void;
}

export function MapGeneratorForm({ worldId, worldName, onSuccess }: MapGeneratorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Fetch entities for context cards
  const { data: entities = [] } = useWorldEntities(worldId);

  const form = useForm({
    resolver: zodResolver(mapGeneratorSchema),
    defaultValues: {
      worldId,
      name: '',
      ...mapGeneratorDefaults,
    },
  });

  const { watch, setValue, formState: { errors } } = form;
  const mode = watch('mode');
  const gridType = watch('gridType');
  const imageFile = watch('imageFile');

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue('imageFile', file);

      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };


  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (data: any) => {
    const formData = data as MapGeneratorFormData;
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === 'imageFile' && value instanceof File) {
          formData.append('imageFile', value);
        } else if (key === 'scale' && typeof value === 'object') {
          formData.append('scale', JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(`/api/worlds/${worldId}/maps/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create map');
      }

      const result = await response.json();

      toast({
        title: 'Map created successfully',
        description: `Map has been added to your world.`,
      });

      onSuccess(result.mapId);

    } catch (error) {
      console.error('Error creating map:', error);
      toast({
        title: 'Failed to create map',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Map className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold">Basic Information</h2>
        </div>

        <div className="space-y-4">
          <FormField label="World" htmlFor="world">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{worldName}</Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Map will be added to this world
              </span>
            </div>
          </FormField>

          <FormField
            label="Map Name"
            required
            error={errors.name?.message}
          >
            <Input
              {...form.register('name')}
              placeholder="Enter map name..."
              variant={errors.name ? 'error' : 'default'}
            />
          </FormField>

          <FormField
            label="Mode"
            required
            description="Choose how you want to create your map"
            error={errors.mode?.message}
          >
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue('mode', 'upload')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  mode === 'upload'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-brand-600" />
                <div className="text-sm font-medium">Upload Image</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Use your own map image
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('mode', 'ai')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  mode === 'ai'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-brand-600" />
                <div className="text-sm font-medium">AI Generate</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Create with AI
                </div>
              </button>
            </div>
          </FormField>

          <FormField
            label="Description (Optional)"
            error={errors.description?.message}
          >
            <Textarea
              {...form.register('description')}
              placeholder="Describe your map..."
              rows={3}
            />
          </FormField>
        </div>
      </Card>

      {/* Upload Mode Section */}
      {mode === 'upload' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Upload className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold">Upload Settings</h2>
          </div>

          <div className="space-y-4">
            <FormField
              label="Map Image"
              required
              description="Upload a JPEG, PNG, or WebP image (max 50MB)"
              error={errors.imageFile?.message}
            >
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />

                {previewUrl && (
                  <div className="relative w-full max-w-xs">
                    <img
                      src={previewUrl}
                      alt="Map preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <Badge className="absolute top-2 left-2 bg-black/50 text-white">
                      Preview
                    </Badge>
                  </div>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Scale Value"
                required
                error={errors.scale?.value?.message}
              >
                <Input
                  type="number"
                  step="0.1"
                  {...form.register('scale.value', { valueAsNumber: true })}
                  placeholder="1.0"
                  variant={errors.scale?.value ? 'error' : 'default'}
                />
              </FormField>

              <FormField
                label="Scale Unit"
                required
                error={errors.scale?.unit?.message}
              >
                <Select {...form.register('scale.unit')}>
                  <option value="km">Kilometers</option>
                  <option value="miles">Miles</option>
                  <option value="meters">Meters</option>
                  <option value="feet">Feet</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Default Layers">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Create default layers</span>
                  <Switch
                    checked={watch('createDefaultLayers')}
                    onCheckedChange={(checked) => setValue('createDefaultLayers', checked)}
                  />
                </div>

                {watch('createDefaultLayers') && (
                  <div className="ml-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Terrain Layer</span>
                      <Switch
                        checked={watch('createTerrainLayer')}
                        onCheckedChange={(checked) => setValue('createTerrainLayer', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Political Layer</span>
                      <Switch
                        checked={watch('createPoliticalLayer')}
                        onCheckedChange={(checked) => setValue('createPoliticalLayer', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Markers Layer</span>
                      <Switch
                        checked={watch('createMarkersLayer')}
                        onCheckedChange={(checked) => setValue('createMarkersLayer', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </FormField>
          </div>
        </Card>
      )}

      {/* AI Mode Section */}
      {mode === 'ai' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold">AI Generation Settings</h2>
          </div>

          <div className="space-y-4">
            <FormField
              label="Map Type"
              required
              description="Choose the type of map to generate"
              error={errors.mapType?.message}
            >
              <Select {...form.register('mapType')}>
                <option value="world">World</option>
                <option value="region">Region</option>
                <option value="settlement">Settlement</option>
                <option value="site">Site</option>
                <option value="dungeon">Dungeon</option>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Art Style"
                required
                error={errors.artStyle?.message}
              >
                <Select {...form.register('artStyle')}>
                  <option value="photorealistic">Photorealistic</option>
                  <option value="hand-drawn">Hand-Drawn Sketch</option>
                </Select>
              </FormField>

              <FormField
                label="View Angle"
                required
                error={errors.viewAngle?.message}
              >
                <Select {...form.register('viewAngle')}>
                  <option value="top-down">True Top Down</option>
                  <option value="isometric">Isometric</option>
                </Select>
              </FormField>
            </div>

            <FormField
              label="Aspect Ratio"
              required
              error={errors.aspectRatioAI?.message}
            >
              <Select {...form.register('aspectRatioAI')}>
                <option value="square">Square (1:1)</option>
                <option value="vertical">Vertical (2:3)</option>
                <option value="landscape">Landscape (16:9)</option>
              </Select>
            </FormField>


          </div>
        </Card>
      )}

      {/* Grid Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Grid3X3 className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold">Grid Options</h2>
        </div>

        <div className="space-y-4">
          <FormField
            label="Grid Type"
            error={errors.gridType?.message}
          >
            <Select {...form.register('gridType')}>
              <option value="none">No Grid</option>
              <option value="square">Square Grid</option>
              <option value="hex">Hexagonal Grid</option>
            </Select>
          </FormField>

          {gridType !== 'none' && (
            <FormField
              label="Grid Size (px)"
              required
              error={errors.gridSize?.message}
            >
              <Input
                type="number"
                min="10"
                max="200"
                {...form.register('gridSize', { valueAsNumber: true })}
                placeholder="50"
                variant={errors.gridSize ? 'error' : 'default'}
              />
            </FormField>
          )}
        </div>
      </Card>

      {/* Linking Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold">Linking Options</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-create entity cards</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Automatically create entity cards for major landmarks
              </div>
            </div>
            <Switch
              checked={watch('autoCreateEntityCards')}
              onCheckedChange={(checked) => setValue('autoCreateEntityCards', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-link markers</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Automatically link markers to relevant entities
              </div>
            </div>
            <Switch
              checked={watch('autoLinkMarkers')}
              onCheckedChange={(checked) => setValue('autoLinkMarkers', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Output Options */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Download className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold">Output Options</h2>
        </div>

        <div className="space-y-4">
          <FormField
            label="Export Format"
            error={errors.exportFormat?.message}
          >
            <Select {...form.register('exportFormat')}>
              <option value="png">PNG Image</option>
              <option value="json">JSON Data</option>
              <option value="both">Both PNG & JSON</option>
            </Select>
          </FormField>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Split labels layer</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Create a separate layer for text labels
              </div>
            </div>
            <Switch
              checked={watch('splitLabelsLayer')}
              onCheckedChange={(checked) => setValue('splitLabelsLayer', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
{watch('mode') === 'upload' ? 'Upload & Create' : 'Generate Map'}
        </Button>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error?.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </form>
  );
}