"use client";

import React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useUpdateMap } from "@/hooks/mutations/useUpdateMap";
import { Map } from "@/hooks/query/useWorldMaps";
import { Loader2 } from "lucide-react";

const editMapSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be under 255 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  is_public: z.boolean()
});

type EditMapFormData = z.infer<typeof editMapSchema>;

interface EditMapModalProps {
  open: boolean;
  onClose: () => void;
  map: Map;
  worldId: string;
}

export function EditMapModal({ open, onClose, map, worldId }: EditMapModalProps) {
  const { toast } = useToast();
  const updateMapMutation = useUpdateMap(worldId, map.id);

  const form = useForm<EditMapFormData>({
    resolver: zodResolver(editMapSchema),
    defaultValues: {
      name: map.name,
      description: map.description || "",
      is_public: map.is_public
    }
  });

  const onSubmit = async (data: EditMapFormData) => {
    try {
      await updateMapMutation.mutateAsync(data);
      toast({
        title: "Map updated",
        description: "Your map has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error updating map",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!updateMapMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Map</DialogTitle>
          <DialogDescription>
            Update your map's name, description, and visibility settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Map Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Map Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter map name..."
              disabled={updateMapMutation.isPending}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe your map..."
              rows={3}
              disabled={updateMapMutation.isPending}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_public">Public Map</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to view this map
              </p>
            </div>
            <Switch
              id="is_public"
              checked={form.watch("is_public")}
              onCheckedChange={(checked) => form.setValue("is_public", checked)}
              disabled={updateMapMutation.isPending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMapMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMapMutation.isPending}
              className="flex-1"
            >
              {updateMapMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}