"use client";

import { useState } from "react";
import { Map } from "@/hooks/query/useWorldMaps";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { MapPin, Search, Grid, List, Eye, Edit, Trash2, MoreHorizontal, Upload } from "lucide-react";
import { cn } from "@/lib/component-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MapListProps {
  maps: Map[] | undefined;
  isLoading: boolean;
  onViewMap: (map: Map) => void;
  onEditMap: (map: Map) => void;
  onDeleteMap: (map: Map) => void;
  onCreateMap: () => void;
}

type ViewMode = "grid" | "list";

export function MapList({
  maps,
  isLoading,
  onViewMap,
  onEditMap,
  onDeleteMap,
  onCreateMap,
}: MapListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMaps = maps?.filter((map) =>
    map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onCreateMap}>
            <Upload className="h-4 w-4 mr-2" />
            New Map
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMaps.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? "No maps found" : "No maps yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Create your first map to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateMap}>
              <Upload className="h-4 w-4 mr-2" />
              Create Map
            </Button>
          )}
        </div>
      )}

      {/* Maps Grid/List */}
      {filteredMaps.length > 0 && (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-2"
          )}
        >
          {filteredMaps.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              viewMode={viewMode}
              onView={() => onViewMap(map)}
              onEdit={() => onEditMap(map)}
              onDelete={() => onDeleteMap(map)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MapCardProps {
  map: Map;
  viewMode: ViewMode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MapCard({ map, viewMode, onView, onEdit, onDelete }: MapCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                {map.image_path ? (
                  <>
                    <img
                      src={map.image_path}
                      alt={map.name}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="absolute inset-0 hidden items-center justify-center fallback-icon">
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </>
                ) : (
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{map.name}</h3>
                {map.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {map.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">
                    {map.width_px} × {map.height_px}px
                  </span>
                  {map.is_public && (
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onView}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{map.name}</CardTitle>
            {map.description && (
              <CardDescription className="line-clamp-2">
                {map.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden relative">
          {map.image_path ? (
            <>
              <img
                src={map.image_path}
                alt={map.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback-container');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center fallback-container">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{map.width_px} × {map.height_px}px</span>
          {map.is_public && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye className="h-4 w-4 mr-2" />
          View Map
        </Button>
      </CardFooter>
    </Card>
  );
}