'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapGeneratorForm } from '@/components/maps/MapGeneratorForm';
import { useWorld } from '@/hooks/query/useWorld';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function MapGeneratorPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;

  const { data: world, isLoading, error } = useWorld(worldId);

  const handleSuccess = (mapId: string) => {
    // Navigate to the map viewer
    router.push(`/worlds/${worldId}/maps/${mapId}`);
  };

  const handleCancel = () => {
    // Navigate back to maps list
    router.push(`/worlds/${worldId}/maps`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Form skeleton */}
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error?.message?.includes('not found') || error?.message?.includes('access denied')
                ? 'World Not Found'
                : 'Unable to Load World'
              }
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error?.message?.includes('not found') || error?.message?.includes('access denied')
                ? 'You don\'t have permission to access this world, or it may have been deleted.'
                : 'There was a problem loading the world data. Please try again.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/worlds')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Worlds
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Generate New Map
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new map for <span className="font-medium">{world.name}</span>
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <button
                  onClick={() => router.push(`/worlds/${worldId}`)}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {world.name}
                </button>
              </li>
              <li>
                <span className="mx-2">/</span>
                <button
                  onClick={() => router.push(`/worlds/${worldId}/maps`)}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Maps
                </button>
              </li>
              <li>
                <span className="mx-2">/</span>
                <span className="text-gray-900 dark:text-gray-100">Generate</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Form */}
        <MapGeneratorForm
          worldId={worldId}
          worldName={world.name}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}