'use client';
import React, { useState } from 'react';
import { MapCanvas } from './MapCanvas';
import { MapList } from './MapList';
import { NewMapModal } from './NewMapModal';
import { EditMapModal } from './EditMapModal';
import { DeleteMapDialog } from './DeleteMapDialog';
import { useWorldMaps, Map } from '@/hooks/query/useWorldMaps';
import { useToast } from '@/hooks/use-toast';

interface MapsTabProps {
  worldId: string;
  onEntityCardOpen?: (entityId: string) => void;
}

export function MapsTab({ worldId, onEntityCardOpen }: MapsTabProps) {
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<Map | null>(null);
  const [deletingMap, setDeletingMap] = useState<Map | null>(null);
  const { data: maps, isLoading } = useWorldMaps(worldId);
  const { toast } = useToast();

  const handleMapSelect = (map: Map) => {
    setSelectedMap(map);
  };


  const handleViewMap = (map: Map) => {
    setSelectedMap(map);
  };

  const handleEditMap = (map: Map) => {
    setEditingMap(map);
  };

  const handleDeleteMap = (map: Map) => {
    setDeletingMap(map);
  };

  const handleCreateMap = () => {
    setIsNewMapModalOpen(true);
  };

  if (selectedMap) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMap(null)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              title="Back to maps"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedMap.name}
              </h2>
              {selectedMap.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedMap.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleEditMap(selectedMap)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              Edit
            </button>
            <button className="px-3 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Add Marker
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
          <MapCanvas
            worldId={worldId}
            mapId={selectedMap.id}
            imageUrl={selectedMap.image_path || '/api/placeholder/800/600'}
            width={selectedMap.width_px}
            height={selectedMap.height_px}
            editable={true}
          />
        </div>

        {/* Map Details Panel */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Markers</h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No markers yet. Click "Add Marker" to create your first marker.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Map Info</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedMap.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedMap.is_public ? 'Public' : 'Private'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedMap.width_px} × {selectedMap.height_px}px
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MapList
        maps={maps}
        isLoading={isLoading}
        onViewMap={handleViewMap}
        onEditMap={handleEditMap}
        onDeleteMap={handleDeleteMap}
        onCreateMap={handleCreateMap}
      />

      <NewMapModal
        open={isNewMapModalOpen}
        onClose={() => setIsNewMapModalOpen(false)}
        worldId={worldId}
      />

      {editingMap && (
        <EditMapModal
          open={!!editingMap}
          onClose={() => setEditingMap(null)}
          map={editingMap}
          worldId={worldId}
        />
      )}

      {deletingMap && (
        <DeleteMapDialog
          open={!!deletingMap}
          onClose={() => setDeletingMap(null)}
          map={deletingMap}
          worldId={worldId}
        />
      )}
    </div>
  );
}