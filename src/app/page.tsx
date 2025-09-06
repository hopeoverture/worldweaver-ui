'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { WorldGrid } from '@/components/worlds/WorldGrid';
import { CreateWorldModal } from '@/components/worlds/CreateWorldModal';
import { WorldEditModal } from '@/components/worlds/WorldEditModal';
import { DeleteWorldModal } from '@/components/worlds/DeleteWorldModal';
import { ArchiveWorldModal } from '@/components/worlds/ArchiveWorldModal';
import { Button } from '@/components/ui/Button';
import { useKeyboardShortcuts, KeyboardShortcutIndicator } from '@/components/ui/KeyboardShortcuts';

export default function WorldsPage() {
  const router = useRouter();
  const { worlds, entities } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editWorldId, setEditWorldId] = useState<string | null>(null);
  const [deleteWorldId, setDeleteWorldId] = useState<string | null>(null);
  const [archiveWorldId, setArchiveWorldId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filter worlds based on archive status
  const filteredWorlds = worlds.filter(world => 
    showArchived ? world.isArchived : !world.isArchived
  );

  // Calculate dynamic entity counts for each filtered world
  const worldsWithDynamicCounts = filteredWorlds.map(world => {
    const entityCount = entities.filter(entity => entity.worldId === world.id).length;
    return {
      ...world,
      entityCount
    };
  });

  const totalEntities = entities.length;
  const archivedCount = worlds.filter(w => w.isArchived).length;

  const handleNewWorld = () => {
    setIsModalOpen(true);
  };

  const handleEditWorld = (id: string) => {
    setEditWorldId(id);
  };

  const handleDeleteWorld = (id: string) => {
    setDeleteWorldId(id);
  };

  const handleArchiveWorld = (id: string) => {
    setArchiveWorldId(id);
  };

  const handleCloseEditModal = () => {
    setEditWorldId(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteWorldId(null);
  };

  const handleCloseArchiveModal = () => {
    setArchiveWorldId(null);
  };

  const handleSaveWorld = () => {
    // World creation is now handled inside the CreateWorldModal
    setIsModalOpen(false);
  };

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    onNewWorld: handleNewWorld,
    onSearch: () => {
      // TODO: Implement search functionality
      console.log('Search triggered');
    }
  });

  return (
    <main className="container py-8">
      {/* Header with improved layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {showArchived ? 'Archived Worlds' : 'Your Worlds'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {showArchived ? 'Manage your archived universes' : 'Manage and explore your creative universes'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Archive toggle */}
          {archivedCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
              className="hidden sm:flex items-center gap-2"
            >
              {showArchived ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Back to Active
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                  </svg>
                  View Archived ({archivedCount})
                </>
              )}
            </Button>
          )}

          {filteredWorlds.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <KeyboardShortcutIndicator keys={['⌘', 'N']} />
                <span>New world</span>
              </div>
              {!showArchived && (
                <Button
                  onClick={handleNewWorld}
                  data-testid="new-world-button"
                  size="lg"
                  className="group hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="h-5 w-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="relative z-10">New World</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats section for when there are worlds */}
      {filteredWorlds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {filteredWorlds.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {showArchived ? 'Archived' : 'Active'} {filteredWorlds.length === 1 ? 'World' : 'Worlds'}
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {totalEntities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Entities
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4">
            <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {filteredWorlds.filter(w => {
                const date = new Date(w.updatedAt);
                const today = new Date();
                const diffTime = today.getTime() - date.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {showArchived ? 'Recently Archived' : 'Active This Week'}
            </div>
          </div>
        </div>
      )}

      {/* Grid with improved spacing */}
      <WorldGrid
        worlds={worldsWithDynamicCounts}
        onEnterWorld={(id) => router.push(`/world/${id}`)}
        onEditWorld={handleEditWorld}
        onArchiveWorld={handleArchiveWorld}
        onDeleteWorld={handleDeleteWorld}
        onCreateWorld={handleNewWorld}
      />

      {/* Modals */}
      <CreateWorldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {editWorldId && (
        <WorldEditModal
          isOpen={!!editWorldId}
          worldId={editWorldId}
          onClose={handleCloseEditModal}
        />
      )}

      {deleteWorldId && (
        <DeleteWorldModal
          worldId={deleteWorldId}
          worldName={worlds.find(w => w.id === deleteWorldId)?.name}
          onClose={handleCloseDeleteModal}
        />
      )}

      {archiveWorldId && (
        <ArchiveWorldModal
          worldId={archiveWorldId}
          worldName={worlds.find(w => w.id === archiveWorldId)?.name}
          isArchived={worlds.find(w => w.id === archiveWorldId)?.isArchived}
          onClose={handleCloseArchiveModal}
        />
      )}
      
      {/* Floating action buttons for mobile */}
      {filteredWorlds.length > 0 && !showArchived && (
        <Button
          onClick={handleNewWorld}
          className="group fixed sm:hidden bottom-6 right-6 h-14 w-14 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          aria-label="New World"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          <svg className="h-6 w-6 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      )}

      {/* Mobile archive toggle */}
      {archivedCount > 0 && (
        <Button
          onClick={() => setShowArchived(!showArchived)}
          variant="outline"
          className="fixed sm:hidden bottom-6 left-6 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 px-4"
          aria-label={showArchived ? "Back to Active" : "View Archived"}
        >
          {showArchived ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Active
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
              </svg>
              Archive
            </>
          )}
        </Button>
      )}
    </main>
  );
}