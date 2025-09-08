'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorlds } from '@/hooks/query/useWorlds';
import { WorldGrid } from '@/components/worlds/WorldGrid';
import { CreateWorldModal } from '@/components/worlds/CreateWorldModal';
import { WorldEditModal } from '@/components/worlds/WorldEditModal';
import { DeleteWorldModal } from '@/components/worlds/DeleteWorldModal';
import { ArchiveWorldModal } from '@/components/worlds/ArchiveWorldModal';
import { Button } from '@/components/ui/Button';
import { useKeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';

export default function WorldsPage() {
  const router = useRouter();
  const { data: worlds = [], isLoading, error } = useWorlds();
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editWorldId, setEditWorldId] = useState<string | null>(null);
  const [deleteWorldId, setDeleteWorldId] = useState<string | null>(null);
  const [archiveWorldId, setArchiveWorldId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Optional: auto dismiss query error after a delay
  // setTimeout(() => setErrorDismissed(true), 5000);

  // Filter worlds based on archived status
  const filteredWorlds = worlds.filter(world => 
    showArchived ? world.isArchived : !world.isArchived
  );
  
  const archivedCount = worlds.filter(world => world.isArchived).length;

  const handleNewWorld = () => {
    setIsModalOpen(true);
  };

  const handleEditWorld = (id: string) => {
    setEditWorldId(id);
  };

  const handleCloseEditModal = () => {
    setEditWorldId(null);
  };

  const handleDeleteWorld = (id: string) => {
    setDeleteWorldId(id);
  };

  const handleCloseDeleteModal = () => {
    setDeleteWorldId(null);
  };

  const handleArchiveWorld = (id: string) => {
    setArchiveWorldId(id);
  };

  const handleCloseArchiveModal = () => {
    setArchiveWorldId(null);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewWorld: handleNewWorld
  });

  return (
    <main className="container py-8">
      {/* Error Message */}
      {error && !errorDismissed && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200">{String((error as any)?.message || 'Failed to load worlds')}</span>
            </div>
            <button
              onClick={() => setErrorDismissed(true)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            <span>Loading your worlds...</span>
          </div>
        </div>
      )}

      {/* Main Content - only show when not loading */}
      {!isLoading && (
        <>
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
              {/* Archive toggle button */}
              {archivedCount > 0 && (
                <Button
                  onClick={() => setShowArchived(!showArchived)}
                  variant="outline"
                  className="hidden sm:flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                      Archived ({archivedCount})
                    </>
                  )}
                </Button>
              )}
              
              {/* New World button */}
              {!showArchived && (
                <Button
                  onClick={handleNewWorld}
                  className="group relative hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-4 h-4 relative z-10 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="relative z-10">New World</span>
                </Button>
              )}
            </div>
          </div>

          {/* Main content */}
          <WorldGrid
            worlds={filteredWorlds}
            onEnterWorld={(id) => router.push(`/world/${id}`)}
            onEditWorld={handleEditWorld}
            onDeleteWorld={handleDeleteWorld}
            onArchiveWorld={handleArchiveWorld}
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
        </>
      )}
    </main>
  );
}
