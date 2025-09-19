"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-shadcn";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { RadioGroup, CompactRadioGroup } from "@/components/ui/RadioGroup";
import { useToast } from "@/hooks/use-toast";
import { useCreateMap } from "@/hooks/mutations/useCreateMap";
import { useWorldEntities } from "@/hooks/query/useWorldEntities";
import { Badge } from "@/components/ui/Badge";
import {
  mapGeneratorBaseSchema,
  mapGeneratorDefaults,
  type MapGeneratorFormData
} from "@/lib/schemas/mapGenerator";
import {
  mapPurposeOptions,
  mapScaleOptions,
  genreTagOptions,
  terrainEmphasisOptions,
  climateZoneOptions,
  settlementDensityOptions,
  politicalComplexityOptions,
  travelFocusOptions,
  signatureFeatureOptions,
  visualStyleOptions
} from "@/lib/utils/mapGenerationOptions";
import {
  Upload,
  Wand2,
  Grid3X3,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  X,
  Map,
  Sparkles,
  Palette
} from "lucide-react";

// Form state and submission types
type NewMapFormData = MapGeneratorFormData & {
  // Additional UI-specific fields
  is_public: boolean;
  width_px?: number;
  height_px?: number;
  pixels_per_unit?: number;
  default_zoom?: number;
};

interface NewMapModalProps {
  open: boolean;
  onClose: () => void;
  worldId: string;
}

type CreationMethod = "upload" | "ai" | "procedural";

export function NewMapModal({ open, onClose, worldId }: NewMapModalProps) {
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("ai"); // Default to AI
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [includeWorldContext, setIncludeWorldContext] = useState(true);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [entitySearchTerm, setEntitySearchTerm] = useState("");
  const { toast } = useToast();
  const createMapMutation = useCreateMap(worldId);

  // Fetch entities for selection
  const { data: entities = [] } = useWorldEntities(worldId);


  const form = useForm<NewMapFormData>({
    resolver: zodResolver(mapGeneratorBaseSchema as any),
    defaultValues: {
      worldId,
      name: "",
      description: "",
      is_public: false,
      width_px: 1024,
      height_px: 768,
      pixels_per_unit: 50,
      default_zoom: 1,
      // New comprehensive AI generation defaults
      ...mapGeneratorDefaults,
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
      });
      return;
    }

    setUploadedFile(file);

    // Auto-populate name from filename if empty
    if (!form.getValues("name")) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      form.setValue("name", nameWithoutExt);
    }

    // Load image to get dimensions
    const img = new Image();
    img.onload = () => {
      form.setValue("width_px", img.naturalWidth);
      form.setValue("height_px", img.naturalHeight);
    };
    img.src = URL.createObjectURL(file);
  };

  // Helper functions for entity selection
  const filteredEntities = entities.filter((entity: any) =>
    entity.name.toLowerCase().includes(entitySearchTerm.toLowerCase())
  );

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntityIds(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const clearSelectedEntities = () => {
    setSelectedEntityIds([]);
  };

  const generatePrompt = async () => {
    try {
      setIsGeneratingPrompt(true);

      const formData = form.getValues();

      // Validate required AI fields
      if (!formData.mapPurpose || !formData.mapScale || !formData.genreTags?.length ||
          !formData.terrainEmphasis?.length || !formData.climateZones?.length ||
          !formData.settlementDensity || !formData.politicalComplexity ||
          !formData.travelFocus?.length || !formData.visualStyle) {
        toast({
          variant: "destructive",
          title: "Missing required fields",
          description: "Please fill in all required fields before generating a prompt.",
        });
        return;
      }

      // Generate prompt using API endpoint
      const response = await fetch(`/api/worlds/${worldId}/maps/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mapPurpose: formData.mapPurpose,
          mapScale: formData.mapScale,
          genreTags: formData.genreTags,
          terrainEmphasis: formData.terrainEmphasis,
          climateZones: formData.climateZones,
          settlementDensity: formData.settlementDensity,
          politicalComplexity: formData.politicalComplexity,
          travelFocus: formData.travelFocus,
          signatureFeatures: formData.signatureFeatures,
          visualStyle: formData.visualStyle,
          includeWorldContext,
          selectedEntityIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const result = await response.json();
      const prompt = result.prompt;

      setGeneratedPrompt(prompt);
      setShowPromptEditor(true);

      toast({
        title: "Prompt generated",
        description: "You can now review and edit the prompt before generating your map.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate prompt",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const uploadMapImage = async (mapId: string, file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapId", mapId);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(`/api/worlds/${worldId}/maps/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      return result.path;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: NewMapFormData) => {
    try {
      if (creationMethod === "ai") {
        // Handle AI generation
        setIsGenerating(true);

        if (!generatedPrompt) {
          throw new Error("Please generate and review the prompt before creating the map");
        }

        // Use the new API endpoint to generate with custom prompt
        const response = await fetch(`/api/worlds/${worldId}/maps/generate-with-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            prompt: generatedPrompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to generate map');
        }

        const result = await response.json();

        toast({
          title: "AI map generated successfully",
          description: `"${data.name}" has been created and added to your world.`,
        });

        // Reset form and close modal
        form.reset();
        setGeneratedPrompt("");
        setShowPromptEditor(false);
        setIncludeWorldContext(true);
        setSelectedEntityIds([]);
        setEntitySearchTerm("");
        setCreationMethod("ai");
        onClose();

      } else {
        // Handle upload mode (existing logic)
        const mapResult = await createMapMutation.mutateAsync(data);

        // If we have a file, upload it
        let imagePath = null;
        if (uploadedFile && mapResult?.id) {
          imagePath = await uploadMapImage(mapResult.id, uploadedFile);

          if (!imagePath) {
            // Upload failed, but map was created - could update with path later
            toast({
              variant: "destructive",
              title: "Map created, but image upload failed",
              description: "You can upload an image later from the map settings.",
            });
          }
        }

        toast({
          title: "Map created successfully",
          description: `"${data.name}" has been added to your world.`,
        });

        // Reset form and close modal
        form.reset();
        setUploadedFile(null);
        setCreationMethod("upload");
        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: creationMethod === "ai" ? "Failed to generate map" : "Failed to create map",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (createMapMutation.isPending || isUploading || isGenerating || isGeneratingPrompt) {
      return; // Don't allow closing while operations are in progress
    }
    form.reset();
    setUploadedFile(null);
    setGeneratedPrompt("");
    setShowPromptEditor(false);
    setIncludeWorldContext(true);
    setSelectedEntityIds([]);
    setEntitySearchTerm("");
    setCreationMethod("ai");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Create New World Map
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive world map using AI or upload your own map image.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Creation Method Tabs */}
          <Tabs value={creationMethod} onValueChange={(value) => {
            setCreationMethod(value as CreationMethod);
            form.setValue("mode", value as "upload" | "ai");
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI World Generator
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="procedural" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Procedural (Coming Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Upload Image
                  </CardTitle>
                  <CardDescription>
                    Upload an existing map image (PNG, JPG, WebP)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadedFile(null)}
                          >
                            Choose Different File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <span className="font-medium text-primary hover:underline">
                                Click to upload
                              </span>
                              <span className="text-muted-foreground"> or drag and drop</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG, WebP up to 10MB
                            </p>
                          </div>
                          <Input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-8">
              {/* World Map AI Generation Form - Single Column */}
              <div className="max-w-4xl mx-auto space-y-8">

                {/* Section 1: Core Map Properties */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <Map className="h-5 w-5" />
                      Core Map Properties
                    </h3>
                    <p className="text-muted-foreground">Define the fundamental purpose and scope of your map</p>
                  </div>

                  {/* Map Purpose */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What's the primary purpose of this map?</CardTitle>
                      <CardDescription>
                        This guides the level of detail and information emphasis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        options={mapPurposeOptions}
                        value={form.watch("mapPurpose") || ""}
                        onChange={(value) => form.setValue("mapPurpose", value as any)}
                        name="mapPurpose"
                        error={form.formState.errors.mapPurpose?.message}
                        required
                      />
                    </CardContent>
                  </Card>

                  {/* Map Scale */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What scale do you need?</CardTitle>
                      <CardDescription>
                        Determines the geographic scope and detail level
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        options={mapScaleOptions}
                        value={form.watch("mapScale") || ""}
                        onChange={(value) => form.setValue("mapScale", value as any)}
                        name="mapScale"
                        error={form.formState.errors.mapScale?.message}
                        required
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Section 2: World Setting & Style */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      World Setting & Style
                    </h3>
                    <p className="text-muted-foreground">Define your world's genre and visual appearance</p>
                  </div>

                  {/* Genre Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Which genres best fit your world?</CardTitle>
                      <CardDescription>
                        Select 1-4 genres that define your world's style
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CheckboxGroup
                        options={genreTagOptions}
                        value={form.watch("genreTags") || []}
                        onChange={(value) => form.setValue("genreTags", value as any)}
                        minSelections={1}
                        maxSelections={4}
                        error={form.formState.errors.genreTags?.message}
                        required
                        columns={2}
                        showSelectAll={true}
                      />
                    </CardContent>
                  </Card>

                  {/* Visual Style */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Map visual style
                      </CardTitle>
                      <CardDescription>
                        Choose the artistic approach for your map
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CompactRadioGroup
                        options={visualStyleOptions}
                        value={form.watch("visualStyle") || ""}
                        onChange={(value) => form.setValue("visualStyle", value as any)}
                        name="visualStyle"
                        columns={3}
                        error={form.formState.errors.visualStyle?.message}
                        required
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Section 3: Geography & Environment */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Geography & Environment
                    </h3>
                    <p className="text-muted-foreground">Shape the physical landscape and climate of your world</p>
                  </div>

                  {/* Terrain Emphasis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Terrain emphasis (what do you want a lot of)?</CardTitle>
                      <CardDescription>
                        Select the terrain types to feature prominently
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CheckboxGroup
                        options={terrainEmphasisOptions}
                        value={form.watch("terrainEmphasis") || []}
                        onChange={(value) => form.setValue("terrainEmphasis", value as any)}
                        minSelections={1}
                        maxSelections={6}
                        error={form.formState.errors.terrainEmphasis?.message}
                        required
                        columns={2}
                        showSelectAll={true}
                      />
                    </CardContent>
                  </Card>

                  {/* Climate Zones */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Climate spread you expect across the map?</CardTitle>
                      <CardDescription>
                        Select the climate zones present in your world
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CheckboxGroup
                        options={climateZoneOptions}
                        value={form.watch("climateZones") || []}
                        onChange={(value) => form.setValue("climateZones", value as any)}
                        minSelections={1}
                        maxSelections={4}
                        error={form.formState.errors.climateZones?.message}
                        required
                        columns={2}
                        showSelectAll={true}
                      />
                    </CardContent>
                  </Card>

                  {/* Signature Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Signature features you'd like included?</CardTitle>
                      <CardDescription>
                        Optional unique landmarks that make your world memorable (max 3)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CheckboxGroup
                        options={signatureFeatureOptions}
                        value={form.watch("signatureFeatures") || []}
                        onChange={(value) => form.setValue("signatureFeatures", value as any)}
                        maxSelections={3}
                        error={form.formState.errors.signatureFeatures?.message}
                        columns={2}
                        showSelectAll={false}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Section 4: Civilization & Politics */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Civilization & Politics
                    </h3>
                    <p className="text-muted-foreground">Define how people live, organize, and travel in your world</p>
                  </div>

                  {/* Settlement Density */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Settlement density & tech level?</CardTitle>
                      <CardDescription>
                        How developed and populated is your world?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        options={settlementDensityOptions}
                        value={form.watch("settlementDensity") || ""}
                        onChange={(value) => form.setValue("settlementDensity", value as any)}
                        name="settlementDensity"
                        error={form.formState.errors.settlementDensity?.message}
                        required
                      />
                    </CardContent>
                  </Card>

                  {/* Political Complexity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Political complexity you want to show?</CardTitle>
                      <CardDescription>
                        How many realms and political divisions?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CompactRadioGroup
                        options={politicalComplexityOptions}
                        value={form.watch("politicalComplexity") || ""}
                        onChange={(value) => form.setValue("politicalComplexity", value as any)}
                        name="politicalComplexity"
                        columns={3}
                        error={form.formState.errors.politicalComplexity?.message}
                        required
                      />
                    </CardContent>
                  </Card>

                  {/* Travel Focus */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Travel & gameplay focus?</CardTitle>
                      <CardDescription>
                        How do people travel to guide roads and routes?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CheckboxGroup
                        options={travelFocusOptions}
                        value={form.watch("travelFocus") || []}
                        onChange={(value) => form.setValue("travelFocus", value as any)}
                        minSelections={1}
                        maxSelections={5}
                        error={form.formState.errors.travelFocus?.message}
                        required
                        columns={2}
                        showSelectAll={true}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Context Options */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Context Options
                    </h3>
                    <p className="text-muted-foreground">Choose what context to include in your map prompt</p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">World Context</CardTitle>
                      <CardDescription>
                        Include your world's name, themes, and description in the prompt
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-world-context"
                          checked={includeWorldContext}
                          onCheckedChange={setIncludeWorldContext}
                        />
                        <Label htmlFor="include-world-context" className="text-sm">
                          Include world context in prompt
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Entity Context</CardTitle>
                      <CardDescription>
                        Select specific entities from your world to highlight in the map
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Entity Search */}
                      <div className="space-y-2">
                        <Label htmlFor="entity-search">Search Entities</Label>
                        <Input
                          id="entity-search"
                          type="text"
                          placeholder="Search for entities..."
                          value={entitySearchTerm}
                          onChange={(e) => setEntitySearchTerm(e.target.value)}
                        />
                      </div>

                      {/* Entity List */}
                      {filteredEntities.length > 0 ? (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {filteredEntities.map((entity: any) => (
                              <label key={entity.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedEntityIds.includes(entity.id)}
                                  onChange={() => handleEntityToggle(entity.id)}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">{entity.name}</span>
                                {entity.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {entity.type}
                                  </Badge>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {entitySearchTerm ? 'No entities found matching your search' : 'No entities found in this world'}
                        </div>
                      )}

                      {/* Selected Entities */}
                      {selectedEntityIds.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Selected Entities ({selectedEntityIds.length})</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearSelectedEntities}
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntityIds.map((entityId) => {
                              const entity = entities.find((e: any) => e.id === entityId);
                              return entity ? (
                                <Badge key={entityId} variant="outline" className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {entity.name}
                                  <button
                                    type="button"
                                    onClick={() => handleEntityToggle(entityId)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Prompt Generation and Editing */}
                <div className="space-y-6">
                  <div className="text-center space-y-2 pb-4 border-b border-muted">
                    <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Generate & Review Prompt
                    </h3>
                    <p className="text-muted-foreground">Generate and customize your map creation prompt</p>
                  </div>

                  {!showPromptEditor ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Ready to generate your prompt?</p>
                            <p className="text-muted-foreground">
                              We'll create a detailed prompt based on your selections that you can review and edit before generating the map.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={generatePrompt}
                            disabled={isGeneratingPrompt || !form.watch("mapPurpose") || !form.watch("mapScale") ||
                              !form.watch("genreTags")?.length || !form.watch("terrainEmphasis")?.length ||
                              !form.watch("climateZones")?.length || !form.watch("settlementDensity") ||
                              !form.watch("politicalComplexity") || !form.watch("travelFocus")?.length ||
                              !form.watch("visualStyle")}
                            className="min-w-[200px]"
                            size="lg"
                          >
                            {isGeneratingPrompt ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Prompt...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Generate Prompt
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5" />
                          Review & Edit Your Prompt
                        </CardTitle>
                        <CardDescription>
                          Review the generated prompt and make any edits before creating your map
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prompt-editor">Generated Prompt</Label>
                          <Textarea
                            id="prompt-editor"
                            value={generatedPrompt}
                            onChange={(e) => setGeneratedPrompt(e.target.value)}
                            placeholder="Your generated prompt will appear here..."
                            rows={8}
                            className="font-mono text-sm"
                          />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{generatedPrompt.length} characters</span>
                            <span>Edit the prompt to fine-tune your map generation</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowPromptEditor(false);
                              setGeneratedPrompt("");
                            }}
                          >
                            Back to Form
                          </Button>
                          <Button
                            type="button"
                            onClick={generatePrompt}
                            disabled={isGeneratingPrompt}
                            variant="outline"
                          >
                            {isGeneratingPrompt ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              "Regenerate Prompt"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Generation Progress */}
                {isGenerating && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="font-medium">Generating your world map...</span>
                        </div>
                        <Progress value={undefined} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          Creating a map based on your specifications. This may take 30-60 seconds.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="procedural" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Procedural Generation
                  </CardTitle>
                  <CardDescription>
                    Generate a map using procedural algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Procedural generation is coming soon! For now, please use the upload option.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Map Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Map Details</CardTitle>
              <CardDescription>
                Basic information about your map
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Map Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Enter a descriptive name for your map"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_public">Visibility</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_public"
                      checked={form.watch("is_public")}
                      onCheckedChange={(checked) => form.setValue("is_public", checked)}
                    />
                    <Label htmlFor="is_public" className="text-sm text-muted-foreground">
                      Make this map public for others to view
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe this map's purpose, region, or any important notes..."
                  rows={3}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {/* Technical settings (collapsible for advanced users) */}
              {creationMethod === "upload" && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Technical Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width_px">Width (px)</Label>
                      <Input
                        id="width_px"
                        type="number"
                        {...form.register("width_px", { valueAsNumber: true })}
                        min="100"
                        max="10000"
                      />
                      {form.formState.errors.width_px && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.width_px.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height_px">Height (px)</Label>
                      <Input
                        id="height_px"
                        type="number"
                        {...form.register("height_px", { valueAsNumber: true })}
                        min="100"
                        max="10000"
                      />
                      {form.formState.errors.height_px && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.height_px.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixels_per_unit">Pixels/Unit</Label>
                      <Input
                        id="pixels_per_unit"
                        type="number"
                        step="0.1"
                        {...form.register("pixels_per_unit", { valueAsNumber: true })}
                        min="0.1"
                        max="1000"
                      />
                      {form.formState.errors.pixels_per_unit && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.pixels_per_unit.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_zoom">Default Zoom</Label>
                      <Input
                        id="default_zoom"
                        type="number"
                        step="0.1"
                        {...form.register("default_zoom", { valueAsNumber: true })}
                        min="0.1"
                        max="5"
                      />
                      {form.formState.errors.default_zoom && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.default_zoom.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {creationMethod === "ai" && (
                "AI generation uses GPT-image-1 and may take 30-60 seconds"
              )}
              {creationMethod === "upload" && uploadedFile && (
                `Selected file: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB)`
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMapMutation.isPending || isUploading || isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMapMutation.isPending ||
                  isUploading ||
                  isGenerating ||
                  isGeneratingPrompt ||
                  (creationMethod === "upload" && !uploadedFile) ||
                  (creationMethod === "ai" && !generatedPrompt)
                }
                className="min-w-[140px]"
              >
                {createMapMutation.isPending || isUploading || isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isGenerating ? "Generating..." : isUploading ? "Uploading..." : "Creating..."}
                  </>
                ) : creationMethod === "ai" ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate World Map
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Map
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}