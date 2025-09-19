'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Image, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';
import type { KonvaEventObject } from 'konva/lib/Node';

interface Marker {
  id: string;
  x: number;
  y: number;
  entityId?: string;
  entityName?: string;
  label: string;
  color?: string;
}

interface MapViewerProps {
  imageUrl?: string;
  markers?: Marker[];
  width?: number;
  height?: number;
  onMarkerClick?: (marker: Marker) => void;
  onStageClick?: (x: number, y: number) => void;
  editable?: boolean;
}

const MarkerComponent: React.FC<{
  marker: Marker;
  onClick: (marker: Marker) => void;
}> = ({ marker, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Group
      x={marker.x}
      y={marker.y}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(marker)}
      onTap={() => onClick(marker)}
    >
      <Circle
        radius={isHovered ? 8 : 6}
        fill={marker.color || '#ef4444'}
        stroke="#ffffff"
        strokeWidth={2}
        shadowColor="#000000"
        shadowBlur={isHovered ? 8 : 4}
        shadowOpacity={0.3}
        shadowOffsetY={2}
      />
      {isHovered && (
        <Text
          text={marker.label}
          fontSize={12}
          fill="#000000"
          x={-marker.label.length * 3}
          y={-25}
          padding={4}
          cornerRadius={4}
          stroke="#cccccc"
          strokeWidth={1}
        />
      )}
    </Group>
  );
};

export function MapViewer({
  imageUrl,
  markers = [],
  width = 800,
  height = 600,
  onMarkerClick,
  onStageClick,
  editable = false
}: MapViewerProps) {
  const [image, status] = useImage(imageUrl || '');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

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

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!editable || !onStageClick) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert screen coordinates to map coordinates
    const mapX = (pointer.x - position.x) / scale;
    const mapY = (pointer.y - position.y) / scale;

    onStageClick(mapX, mapY);
  }, [editable, onStageClick, position, scale]);

  const handleMarkerClick = useCallback((marker: Marker) => {
    onMarkerClick?.(marker);
  }, [onMarkerClick]);

  return (
    <div className="relative border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
      {status === 'failed' && imageUrl ? (
        <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Failed to load map image</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </div>
      ) : (
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
          <Layer>
            {image && (
              <Image
                image={image}
                width={image.width}
                height={image.height}
              />
            )}

            {markers.map((marker) => (
              <MarkerComponent
                key={marker.id}
                marker={marker}
                onClick={handleMarkerClick}
              />
            ))}
          </Layer>
        </Stage>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            setScale(Math.min(5, scale * 1.2));
          }}
          className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            setScale(Math.max(0.1, scale / 1.2));
          }}
          className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded p-2 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
          title="Reset View"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
        {editable ? (
          <p>Click to add markers • Drag to pan • Scroll to zoom</p>
        ) : (
          <p>Drag to pan • Scroll to zoom • Click markers for details</p>
        )}
      </div>
    </div>
  );
}