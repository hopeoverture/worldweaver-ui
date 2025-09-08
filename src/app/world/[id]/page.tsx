'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useWorld } from '@/hooks/query/useWorld';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useWorldTemplates } from '@/hooks/query/useWorldTemplates';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { WorldContextBar } from '@/components/dashboard/WorldContextBar';
import { TabNav } from '@/components/dashboard/TabNav';
import { FolderGrid } from '@/components/folders/FolderGrid';
import { EntityGrid } from '@/components/entities/EntityGrid';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { useDeleteTemplate } from '@/hooks/mutations/useDeleteTemplate';
import { RelationshipGraph } from '@/components/relationships/RelationshipGraph';
import { RelationshipTable } from '@/components/relationships/RelationshipTable';
import { MembershipTab } from '@/components/membership/MembershipTab';
import { CreateRelationshipModal } from '@/components/relationships/CreateRelationshipModal';
import { CreateEntityModal } from '@/components/entities/CreateEntityModal/CreateEntityModal';
import { CreateFolderModal } from '@/components/folders/CreateFolderModal';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { TabItem } from '@/components/ui/Tabs';
import { useUpdateFolder } from '@/hooks/mutations/useUpdateFolder';
import { useDeleteFolder } from '@/hooks/mutations/useDeleteFolder';
import { useToast } from '@/components/ui/ToastProvider';
import { EditFolderModal } from '@/components/folders/EditFolderModal';
import type { Entity, Template, Folder } from '@/lib/types';

export default function WorldDashboard() {
  const { id: worldId } = useParams();
  const { relationships, updateTemplate, deleteTemplate } = useStore();
  const strWorldId = String(worldId);
  const { data: world, isLoading, error } = useWorld(strWorldId);
  const { data: remoteEntities = [] as Entity[] } = useWorldEntities(strWorldId);
  const { data: remoteTemplates = [] as Template[] } = useWorldTemplates(strWorldId);
  const { data: remoteFolders = [] as Folder[] } = useWorldFolders(strWorldId);
  
  const [activeTab, setActiveTab] = useState('entities');
  const deleteTemplateMut = useDeleteTemplate(strWorldId);
  const updateFolderMut = useUpdateFolder();
  const deleteFolderMut = useDeleteFolder();
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreateEntityModalOpen, setCreateEntityModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [isCreateRelationshipModalOpen, setCreateRelationshipModalOpen] = useState(false);
  const [folderType, setFolderType] = useState<'entities' | 'templates'>('entities');
  const [editFolder, setEditFolder] = useState<Folder | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);

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
    if (!confirm(`Delete folder “${folder.name}”? Items inside remain ungrouped.`)) return;
    try {
      await deleteFolderMut.mutateAsync({ id: folder.id, worldId: strWorldId });
      toast({ title: 'Folder deleted', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to delete folder', description: String((e as Error)?.message || e), variant: 'error' });
    }
  };

  const entityFolders = remoteFolders.filter((f) => f.worldId === strWorldId && f.kind === 'entities');
  const templateFolders: Folder[] = []; // Templates don't use folders in current schema

  const entitiesInFolder = selectedFolder ? remoteEntities.filter((entity: Entity) => entity.folderId === selectedFolder) : [];
  const templatesInFolder = selectedFolder ? remoteTemplates.filter((template: Template) => template.folderId === selectedFolder) : [];
  
  // Get ungrouped entities (entities without a folder)
  const ungroupedEntities = remoteEntities.filter((entity: Entity) => entity.worldId === strWorldId && !entity.folderId);
  // Get ungrouped templates (templates without a folder)  
  const ungroupedTemplates = remoteTemplates.filter((template: Template) => (template.worldId || strWorldId) === strWorldId && !template.folderId);

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
              <button onClick={() => setSelectedFolder(null)} className="mb-4 text-sm text-brand-600 hover:underline">
                &larr; Back to folders
              </button>
              <EntityGrid entities={entitiesInFolder} onCreateEntity={() => setCreateEntityModalOpen(true)} />
            </>
          ) : (
            <div className="space-y-8">
              {/* Folder Grid */}
              {entityFolders.length > 0 ? (
                <FolderGrid
                  folders={entityFolders}
                  onFolderClick={setSelectedFolder}
                  onRename={handleFolderRename}
                  onDelete={handleFolderDelete}
                />
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
              
              {/* Ungrouped Entities */}
              {ungroupedEntities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Ungrouped Entities
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ungroupedEntities.length} {ungroupedEntities.length === 1 ? 'entity' : 'entities'}
                    </span>
                  </div>
                  <EntityGrid entities={ungroupedEntities} onCreateEntity={() => setCreateEntityModalOpen(true)} />
                </div>
              )}
              
              {/* Helper text when there are folders but no ungrouped entities */}
              {entityFolders.length > 0 && ungroupedEntities.length === 0 && (
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
      count: remoteTemplates.filter((t: any) => (t.worldId || strWorldId) === strWorldId).length,
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
              <button onClick={() => setSelectedFolder(null)} className="mb-4 text-sm text-brand-600 hover:underline">
                &larr; Back to folders
              </button>
                  <TemplateGrid 
                    templates={templatesInFolder}
                    onDelete={handleTemplateDelete}
                    onCreateTemplate={() => setCreateTemplateModalOpen(true)}
                  />
            </>
          ) : (
            <div className="space-y-8">
              {/* Template Folder Grid */}
              {templateFolders.length > 0 ? (
                <FolderGrid
                  folders={templateFolders}
                  onFolderClick={setSelectedFolder}
                  onRename={handleFolderRename}
                  onDelete={handleFolderDelete}
                />
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
              
              {/* Ungrouped Templates */}
              {ungroupedTemplates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Ungrouped Templates
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ungroupedTemplates.length} {ungroupedTemplates.length === 1 ? 'template' : 'templates'}
                    </span>
                  </div>
                  <TemplateGrid 
                    templates={ungroupedTemplates}
                    onDelete={handleTemplateDelete}
                    onCreateTemplate={() => setCreateTemplateModalOpen(true)}
                  />
                </div>
              )}
              
              {/* Helper text when there are folders but no ungrouped templates */}
              {templateFolders.length > 0 && ungroupedTemplates.length === 0 && (
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
      count: relationships.filter(r => r.worldId === worldId).length,
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
          <RelationshipGraph />
          <div className="mt-8">
            <RelationshipTable />
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
      count: 4, // In real app, get from members count
      render: <MembershipTab world={world} />,
    },
  ];

  return (
    <main>
      <WorldContextBar world={world} />
      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key: string) => {
          setSelectedFolder(null);
          setActiveTab(key);
        }}
      />
      <CreateEntityModal
        open={isCreateEntityModalOpen}
        worldId={world.id}
        onClose={() => setCreateEntityModalOpen(false)}
      />
      <CreateFolderModal
        open={isCreateFolderModalOpen}
        worldId={world.id}
        folderType={folderType}
        onClose={() => setCreateFolderModalOpen(false)}
      />
      <CreateTemplateModal
        open={isCreateTemplateModalOpen}
        worldId={world.id}
        onClose={() => setCreateTemplateModalOpen(false)}
      />
      <CreateRelationshipModal
        isOpen={isCreateRelationshipModalOpen}
        worldId={world.id}
        onClose={() => setCreateRelationshipModalOpen(false)}
      />
      <EditFolderModal
        open={isEditOpen}
        folder={editFolder}
        onClose={() => { setEditOpen(false); setEditFolder(null); }}
      />
    </main>
  );
}
