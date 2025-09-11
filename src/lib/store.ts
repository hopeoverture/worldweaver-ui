import { create } from 'zustand';
import { World, Folder, Template, Entity, Link, RelationshipRow, ID, WorldMember, WorldInvite, MemberRole } from './types';
import * as seed from './mockData';
import { createCoreTemplates } from './coreTemplates';

// Configuration
// Use API routes for database operations. Set to true to enable DB-backed mode.
const USE_API = true;
const currentUserId = '550e8400-e29b-41d4-a716-446655440000'; // Test user ID

type State = {
  worlds: World[];
  folders: Folder[];
  templates: Template[];
  entities: Entity[];
  links: Link[];
  relationships: RelationshipRow[];
  members: WorldMember[];
  invites: WorldInvite[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
};

type Actions = {
  // Data loading actions
  loadUserWorlds: () => Promise<void>;
  clearError: () => void;
  
  // World actions
  addWorld: (w: Omit<World, 'id' | 'updatedAt' | 'entityCount'>) => Promise<World>;
  updateWorld: (id: ID, patch: Partial<World>) => Promise<void>;
  deleteWorld: (id: ID) => Promise<void>;
  archiveWorld: (id: ID) => Promise<void>;
  unarchiveWorld: (id: ID) => Promise<void>;
  addFolder: (f: Omit<Folder, 'id' | 'count'>) => Folder;
  addTemplate: (t: Omit<Template, 'id'>) => Template;
  updateTemplate: (id: ID, patch: Partial<Template>) => void;
  deleteTemplate: (id: ID) => void;
  addEntity: (e: Omit<Entity, 'id' | 'updatedAt'>) => Entity;
  updateEntity: (id: ID, patch: Partial<Entity>) => void;
  addLink: (l: Omit<Link, 'id'>) => Link;
  removeLink: (id: ID) => void;
  
  // Membership actions
  getWorldMembers: (worldId: ID) => WorldMember[];
  getWorldInvites: (worldId: ID) => WorldInvite[];
  inviteMember: (worldId: ID, email: string, role: MemberRole) => void;
  updateMemberRole: (worldId: ID, memberId: ID, role: MemberRole) => void;
  removeMember: (worldId: ID, memberId: ID) => void;
  revokeInvite: (inviteId: ID) => void;
  updateWorldSettings: (worldId: ID, settings: Partial<World>) => void;
  transferOwnership: (worldId: ID, newOwnerId: ID) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  worlds: seed.worlds,
  folders: seed.folders,
  templates: seed.templates,
  entities: seed.entities,
  links: seed.links,
  relationships: seed.relationships,
  members: seed.members,
  invites: seed.invites,
  
  // Loading and error states
  isLoading: false,
  error: null,

  // Data loading actions
  loadUserWorlds: async () => {
    if (!USE_API) {
      // Use mock data
      set({ worlds: seed.worlds.filter(w => !w.isArchived) });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/worlds?userId=${currentUserId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch worlds');
      }
      
      const { worlds } = await response.json();
      set({ worlds, isLoading: false });
    } catch (error) {
      console.error('Failed to load worlds:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load worlds',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),

  addWorld: async (w) => {
    const worldId = crypto.randomUUID();
    const nw: World = { id: worldId, entityCount: 0, updatedAt: new Date().toISOString(), ...w };
    
    // Create default folders for the new world
    const defaultFolders: Folder[] = [
      {
        id: crypto.randomUUID(),
        worldId: worldId,
        name: 'Characters',
        description: 'Player characters, NPCs, and important figures',
        kind: 'entities',
        color: 'blue',
        count: 0
      },
      {
        id: crypto.randomUUID(),
        worldId: worldId,
        name: 'Locations',
        description: 'Towns, dungeons, and places of interest',
        kind: 'entities',
        color: 'green',
        count: 0
      },
      {
        id: crypto.randomUUID(),
        worldId: worldId,
        name: 'Items',
        description: 'Weapons, artifacts, and magical objects',
        kind: 'entities',
        color: 'purple',
        count: 0
      },
      {
        id: crypto.randomUUID(),
        worldId: worldId,
        name: 'Organizations',
        description: 'Factions, guilds, and political groups',
        kind: 'entities',
        color: 'red',
        count: 0
      }
    ];

    const coreTemplateFolderId = crypto.randomUUID();
    const templateFolders: Folder[] = [
      {
        id: coreTemplateFolderId,
        worldId: worldId,
        name: 'Core Templates',
        description: 'Essential templates for world building',
        kind: 'templates',
        color: 'indigo',
        count: 0 // Count will be calculated dynamically
      },
      {
        id: crypto.randomUUID(),
        worldId: worldId,
        name: 'Custom Templates',
        description: 'User-created templates for unique content',
        kind: 'templates',
        color: 'yellow',
        count: 0
      }
    ];

    // Create core templates automatically
    const coreTemplates = createCoreTemplates(worldId, coreTemplateFolderId);
    const newTemplates: Template[] = coreTemplates.map(template => ({
      id: crypto.randomUUID(),
      ...template
    }));

    set(s => ({
      worlds: [nw, ...s.worlds],
      folders: [...defaultFolders, ...templateFolders, ...s.folders],
      templates: [...newTemplates, ...s.templates]
    }));
    
    return nw;
  },
  updateWorld: async (id, patch) => {
    if (!USE_API) {
      set(s => ({ worlds: s.worlds.map(w => w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w) }));
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/worlds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patch,
          userId: currentUserId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update world');
      }

      const { world } = await response.json();
      
      set(s => ({ 
        worlds: s.worlds.map(w => w.id === id ? world : w),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update world:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update world',
        isLoading: false 
      });
      throw error;
    }
  },
  deleteWorld: async (id) => {
    if (!USE_API) {
      set(s => ({
        worlds: s.worlds.filter(w => w.id !== id),
        folders: s.folders.filter(f => f.worldId !== id),
        templates: s.templates.filter(t => t.worldId !== id),
        entities: s.entities.filter(e => e.worldId !== id),
        links: s.links.filter(l => {
          const fromEntity = s.entities.find(e => e.id === l.fromEntityId);
          const toEntity = s.entities.find(e => e.id === l.toEntityId);
          return fromEntity?.worldId !== id && toEntity?.worldId !== id;
        }),
        relationships: s.relationships.filter(r => r.worldId !== id)
      }));
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/worlds/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete world');
      }

      set(s => ({
        worlds: s.worlds.filter(w => w.id !== id),
        folders: s.folders.filter(f => f.worldId !== id),
        templates: s.templates.filter(t => t.worldId !== id),
        entities: s.entities.filter(e => e.worldId !== id),
        links: s.links.filter(l => {
          const fromEntity = s.entities.find(e => e.id === l.fromEntityId);
          const toEntity = s.entities.find(e => e.id === l.toEntityId);
          return fromEntity?.worldId !== id && toEntity?.worldId !== id;
        }),
        relationships: s.relationships.filter(r => r.worldId !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete world:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete world',
        isLoading: false 
      });
      throw error;
    }
  },
  archiveWorld: async (id) => {
    if (!USE_API) {
      set(s => ({ 
        worlds: s.worlds.map(w => 
          w.id === id 
            ? { ...w, isArchived: true, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : w
        ) 
      }));
      return;
    }

    // For API mode, only send isArchived since database doesn't have archivedAt field
    await get().updateWorld(id, { isArchived: true });
  },
  unarchiveWorld: async (id) => {
    if (!USE_API) {
      set(s => ({ 
        worlds: s.worlds.map(w => 
          w.id === id 
            ? { ...w, isArchived: false, archivedAt: undefined, updatedAt: new Date().toISOString() }
            : w
        ) 
      }));
      return;
    }

    // For API mode, only send isArchived since database doesn't have archivedAt field
    await get().updateWorld(id, { isArchived: false });
  },
  addFolder: (f) => {
    const nf: Folder = { id: crypto.randomUUID(), count: 0, ...f };
    set(s => ({ folders: [nf, ...s.folders] }));
    return nf;
  },
  addTemplate: (t) => {
    const nt: Template = { id: crypto.randomUUID(), ...t };
    set(s => ({ templates: [nt, ...s.templates] }));
    return nt;
  },
  updateTemplate: (id, patch) =>
    set(s => ({ templates: s.templates.map(t => t.id === id ? { ...t, ...patch } : t) })),
  deleteTemplate: (id) =>
    set(s => {
      // No need to update folder count since it's calculated dynamically
      return { templates: s.templates.filter(t => t.id !== id) };
    }),
  addEntity: (e) => {
    const ne: Entity = { id: crypto.randomUUID(), updatedAt: new Date().toISOString(), ...e };
    set(s => {
      // No need to update world entity count since it's calculated dynamically
      const worlds = s.worlds.map(w => w.id === e.worldId ? { ...w, updatedAt: new Date().toISOString() } : w);
      return { entities: [ne, ...s.entities], worlds };
    });
    return ne;
  },
  updateEntity: (id, patch) =>
    set(s => ({ entities: s.entities.map(en => en.id === id ? { ...en, ...patch, updatedAt: new Date().toISOString() } : en) })),
  addLink: (l) => {
    const nl: Link = { id: crypto.randomUUID(), ...l };
    set(s => ({ links: [nl, ...s.links] }));
    return nl;
  },
  removeLink: (id) =>
    set(s => ({ links: s.links.filter(l => l.id !== id) })),

  // Membership actions
  getWorldMembers: (worldId) => {
    const state = get();
    return state.members.filter(m => m.worldId === worldId);
  },
  
  getWorldInvites: (worldId) => {
    const state = get();
    return state.invites.filter(i => i.worldId === worldId && !i.acceptedAt && !i.revokedAt);
  },
  
  inviteMember: (worldId, email, role) => {
    const newInvite: WorldInvite = {
      id: crypto.randomUUID(),
      worldId,
      email,
      role,
      invitedBy: 'user-1', // In real app, get from auth
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
    set(s => ({ invites: [newInvite, ...s.invites] }));
  },
  
  updateMemberRole: (worldId, memberId, role) =>
    set(s => ({ 
      members: s.members.map(m => 
        m.id === memberId && m.worldId === worldId 
          ? { ...m, role }
          : m
      ) 
    })),
  
  removeMember: (worldId, memberId) =>
    set(s => ({ 
      members: s.members.filter(m => !(m.id === memberId && m.worldId === worldId))
    })),
  
  revokeInvite: (inviteId) =>
    set(s => ({ 
      invites: s.invites.map(i => 
        i.id === inviteId 
          ? { ...i, revokedAt: new Date().toISOString() }
          : i
      ) 
    })),
  
  updateWorldSettings: (worldId, settings) =>
    set(s => ({ 
      worlds: s.worlds.map(w => 
        w.id === worldId 
          ? { ...w, ...settings, updatedAt: new Date().toISOString() }
          : w
      ) 
    })),
  
  transferOwnership: (worldId, newOwnerId) =>
    set(s => {
      return {
        members: s.members.map(m => {
          if (m.worldId === worldId) {
            if (m.userId === newOwnerId) {
              return { ...m, role: 'owner' };
            } else if (m.role === 'owner') {
              return { ...m, role: 'admin' };
            }
          }
          return m;
        })
      };
    }),
}));
