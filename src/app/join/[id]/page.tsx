'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

type JoinPageState = 'loading' | 'can-join' | 'already-member' | 'not-available' | 'error';

interface WorldInfo {
  id: string;
  name: string;
  description: string | null;
  owner: {
    name: string;
    email: string;
  };
  inviteLinkEnabled: boolean;
  memberCount: number;
  seatLimit?: number;
}

export default function JoinWorldPage() {
  const { id: worldId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<JoinPageState>('loading');
  const [worldInfo, setWorldInfo] = useState<WorldInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      // Redirect to login with return URL
      const currentUrl = window.location.href;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    fetchWorldInfo();
  }, [worldId, user, authLoading]);

  const fetchWorldInfo = async () => {
    try {
      const response = await fetch(`/api/worlds/${worldId}/join-info`, {
        credentials: 'include',
      });

      if (response.status === 404) {
        setState('not-available');
        return;
      }

      if (!response.ok) {
        setState('error');
        return;
      }

      const data = await response.json();
      setWorldInfo(data.world);

      if (data.alreadyMember) {
        setState('already-member');
      } else if (data.world.inviteLinkEnabled) {
        setState('can-join');
      } else {
        setState('not-available');
      }
    } catch (error) {
      console.error('Failed to fetch world info:', error);
      setState('error');
    }
  };

  const handleJoinWorld = async () => {
    if (!worldInfo) return;

    setIsJoining(true);
    try {
      const response = await fetch(`/api/worlds/${worldId}/join`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join world');
      }

      toast({
        title: 'Welcome to the world!',
        description: `You've successfully joined "${worldInfo.name}"`,
        variant: 'success',
      });

      router.push(`/world/${worldId}`);
    } catch (error) {
      toast({
        title: 'Failed to join world',
        description: String((error as Error)?.message || error),
        variant: 'error',
      });
      setIsJoining(false);
    }
  };

  if (authLoading || state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't load the world information. Please try again later.
            </p>
            <Button onClick={() => router.push('/worlds')} variant="outline">
              Go to My Worlds
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'not-available') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invite link not available</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This world doesn't allow joining via invite links, or the world doesn't exist.
            </p>
            <Button onClick={() => router.push('/worlds')} variant="outline">
              Go to My Worlds
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'already-member' && worldInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're already a member!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You're already a member of "{worldInfo.name}". Click below to go to the world.
            </p>
            <Button onClick={() => router.push(`/world/${worldId}`)}>
              Go to World
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'can-join' && worldInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Join "{worldInfo.name}"</h1>
              {worldInfo.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{worldInfo.description}</p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{worldInfo.owner.name || worldInfo.owner.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Members:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {worldInfo.memberCount}{worldInfo.seatLimit ? ` / ${worldInfo.seatLimit}` : ''}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/worlds')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinWorld}
                disabled={isJoining}
                className="flex-1"
              >
                {isJoining ? 'Joining...' : 'Join World'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}