'use client';

import { useEffect, useState } from 'react';
import { World, WorldMember, WorldInvite, MemberRole, RolePermissions } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { useInvites } from '@/hooks/query/useInvites';
import { useCreateInvite } from '@/hooks/mutations/useCreateInvite';
import { useRevokeInvite } from '@/hooks/mutations/useRevokeInvite';
import { useWorldMembers } from '@/hooks/query/useWorldMembers';
import { useUpdateMemberRole, useRemoveMember } from '@/hooks/mutations/useMembers';

type MembershipTabProps = {
  world: World;
};

const ROLE_PERMISSIONS: RolePermissions = {
  owner: [
    'read_world', 'create_cards', 'edit_any_card', 'delete_any_card',
    'manage_members', 'change_world_settings', 'run_ai_generations', 'export_import'
  ],
  admin: [
    'read_world', 'create_cards', 'edit_any_card', 'delete_any_card',
    'manage_members', 'run_ai_generations', 'export_import'
  ],
  editor: [
    'read_world', 'create_cards', 'edit_any_card', 'delete_any_card',
    'run_ai_generations'
  ],
  viewer: [
    'read_world'
  ]
};

const PERMISSION_LABELS = {
  read_world: 'Read world',
  create_cards: 'Create cards',
  edit_any_card: 'Edit any card',
  delete_any_card: 'Delete any card',
  manage_members: 'Manage members',
  change_world_settings: 'Change settings',
  run_ai_generations: 'Run AI',
  export_import: 'Import/Export'
};

export function MembershipTab({ world }: MembershipTabProps) {
  const [activeSection, setActiveSection] = useState<'members' | 'invites' | 'settings'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorldMember | null>(null);
  
  const { updateWorldSettings, transferOwnership } = useStore();

  // Use real API hooks instead of store
  const { data: members = [], isLoading: membersLoading } = useWorldMembers(world.id);
  const { data: invites = [], isLoading: invitesLoading } = useInvites(activeSection === 'invites' ? world.id : '');
  const createInvite = useCreateInvite(world.id);
  const revokeInviteMut = useRevokeInvite(world.id);
  const updateMemberRoleMut = useUpdateMemberRole(world.id);
  const removeMemberMut = useRemoveMember(world.id);

  // Find current user member (you'd get this from auth context in real app)
  const currentUserMember = members.find((m: WorldMember) => m.email === 'current@user.com'); // In real app, get from auth
  const isOwner = currentUserMember?.role === 'owner';
  const canManageMembers = currentUserMember?.role && ['owner', 'admin'].includes(currentUserMember.role);

  const handleInviteMember = async (email: string, role: MemberRole) => {
    await createInvite.mutateAsync({ email, role });
    setShowInviteModal(false);
  };

  const handleChangeRole = (memberId: string, newRole: MemberRole) => {
    updateMemberRoleMut.mutate({ memberId, role: newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the world?')) {
      removeMemberMut.mutate(memberId);
    }
  };

  const handleTransferOwnership = (newOwnerId: string) => {
    if (confirm('Are you sure you want to transfer ownership? You will become an admin.')) {
      transferOwnership(world.id, newOwnerId);
      setShowTransferModal(false);
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    revokeInviteMut.mutate(inviteId);
  };

  const handleCopyInviteLink = (token?: string) => {
    if (!token) {
      alert('Invite link unavailable for this invite')
      return
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/invite/accept?token=${encodeURIComponent(token)}`
    navigator.clipboard.writeText(url).catch(() => alert('Failed to copy link'))
  }

  const getRoleColor = (role: MemberRole) => {
    const colors = {
      owner: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 ring-1 ring-yellow-200 dark:ring-yellow-700',
      admin: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-700',
      editor: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700',
      viewer: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-600'
    };
    return colors[role];
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[
          { key: 'members', label: 'Members', count: members.length, icon: 'users' },
          { key: 'invites', label: 'Invites', count: invites.length, icon: 'mail' },
          { key: 'settings', label: 'Settings', icon: 'cog' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === section.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            {section.icon === 'users' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            )}
            {section.icon === 'mail' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {section.icon === 'cog' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span>{section.label}</span>
            {'count' in section && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeSection === section.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              }`}>
                {section.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members Section */}
      {activeSection === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Members</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {membersLoading ? 'Loading members...' : `${members.length} of ${world.seatLimit || '∞'} seats used`}
              </p>
            </div>
            {canManageMembers && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissionsModal(true)}
                  className="inline-flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  View Permissions
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <svg className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Member
                </Button>
              </div>
            )}
          </div>

          <Card className="overflow-hidden">
            {membersLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No members yet</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  Invite collaborators to help build and manage this world together.
                </p>
                {canManageMembers && (
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Send First Invite
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Member</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Role</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Joined</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Last Active</th>
                    {canManageMembers && (
                      <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {members.map((member: WorldMember) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                              {member.avatar ? (
                                <img 
                                  src={member.avatar} 
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-white">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {member.role === 'owner' && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {member.name}
                              {member.name === 'You' && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {canManageMembers && member.role !== 'owner' ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value as MemberRole)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer transition-colors duration-150 ${getRoleColor(member.role)} hover:brightness-95`}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            {member.role === 'owner' && (
                              <svg className="inline w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z" />
                              </svg>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(member.lastActiveAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      {canManageMembers && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center space-x-2">
                            {isOwner && member.role !== 'owner' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowTransferModal(true);
                                }}
                                className="text-xs px-3 py-1.5 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                              >
                                Transfer Ownership
                              </Button>
                            )}
                            {member.role !== 'owner' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-xs px-3 py-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>
      )}

      {/* Invites Section */}
      {activeSection === 'invites' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pending Invites</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {invitesLoading ? 'Loading invites…' : `${invites.length} ${invites.length === 1 ? 'invite' : 'invites'} awaiting response`}
              </p>
            </div>
            {canManageMembers && (
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                <svg className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Send Invite
              </Button>
            )}
          </div>

          {invites.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No pending invites</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  Invite collaborators to help build and manage this world together.
                </p>
                {canManageMembers && (
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Send First Invite
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Email</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Role</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Invited</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Expires</th>
                      {canManageMembers && (
                        <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {invites.map((invite: any) => (
                      <tr key={invite.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">{invite.email}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Pending response</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(invite.role)}`}>
                            {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {new Date((invite as any).invitedAt || (invite as any).created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {new Date((invite as any).expiresAt || (invite as any).expires_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </td>
                        {canManageMembers && (
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyInviteLink((invite as any).token)}
                                className="text-xs px-3 py-1.5"
                              >
                                Copy Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeInvite(invite.id)}
                                className="text-xs px-3 py-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                Revoke
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && isOwner && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Membership Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure how people can join this world and manage collaboration settings.
            </p>
          </div>
          
          <Card className="p-6">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Seat Limit
                </label>
                <Input
                  type="number"
                  value={world.seatLimit || ''}
                  onChange={(e) => updateWorldSettings(world.id, { 
                    seatLimit: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Unlimited"
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Leave empty for unlimited seats. Currently {members.length} seats used.
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Invite Link
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow people to join with a shareable link
                    </p>
                  </div>
                  <Toggle
                    pressed={world.inviteLinkEnabled || false}
                    onClick={() => updateWorldSettings(world.id, { inviteLinkEnabled: !world.inviteLinkEnabled })}
                  />
                </div>

                {world.inviteLinkEnabled && (
                  <div className="space-y-6 pl-6 border-l-2 border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg py-4 pr-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Default Role for Link Joins
                      </label>
                      <Select
                        value={world.inviteLinkRole || 'viewer'}
                        onChange={(e) => updateWorldSettings(world.id, { 
                          inviteLinkRole: e.target.value as MemberRole 
                        })}
                        className="max-w-xs"
                      >
                        <option value="viewer">Viewer - Can view the world</option>
                        <option value="editor">Editor - Can create and edit</option>
                        <option value="admin">Admin - Can manage members</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Max Uses
                      </label>
                      <Input
                        type="number"
                        value={world.inviteLinkMaxUses || ''}
                        onChange={(e) => updateWorldSettings(world.id, { 
                          inviteLinkMaxUses: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="Unlimited"
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Leave empty for unlimited uses
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Expiration Date
                      </label>
                      <Input
                        type="datetime-local"
                        value={world.inviteLinkExpires ? new Date(world.inviteLinkExpires).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateWorldSettings(world.id, { 
                          inviteLinkExpires: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                        })}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Leave empty for no expiration
                      </p>
                    </div>

                    <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Invite Link</h4>
                      </div>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded-md text-sm font-mono border border-blue-200 dark:border-blue-600 text-blue-800 dark:text-blue-200">
                          https://worldweaver.app/join/{world.id}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`https://worldweaver.app/join/${world.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
      />

      {/* Permissions Modal */}
      <PermissionsModal
        open={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        rolePermissions={ROLE_PERMISSIONS}
        permissionLabels={PERMISSION_LABELS}
      />

      {/* Transfer Ownership Modal */}
      <TransferOwnershipModal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        member={selectedMember}
        onTransfer={handleTransferOwnership}
      />
    </div>
  );
}

// Sub-components
type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => void;
};

function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim(), role);
      setEmail('');
      setRole('viewer');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invite Member</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Send an invitation to collaborate on this world</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Role
            </label>
            <Select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className="w-full">
              <option value="viewer">Viewer - Can view the world</option>
              <option value="editor">Editor - Can create and edit cards</option>
              <option value="admin">Admin - Can manage members</option>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Send Invite
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

type PermissionsModalProps = {
  open: boolean;
  onClose: () => void;
  rolePermissions: RolePermissions;
  permissionLabels: Record<string, string>;
};

function PermissionsModal({ open, onClose, rolePermissions, permissionLabels }: PermissionsModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Role Permissions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">What each role can do in this world</p>
          </div>
        </div>
        
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">Permission</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-600 dark:text-gray-400">Viewer</th>
                <th className="text-center py-4 px-4 font-semibold text-green-600 dark:text-green-400">Editor</th>
                <th className="text-center py-4 px-4 font-semibold text-blue-600 dark:text-blue-400">Admin</th>
                <th className="text-center py-4 px-4 font-semibold text-yellow-600 dark:text-yellow-400">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(permissionLabels).map(([permission, label]) => (
                <tr key={permission} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{label}</td>
                  {(['viewer', 'editor', 'admin', 'owner'] as MemberRole[]).map(role => (
                    <td key={role} className="py-4 px-4 text-center">
                      {rolePermissions[role].includes(permission as any) ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6">
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type TransferOwnershipModalProps = {
  open: boolean;
  onClose: () => void;
  member: WorldMember | null;
  onTransfer: (memberId: string) => void;
};

function TransferOwnershipModal({ open, onClose, member, onTransfer }: TransferOwnershipModalProps) {
  if (!member) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Transfer Ownership</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to transfer ownership of this world to <strong>{member.name}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Important:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You will become an admin and lose owner privileges</li>
              <li>• The new owner will have full control over the world</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => onTransfer(member.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Transfer Ownership
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
