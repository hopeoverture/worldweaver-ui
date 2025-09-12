import { create } from 'zustand';
import { World, Folder, Template, Entity, Link, RelationshipRow, ID, WorldMember, WorldInvite, MemberRole } from './types';
import { logError } from './logging';
import { v4 as uuidv4 } from 'uuid';

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
  inviteMember: (worldId: ID, email: string, role: MemberRole) => Promise<void>;
  updateMemberRole: (worldId: ID, memberId: ID, role: MemberRole) => void;
  removeMember: (worldId: ID, memberId: ID) => void;
  revokeInvite: (inviteId: ID) => void;
  updateWorldSettings: (worldId: ID, settings: Partial<World>) => void;
  transferOwnership: (worldId: ID, newOwnerId: ID) => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  worlds: [],
  folders: [],
  templates: [],
  entities: [],
  links: [],
  relationships: [],
  members: [],
  invites: [],
  
  // Loading and error states
  isLoading: false,
  error: null,

  // Data loading actions
  loadUserWorlds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/worlds', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          set({ worlds: [], isLoading: false });
          return;
        }
        throw new Error('Failed to fetch worlds');
      }
      const { worlds } = await response.json();
      set({ worlds, isLoading: false });
    } catch (error) {
      logError('Failed to load worlds', error as Error, {
        action: 'load_worlds',
        component: 'store'
      });
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load worlds' });
    }
  },

  clearError: () => set({ error: null }),

  addWorld: async (w) => {
    const res = await fetch('/api/worlds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: w.name, description: w.summary || w.description, isPublic: w.isPublic ?? false }),
    });
    if (!res.ok) throw new Error('Failed to create world');
    const body = await res.json();
    const nw: World = body.world;
    set(s => ({ worlds: [nw, ...s.worlds] }));
    return nw;
  },
  updateWorld: async (id, patch) => {

    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/worlds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
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
      logError('Failed to update world', error as Error, {
        worldId: id,
        action: 'update_world',
        component: 'store',
        metadata: { patch }
      });
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update world',
        isLoading: false 
      });
      throw error;
    }
  },
  deleteWorld: async (id) => {

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
      logError('Failed to delete world', error as Error, {
        worldId: id,
        action: 'delete_world',
        component: 'store'
      });
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete world',
        isLoading: false 
      });
      throw error;
    }
  },
  archiveWorld: async (id) => {

    // For API mode, only send isArchived since database doesn't have archivedAt field
    await get().updateWorld(id, { isArchived: true });
  },
  unarchiveWorld: async (id) => {

    // For API mode, only send isArchived since database doesn't have archivedAt field
    await get().updateWorld(id, { isArchived: false });
  },
  addFolder: (f) => {
    const nf: Folder = { id: uuidv4(), count: 0, ...f };
    set(s => ({ folders: [nf, ...s.folders] }));
    return nf;
  },
  addTemplate: (t) => {
    const nt: Template = { id: uuidv4(), ...t };
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
    const ne: Entity = { id: uuidv4(), updatedAt: new Date().toISOString(), ...e };
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
    const nl: Link = { id: uuidv4(), ...l };
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
  
  inviteMember: async (worldId, email, role) => {
    await fetch(`/api/worlds/${worldId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role }),
    }).catch(() => {});
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
      const currentOwner = s.members.find(m => m.worldId === worldId && m.role === 'owner');
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
