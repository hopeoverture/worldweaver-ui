"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { useDeleteMap } from "@/hooks/mutations/useDeleteMap";
import { Map } from "@/hooks/query/useWorldMaps";
import { Loader2 } from "lucide-react";

interface DeleteMapDialogProps {
  open: boolean;
  onClose: () => void;
  map: Map;
  worldId: string;
}

export function DeleteMapDialog({ open, onClose, map, worldId }: DeleteMapDialogProps) {
  const { toast } = useToast();
  const deleteMapMutation = useDeleteMap(worldId, map.id);

  const handleDelete = async () => {
    try {
      await deleteMapMutation.mutateAsync();
      toast({
        title: "Map deleted",
        description: `"${map.name}" has been permanently deleted.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error deleting map",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!deleteMapMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Map</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{map.name}"? This action cannot be undone.
            All markers, layers, and other map data will be permanently lost.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteMapMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteMapMutation.isPending}
            variant="destructive"
            className="flex-1"
          >
            {deleteMapMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Delete Map
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}