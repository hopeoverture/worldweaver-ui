import { NextRequest, NextResponse } from 'next/server';
import { getServerClientAndUser } from '@/lib/auth/server';
import {
  apiSuccess,
  apiAuthRequired,
  apiInternalError,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils';

export interface ProfileStats {
  worldsOwned: number;
  worldsCollaborating: number;
  totalEntities: number;
  totalTemplates: number;
  totalRelationships: number;
  totalFolders: number;
  memberSince: string;
  lastActive: string;
}

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const requestId = generateRequestId();

  // Get authenticated user
  const { supabase, user, error: authError } = await getServerClientAndUser();

  if (authError || !user) {
    return apiAuthRequired();
  }

  try {
    // Get worlds owned by user
    const { data: ownedWorlds, error: worldsError } = await supabase
      .from('worlds')
      .select('id, created_at')
      .eq('owner_id', user.id);

    if (worldsError) throw worldsError;

    // Get worlds where user is a member
    const { data: memberWorlds, error: memberError } = await supabase
      .from('world_members')
      .select('world_id')
      .eq('user_id', user.id);

    if (memberError) throw memberError;

    const ownedWorldIds = ownedWorlds?.map(w => w.id) || [];
    const allAccessibleWorldIds = [
      ...ownedWorldIds,
      ...(memberWorlds?.map(m => m.world_id) || [])
    ];

    // Get entity count across all accessible worlds
    const { count: entityCount, error: entityError } = await supabase
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .in('world_id', allAccessibleWorldIds);

    if (entityError) throw entityError;

    // Get template count for user's worlds (only owned worlds have custom templates)
    const { count: templateCount, error: templateError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .in('world_id', ownedWorldIds)
      .eq('is_system', false);

    if (templateError) throw templateError;

    // Get relationship count across accessible worlds
    const { count: relationshipCount, error: relationshipError } = await supabase
      .from('relationships')
      .select('*', { count: 'exact', head: true })
      .in('world_id', allAccessibleWorldIds);

    if (relationshipError) throw relationshipError;

    // Get folder count across accessible worlds
    const { count: folderCount, error: folderError } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .in('world_id', allAccessibleWorldIds);

    if (folderError) throw folderError;

    // Get user profile for member since date
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const stats: ProfileStats = {
      worldsOwned: ownedWorlds?.length || 0,
      worldsCollaborating: memberWorlds?.length || 0,
      totalEntities: entityCount || 0,
      totalTemplates: templateCount || 0,
      totalRelationships: relationshipCount || 0,
      totalFolders: folderCount || 0,
      memberSince: profile?.created_at || user.created_at,
      lastActive: new Date().toISOString(), // Could be enhanced with actual activity tracking
    };

    return apiSuccess({ stats }, { 'X-Request-ID': requestId });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return apiInternalError();
  }
});