'use client';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Image, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';
import type { KonvaEventObject } from 'konva/lib/Node';
import { EntityCardModal } from './EntityCardModal';
import { useMapMarkers, MapMarker } from '@/hooks/query/useMapMarkers';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MapCanvasProps {
  worldId: string;
  mapId: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  editable?: boolean;
  onMarkerAdd?: (x: number, y: number) => void;
  className?: string;
}

const EntityMarkerComponent: React.FC<{
  marker: MapMarker;
  onClick: (marker: MapMarker) => void;
  onHover: (marker: MapMarker | null) => void;
}> = React.memo(({ marker, onClick, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover(marker);
  }, [marker, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick(marker);
  }, [marker, onClick]);

  // Different visual treatment for entity vs non-entity markers
  const isEntityMarker = !!marker.entity_id;
  const markerRadius = isHovered ? 8 : 6;
  const strokeWidth = isEntityMarker ? 3 : 2;
  const markerColor = marker.color || (isEntityMarker ? '#3b82f6' : '#ef4444');

  return (
    <Group
      x={marker.x}
      y={marker.y}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* Main marker circle */}
      <Circle
        radius={markerRadius}
        fill={markerColor}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        shadowColor="#000000"
        shadowBlur={isHovered ? 8 : 4}
        shadowOpacity={0.3}
        shadowOffsetY={2}
        style={{ cursor: 'pointer' }}
      />

      {/* Entity indicator (small dot) */}
      {isEntityMarker && (
        <Circle
          radius={2}
          fill="#ffffff"
          x={0}
          y={0}
        />
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <Group>
          <Text
            text={marker.title}
            fontSize={12}
            fill="#000000"
            x={-marker.title.length * 3}
            y={-30}
            padding={4}
            cornerRadius={4}
            fillAfterStrokeEnabled={true}
            stroke="#ffffff"
            strokeWidth={1}
            shadowColor="#000000"
            shadowBlur={4}
            shadowOpacity={0.3}
            shadowOffsetY={1}
          />
          {marker.entity_name && (
            <Text
              text={`📍 ${marker.entity_name}`}
              fontSize={10}
              fill="#666666"
              x={-marker.entity_name.length * 2.5}
              y={-15}
              padding={2}
            />
          )}
        </Group>
      )}
    </Group>
  );
});

EntityMarkerComponent.displayName = 'EntityMarkerComponent';

export function MapCanvas({
  worldId,
  mapId,
  imageUrl,
  width = 800,
  height = 600,
  editable = false,
  onMarkerAdd,
  className
}: MapCanvasProps) {
  const [image] = useImage(imageUrl || '');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);

  // Fetch markers for this map
  const {
    data: markersData,
    isLoading: markersLoading,
    error: markersError
  } = useMapMarkers(worldId, mapId);

  const markers = useMemo(() => markersData?.markers || [], [markersData]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, []);

  // Handle stage click for adding markers (if editable)
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!editable || !onMarkerAdd) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert screen coordinates to map coordinates
    const mapX = (pointer.x - position.x) / scale;
    const mapY = (pointer.y - position.y) / scale;

    onMarkerAdd(mapX, mapY);
  }, [editable, onMarkerAdd, position, scale]);

  // Handle marker click
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    if (marker.entity_id) {
      setSelectedEntityId(marker.entity_id);
    } else {
      // For non-entity markers, could show a simple tooltip or info
      console.log('Non-entity marker clicked:', marker);
    }
  }, []);

  // Handle marker hover
  const handleMarkerHover = useCallback((marker: MapMarker | null) => {
    setHoveredMarker(marker);
  }, []);

  // Control functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(5, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.1, prev / 1.2));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Render loading state
  if (markersLoading && !markers.length) {
    return (
      <div className={`relative border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800 ${className}`}>
        <div className="flex items-center justify-center" style={{ width, height }}>
          <div className="text-center">
            <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-4 w-32 mx-auto mb-2" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (markersError) {
    return (
      <div className={`relative border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800 ${className}`}>
        <div className="flex items-center justify-center" style={{ width, height }}>
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to Load Map
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {markersError.message || 'Unable to load map markers'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800 ${className}`}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          draggable
          onDragEnd={(e) => {
            setPosition({
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
        >
          {/* Base map layer */}
          <Layer>
            {image && (
              <Image
                image={image}
                width={image.width}
                height={image.height}
              />
            )}
          </Layer>

          {/* Markers layer */}
          <Layer>
            {markers.map((marker) => (
              <EntityMarkerComponent
                key={marker.id}
                marker={marker}
                onClick={handleMarkerClick}
                onHover={handleMarkerHover}
              />
            ))}
          </Layer>
        </Stage>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={zoomIn}
            className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
          {editable ? (
            <p>Click to add markers • Drag to pan • Scroll to zoom • Click markers for details</p>
          ) : (
            <p>Drag to pan • Scroll to zoom • Click markers for details</p>
          )}
        </div>

        {/* Marker count badge */}
        {markers.length > 0 && (
          <div className="absolute top-4 left-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {markers.length} marker{markers.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Hover marker info */}
        {hoveredMarker && (
          <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 max-w-xs">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {hoveredMarker.title}
            </h4>
            {hoveredMarker.entity_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Entity: {hoveredMarker.entity_name}
              </p>
            )}
            {hoveredMarker.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {hoveredMarker.subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Entity Card Modal */}
      <EntityCardModal
        entityId={selectedEntityId}
        worldId={worldId}
        onClose={() => setSelectedEntityId(null)}
      />
    </>
  );
}