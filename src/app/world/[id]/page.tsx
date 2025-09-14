'use client';
import { useState, Suspense, useEffect } from 'react';
import { useParams } from 'next/navigation';
// Removed useStore - now using TanStack Query hooks exclusively
import { useWorld } from '@/hooks/query/useWorld';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useWorldTemplates } from '@/hooks/query/useWorldTemplates';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useWorldRelationships } from '@/hooks/query/useWorldRelationships';
import { useWorldMembers } from '@/hooks/query/useWorldMembers';
import { WorldContextBar } from '@/components/dashboard/WorldContextBar';
import { TabNav } from '@/components/dashboard/TabNav';
import { FolderBreadcrumb } from '@/components/folders/FolderBreadcrumb';
import { useDeleteTemplate } from '@/hooks/mutations/useDeleteTemplate';
import { TabItem } from '@/components/ui/Tabs';
import { useUpdateFolder } from '@/hooks/mutations/useUpdateFolder';
import { useDeleteFolder } from '@/hooks/mutations/useDeleteFolder';
import { useUpdateEntity } from '@/hooks/mutations/useUpdateEntity';
import { useUpdateTemplate } from '@/hooks/mutations/useUpdateTemplate';
import { useToast } from '@/components/ui/ToastProvider';
import { Input } from '@/components/ui/Input';
import { CORE_TEMPLATE_NAMES } from '@/lib/coreTemplates';
import type { Entity, Template, Folder } from '@/lib/types';

// Ungrouped Entities Drop Zone Component
function UngroupedEntitiesDropZone({
  entities,
  onEntityDrop,
  onCreateEntity,
  onDragStart
}: {
  entities: Entity[];
  onEntityDrop: (entityId: string, entityName: string) => void;
  onCreateEntity: () => void;
  onDragStart: (entity: Entity) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'entity') {
        onEntityDrop(data.id, data.name);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  if (entities.length === 0) {
    return (
      <div
        className={`text-center py-8 rounded-lg border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-neutral-700 text-gray-500 dark:text-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm">
          {isDragOver ? 'Drop here to ungroup entity' : 'Drag entities here to remove them from folders'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg transition-colors ${
        isDragOver ? 'bg-brand-50/50 dark:bg-brand-900/20 p-4 border-2 border-dashed border-brand-500 dark:border-brand-400' : ''
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Ungrouped Entities
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {entities.length} {entities.length === 1 ? 'entity' : 'entities'}
        </span>
      </div>
      <Suspense fallback={<SkeletonLoader type="entities" message="Loading entities..." />}>
        <LazyEntityGrid
          entities={entities}
          onCreateEntity={onCreateEntity}
          onDragStart={onDragStart}
        />
      </Suspense>
    </div>
  );
}

// Ungrouped Templates Drop Zone Component
function UngroupedTemplatesDropZone({
  templates,
  onTemplateDrop,
  onCreateTemplate,
  onDragStart,
  customizedTemplateIds = []
}: {
  templates: Template[];
  onTemplateDrop: (templateId: string, templateName: string) => void;
  onCreateTemplate: () => void;
  onDragStart: (template: Template) => void;
  customizedTemplateIds?: string[];
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'template') {
        onTemplateDrop(data.id, data.name);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  };

  if (templates.length === 0) {
    return (
      <div
        className={`text-center py-8 rounded-lg border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-neutral-700 text-gray-500 dark:text-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-sm">
          {isDragOver ? 'Drop here to ungroup template' : 'Drag templates here to remove them from folders'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg transition-colors ${
        isDragOver ? 'bg-brand-50/50 dark:bg-brand-900/20 p-4 border-2 border-dashed border-brand-500 dark:border-brand-400' : ''
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Ungrouped Templates
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {templates.length} {templates.length === 1 ? 'template' : 'templates'}
        </span>
      </div>
      <Suspense fallback={<SkeletonLoader type="templates" message="Loading templates..." />}>
        <LazyTemplateGrid
          templates={templates}
          onEdit={(template: Template) => {}}
          onDelete={undefined}
          onCreateTemplate={onCreateTemplate}
          onDragStart={onDragStart}
          customizedTemplateIds={customizedTemplateIds}
        />
      </Suspense>
    </div>
  );
}

// Lazy-loaded components for better performance
import { 
  LazyEntityGrid,
  LazyTemplateGrid, 
  LazyFolderGrid,
  LazyRelationshipGraph,
  LazyRelationshipTable,
  LazyMembershipTab,
  LazyCreateEntityModal,
  LazyCreateTemplateModal,
  LazyCreateFolderModal,
  LazyCreateRelationshipModal,
  LazyEditFolderModal,
  LazyComponentLoader,
  SkeletonLoader
} from '@/components/lazy';

export default function WorldDashboard() {
  const { id: worldId } = useParams();
  // Note: relationships would come from a useRelationships hook when implemented
  // updateTemplate and deleteTemplate are handled by mutation hooks
  const strWorldId = String(worldId);
  const { data: world, isLoading, error } = useWorld(strWorldId);
  const { data: remoteEntities = [] as Entity[] } = useWorldEntities(strWorldId);
  const { data: remoteTemplates = [] as Template[] } = useWorldTemplates(strWorldId);
  const { data: remoteFolders = [] as Folder[] } = useWorldFolders(strWorldId);
  const { data: relationships = [] } = useWorldRelationships(strWorldId);
  const { data: members = [] } = useWorldMembers(strWorldId);
  
  const [activeTab, setActiveTab] = useState('entities');
  const deleteTemplateMut = useDeleteTemplate(strWorldId);
  const updateFolderMut = useUpdateFolder();
  const deleteFolderMut = useDeleteFolder();
  const updateEntityMut = useUpdateEntity(strWorldId);
  const updateTemplateMut = useUpdateTemplate(strWorldId);
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<string[]>([]); // Array of folder IDs from root to current
  const [isCreateEntityModalOpen, setCreateEntityModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [isCreateRelationshipModalOpen, setCreateRelationshipModalOpen] = useState(false);
  const [folderType, setFolderType] = useState<'entities' | 'templates'>('entities');
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to filter items by search term
  const filterBySearch = <T,>(
    items: T[],
    searchTerm: string
  ): T[] => {
    if (!searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
      const itemWithName = item as any;
      const nameMatch = itemWithName.name?.toLowerCase().includes(term);
      const descriptionMatch = itemWithName.description?.toLowerCase().includes(term);

      // For entities, also search in custom field values
      if ('data' in itemWithName && typeof itemWithName.data === 'object' && itemWithName.data) {
        const dataValues = Object.values(itemWithName.data as Record<string, unknown>);
        const dataMatch = dataValues.some(value =>
          typeof value === 'string' && value.toLowerCase().includes(term)
        );
        return nameMatch || descriptionMatch || dataMatch;
      }

      return nameMatch || descriptionMatch;
    });
  };

  if (isLoading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
        <span>Loading world...</span>
      </div>
    </div>
  );
  if (error) return <div>Failed to load world</div>;
  if (!world) return <div>World not found</div>;

  const handleTemplateDelete = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) return;
    deleteTemplateMut.mutate(templateId, {
      onSuccess: () => toast({ title: 'Template deleted', variant: 'success' }),
      onError: (e) => toast({ title: 'Failed to delete template', description: String((e as Error)?.message || e), variant: 'error' }),
    });
  };
  const handleFolderRename = (folder: Folder) => {
    setEditFolder(folder);
    setEditOpen(true);
  };

  const handleFolderDelete = async (folder: Folder) => {
    if (!confirm(`Delete folder "${folder.name}"? Items inside remain ungrouped.`)) return;
    try {
      await deleteFolderMut.mutateAsync({ id: folder.id, worldId: strWorldId });
      toast({ title: 'Folder deleted', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to delete folder', description: String((e as Error)?.message || e), variant: 'error' });
    }
  };

  // Folder navigation helpers
  const buildFolderPath = (folderId: string | null): Folder[] => {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = remoteFolders.find(f => f.id === currentId);
      if (!folder) break;

      path.unshift(folder); // Add to beginning of array
      currentId = folder.parentFolderId || null;
    }

    return path;
  };

  const navigateToFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
    setFolderPath(folderId ? buildFolderPath(folderId).map(f => f.id) : []);
  };

  // Get the path of folder objects for breadcrumb
  const currentFolderPath = buildFolderPath(selectedFolder);

  // Drag and drop handlers
  const handleEntityDragStart = (entity: Entity) => {
    // Optional: Add any additional logic for drag start
  };

  const handleEntityDropOnFolder = async (entityId: string, entityName: string, folderId: string) => {
    try {
      await updateEntityMut.mutateAsync({
        id: entityId,
        patch: { folderId }
      });
      toast({
        title: 'Entity moved',
        description: `${entityName} moved to folder`,
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Failed to move entity',
        description: String((e as Error)?.message || e),
        variant: 'error'
      });
    }
  };

  const handleEntityDropToUngrouped = async (entityId: string, entityName: string) => {
    try {
      await updateEntityMut.mutateAsync({
        id: entityId,
        patch: { folderId: undefined }
      });
      toast({
        title: 'Entity ungrouped',
        description: `${entityName} moved to ungrouped entities`,
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Failed to ungroup entity',
        description: String((e as Error)?.message || e),
        variant: 'error'
      });
    }
  };

  // Template drag and drop handlers
  const handleTemplateDragStart = (template: Template) => {
    // Optional: Add any additional logic for drag start
  };

  const handleTemplateDropOnFolder = async (templateId: string, templateName: string, folderId: string) => {
    try {
      await updateTemplateMut.mutateAsync({
        id: templateId,
        patch: { folderId }
      });
      toast({
        title: 'Template moved',
        description: `${templateName} moved to folder`,
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Failed to move template',
        description: String((e as Error)?.message || e),
        variant: 'error'
      });
    }
  };

  const handleTemplateDropToUngrouped = async (templateId: string, templateName: string) => {
    try {
      await updateTemplateMut.mutateAsync({
        id: templateId,
        patch: { folderId: undefined }
      });
      toast({
        title: 'Template ungrouped',
        description: `${templateName} moved to ungrouped templates`,
        variant: 'success'
      });
    } catch (e) {
      toast({
        title: 'Failed to ungroup template',
        description: String((e as Error)?.message || e),
        variant: 'error'
      });
    }
  };

  // Filter folders to show only direct children of current folder
  const baseEntityFolders = remoteFolders.filter((f) =>
    f.worldId === strWorldId &&
    f.kind === 'entities' &&
    (selectedFolder ? f.parentFolderId === selectedFolder : (!f.parentFolderId))
  );
  const baseRegularTemplateFolders = remoteFolders.filter((f) =>
    f.worldId === strWorldId &&
    f.kind === 'templates' &&
    (selectedFolder ? f.parentFolderId === selectedFolder : (!f.parentFolderId))
  );

  // Apply search filtering to folders
  const entityFolders = filterBySearch(baseEntityFolders, debouncedSearchTerm) as Folder[];
  const regularTemplateFolders = filterBySearch(baseRegularTemplateFolders, debouncedSearchTerm) as Folder[];

  // Get base entities and templates
  const baseUngroupedEntities = remoteEntities.filter((entity: Entity) => entity.worldId === strWorldId && !entity.folderId);
  const baseSystemTemplates = remoteTemplates.filter((template: Template) => template.isSystem && !template.folderId);
  const baseWorldTemplates = remoteTemplates.filter((template: Template) => !template.isSystem && template.worldId === strWorldId);
  const baseUngroupedTemplates = baseWorldTemplates.filter((template: Template) => !template.folderId);

  // Apply search filtering
  const ungroupedEntities = filterBySearch(baseUngroupedEntities, debouncedSearchTerm) as Entity[];
  const systemTemplates = filterBySearch(baseSystemTemplates, debouncedSearchTerm) as Template[];
  const worldTemplates = filterBySearch(baseWorldTemplates, debouncedSearchTerm) as Template[];
  const ungroupedTemplates = filterBySearch(baseUngroupedTemplates, debouncedSearchTerm) as Template[];

  // Global search filtering - search ALL items regardless of folder location
  const allWorldEntities = remoteEntities.filter((entity: Entity) => entity.worldId === strWorldId);
  const allWorldTemplatesIncludingSystem = [...remoteTemplates.filter((template: Template) => template.isSystem), ...baseWorldTemplates];

  const allFilteredEntities = filterBySearch(allWorldEntities, debouncedSearchTerm) as Entity[];
  const allFilteredTemplates = filterBySearch(allWorldTemplatesIncludingSystem, debouncedSearchTerm) as Template[];

  // Identify customized templates (world-specific overrides of system templates)
  const customizedTemplateIds = worldTemplates
    .filter((template: Template) => Object.values(CORE_TEMPLATE_NAMES).includes(template.name as any))
    .map((template: Template) => template.id);

  // Create virtual Core folder for system templates
  const coreFolder: Folder = {
    id: 'core-folder',
    worldId: '', // Virtual folder doesn't belong to specific world
    name: 'Core',
    description: 'Core system templates',
    kind: 'templates',
    color: 'purple',
    count: systemTemplates.length
  };

  // Combine Core folder with regular template folders (Core folder first)
  const templateFolders = systemTemplates.length > 0 ? [coreFolder, ...regularTemplateFolders] : regularTemplateFolders;

  const baseEntitiesInFolder = selectedFolder ? remoteEntities.filter((entity: Entity) => entity.folderId === selectedFolder) : [];
  const baseTemplatesInFolder = selectedFolder
    ? selectedFolder === 'core-folder'
      ? baseSystemTemplates // Show system templates when Core folder is selected
      : remoteTemplates.filter((template: Template) => template.folderId === selectedFolder)
    : [];

  // Apply search filtering to folder contents
  const entitiesInFolder = filterBySearch(baseEntitiesInFolder, debouncedSearchTerm) as Entity[];
  const templatesInFolder = filterBySearch(baseTemplatesInFolder, debouncedSearchTerm) as Template[];

  const tabs: TabItem[] = [
    {
      key: 'entities',
      label: 'Entities',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      count: remoteEntities.length,
      render: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFolderType('entities');
                  setCreateFolderModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm font-medium shadow-sm transition bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                New Folder
              </button>
              <button
                onClick={() => setCreateEntityModalOpen(true)}
                data-testid="create-entity-button"
                className="group inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 bg-brand-600 hover:bg-brand-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">Create New Entity</span>
              </button>
            </div>
          </div>
          {selectedFolder ? (
            <>
              <FolderBreadcrumb
                folderPath={currentFolderPath}
                onNavigate={navigateToFolder}
              />
              <div className="space-y-8">
                {/* Subfolders within current folder */}
                {entityFolders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Subfolders
                    </h3>
                    <Suspense fallback={<SkeletonLoader type="folders" message="Loading subfolders..." />}>
                      <LazyFolderGrid
                        folders={entityFolders}
                        onFolderClick={navigateToFolder}
                        onRename={handleFolderRename}
                        onDelete={handleFolderDelete}
                        onEntityDrop={(entityId, entityName, folderId) => handleEntityDropOnFolder(entityId, entityName, folderId)}
                        entities={remoteEntities}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Entities within current folder */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Entities
                  </h3>
                  <Suspense fallback={<SkeletonLoader type="entities" message="Loading entities..." />}>
                    <LazyEntityGrid
                      entities={entitiesInFolder}
                      onCreateEntity={() => setCreateEntityModalOpen(true)}
                      onDragStart={handleEntityDragStart}
                    />
                  </Suspense>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* Folder Grid */}
              {entityFolders.length > 0 ? (
                <Suspense fallback={<SkeletonLoader type="folders" message="Loading folders..." />}>
                  <LazyFolderGrid
                    folders={entityFolders}
                    onFolderClick={navigateToFolder}
                    onRename={handleFolderRename}
                    onDelete={handleFolderDelete}
                    onEntityDrop={(entityId, entityName, folderId) => handleEntityDropOnFolder(entityId, entityName, folderId)}
                    entities={remoteEntities}
                  />
                </Suspense>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No folders yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Create folders to organize your entities by type, category, or importance.
                  </p>
                  <button 
                    onClick={() => {
                      setFolderType('entities');
                      setCreateFolderModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-600 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-200 dark:hover:bg-brand-800"
                  >
                    Create First Folder
                  </button>
                </div>
              )}
              
              {/* Search Results Header */}
              {debouncedSearchTerm && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Search Results for "{debouncedSearchTerm}"
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Showing all matching entities from across your world, including those in folders
                  </p>
                </div>
              )}

              {/* Entities Display */}
              <UngroupedEntitiesDropZone
                entities={debouncedSearchTerm ? allFilteredEntities : ungroupedEntities}
                onEntityDrop={handleEntityDropToUngrouped}
                onCreateEntity={() => setCreateEntityModalOpen(true)}
                onDragStart={handleEntityDragStart}
              />
              
              {/* Helper text when there are folders but no ungrouped entities */}
              {!debouncedSearchTerm && entityFolders.length > 0 && ungroupedEntities.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">All entities are organized in folders.</p>
                  <p className="text-xs mt-1">Create a new entity without selecting a folder to see it here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'templates',
      label: 'Templates',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      count: worldTemplates.length,
      render: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFolderType('templates');
                  setCreateFolderModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-neutral-700 px-3 py-2 text-sm font-medium shadow-sm transition bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                New Folder
              </button>
              <button
                onClick={() => setCreateTemplateModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 bg-brand-600 hover:bg-brand-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">Create New Template</span>
              </button>
            </div>
          </div>
          
          {selectedFolder ? (
            <>
              <FolderBreadcrumb
                folderPath={currentFolderPath}
                onNavigate={navigateToFolder}
              />
              <div className="space-y-8">
                {/* Subfolders within current folder */}
                {regularTemplateFolders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Subfolders
                    </h3>
                    <Suspense fallback={<SkeletonLoader type="folders" message="Loading subfolders..." />}>
                      <LazyFolderGrid
                        folders={regularTemplateFolders}
                        onFolderClick={navigateToFolder}
                        onRename={handleFolderRename}
                        onDelete={handleFolderDelete}
                        onTemplateDrop={(templateId, templateName, folderId) => handleTemplateDropOnFolder(templateId, templateName, folderId)}
                        templates={[
                          // Map system templates to core-folder for counting
                          ...systemTemplates.map(t => ({ ...t, folderId: 'core-folder' })),
                          // Include world templates as-is
                          ...worldTemplates
                        ]}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Templates within current folder */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Templates
                  </h3>
                  <Suspense fallback={<SkeletonLoader type="templates" message="Loading templates..." />}>
                    <LazyTemplateGrid
                      templates={templatesInFolder}
                      onDelete={handleTemplateDelete}
                      onCreateTemplate={() => setCreateTemplateModalOpen(true)}
                      onDragStart={handleTemplateDragStart}
                      customizedTemplateIds={customizedTemplateIds}
                    />
                  </Suspense>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {/* Template Folder Grid */}
              {templateFolders.length > 0 ? (
                <Suspense fallback={<SkeletonLoader type="folders" message="Loading template folders..." />}>
                  <LazyFolderGrid
                    folders={templateFolders}
                    onFolderClick={navigateToFolder}
                    onRename={handleFolderRename}
                    onDelete={handleFolderDelete}
                    onTemplateDrop={(templateId, templateName, folderId) => handleTemplateDropOnFolder(templateId, templateName, folderId)}
                    templates={[
                      // Map system templates to core-folder for counting
                      ...systemTemplates.map(t => ({ ...t, folderId: 'core-folder' })),
                      // Include world templates as-is
                      ...worldTemplates
                    ]}
                  />
                </Suspense>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No template folders yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Create folders to organize your templates by category or purpose.
                  </p>
                  <button 
                    onClick={() => {
                      setFolderType('templates');
                      setCreateFolderModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-600 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-200 dark:hover:bg-brand-800"
                  >
                    Create First Template Folder
                  </button>
                </div>
              )}

              {/* Search Results Header */}
              {debouncedSearchTerm && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                    Search Results for "{debouncedSearchTerm}"
                  </h3>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Showing all matching templates from across your world, including those in folders
                  </p>
                </div>
              )}

              {/* Templates Display */}
              <UngroupedTemplatesDropZone
                templates={debouncedSearchTerm ? allFilteredTemplates : ungroupedTemplates}
                onTemplateDrop={handleTemplateDropToUngrouped}
                onCreateTemplate={() => setCreateTemplateModalOpen(true)}
                onDragStart={handleTemplateDragStart}
                customizedTemplateIds={customizedTemplateIds}
              />
              
              {/* Helper text when there are folders but no ungrouped templates */}
              {!debouncedSearchTerm && templateFolders.length > 0 && ungroupedTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">All templates are organized in folders.</p>
                  <p className="text-xs mt-1">Create a new template without selecting a folder to see it here.</p>
                </div>
              )}
              
              {/* Empty state when no templates exist at all */}
              {templateFolders.length === 0 && ungroupedTemplates.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No templates yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Templates define the structure and fields for your entities. Create your first template to get started.
                  </p>
                  <button
                    onClick={() => setCreateTemplateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Template
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'relationships',
      label: 'Relationships',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      count: relationships.length,
      render: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex gap-2">
              <button
                onClick={() => setCreateRelationshipModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all duration-300 bg-brand-600 hover:bg-brand-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">Create New Relationship</span>
              </button>
            </div>
          </div>
          <Suspense fallback={<SkeletonLoader type="relationships" message="Loading relationships..." />}>
            <LazyRelationshipGraph />
          </Suspense>
          <div className="mt-8">
            <Suspense fallback={<SkeletonLoader type="relationships" message="Loading relationship table..." />}>
              <LazyRelationshipTable worldId={strWorldId} />
            </Suspense>
          </div>
        </div>
      ),
    },
    {
      key: 'membership',
      label: 'Members',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      count: members.length,
      render: (
        <Suspense fallback={<SkeletonLoader type="membership" message="Loading members..." />}>
          <LazyMembershipTab world={world} />
        </Suspense>
      ),
    },
  ];

  return (
    <main>
      <WorldContextBar world={world} />

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              placeholder="Search entities, templates, folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-r-md transition-colors"
                title="Clear search"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Results Indicator */}
          {debouncedSearchTerm && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              {(() => {
                // Count all filtered items including those in folders
                const entityCount = allFilteredEntities.length;
                const templateCount = allFilteredTemplates.length;
                const folderCount = entityFolders.length + regularTemplateFolders.length;
                const totalResults = entityCount + templateCount + folderCount;

                if (totalResults === 0) {
                  return (
                    <span className="text-gray-500 dark:text-gray-500">
                      No results found for "{debouncedSearchTerm}"
                    </span>
                  );
                }

                const parts = [];
                if (entityCount > 0) parts.push(`${entityCount} entit${entityCount === 1 ? 'y' : 'ies'}`);
                if (templateCount > 0) parts.push(`${templateCount} template${templateCount === 1 ? '' : 's'}`);
                if (folderCount > 0) parts.push(`${folderCount} folder${folderCount === 1 ? '' : 's'}`);

                return (
                  <span>
                    Found {parts.join(', ')} for "{debouncedSearchTerm}"
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key: string) => {
          setSelectedFolder(null);
          setActiveTab(key);
        }}
      />
      <Suspense fallback={<LazyComponentLoader message="Loading..." />}>
        <LazyCreateEntityModal
          open={isCreateEntityModalOpen}
          worldId={world.id}
          folderId={selectedFolder && remoteFolders.find(f => f.id === selectedFolder && f.kind === 'entities') ? selectedFolder : undefined}
          onClose={() => setCreateEntityModalOpen(false)}
        />
      </Suspense>
      <Suspense fallback={<LazyComponentLoader message="Loading..." />}>
        <LazyCreateFolderModal
          open={isCreateFolderModalOpen}
          worldId={world.id}
          folderType={folderType}
          currentParentFolderId={selectedFolder || undefined}
          onClose={() => setCreateFolderModalOpen(false)}
        />
      </Suspense>
      <Suspense fallback={<LazyComponentLoader message="Loading..." />}>
        <LazyCreateTemplateModal
          open={isCreateTemplateModalOpen}
          worldId={world.id}
          onClose={() => setCreateTemplateModalOpen(false)}
          currentFolderId={selectedFolder && remoteFolders.find(f => f.id === selectedFolder && f.kind === 'templates') ? selectedFolder : undefined}
        />
      </Suspense>
      <Suspense fallback={<LazyComponentLoader message="Loading..." />}>
        <LazyCreateRelationshipModal
          isOpen={isCreateRelationshipModalOpen}
          worldId={world.id}
          onClose={() => setCreateRelationshipModalOpen(false)}
        />
      </Suspense>
      <Suspense fallback={<LazyComponentLoader message="Loading..." />}>
        <LazyEditFolderModal
          open={isEditOpen}
          folder={editFolder}
          onClose={() => { setEditOpen(false); setEditFolder(null); }}
        />
      </Suspense>
    </main>
  );
}
