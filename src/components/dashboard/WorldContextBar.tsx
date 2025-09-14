'use client';
import { useState } from 'react';
import { World } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface WorldContextBarProps {
  world: World;
  onEditWorld: () => void;
  memberCount?: number;
  templateCount?: number;
}

export function WorldContextBar({ world, onEditWorld, memberCount = 0, templateCount = 0 }: WorldContextBarProps) {
  const [showExtended, setShowExtended] = useState(false);

  // Check if we have extended world details to show
  const hasExtendedDetails = !!(
    world.logline ||
    world.genreBlend?.length ||
    world.overallTone ||
    world.keyThemes?.length ||
    world.audienceRating ||
    world.scopeScale ||
    world.technologyLevel?.length ||
    world.magicLevel?.length ||
    world.cosmologyModel ||
    world.climateBiomes?.length ||
    world.calendarTimekeeping ||
    world.societalOverview ||
    world.conflictDrivers ||
    world.rulesConstraints ||
    world.aestheticDirection
  );

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
      <div className="container py-6">
        {/* Main Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {world.name}
              </h1>
              <div className="flex items-center gap-2">
                {world.isPublic ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private
                  </span>
                )}
              </div>
            </div>

            {world.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed max-w-3xl">
                {world.description}
              </p>
            )}

            {world.logline && (
              <p className="text-brand-600 dark:text-brand-400 font-medium italic mt-2">
                "{world.logline}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 ml-6">
            <Button
              onClick={onEditWorld}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit World
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Entities</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{world.entityCount}</span>
          </div>

          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Templates</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{templateCount}</span>
          </div>

          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Members</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberCount}</span>
          </div>

          <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(world.updatedAt)}</span>
          </div>
        </div>

        {/* Extended Details Section */}
        {hasExtendedDetails && (
          <div className="border-t border-gray-200 dark:border-neutral-700 pt-4">
            <button
              onClick={() => setShowExtended(!showExtended)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showExtended ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showExtended ? 'Hide' : 'Show'} World Details
            </button>

            {showExtended && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {world.genreBlend?.length && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Genre:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.genreBlend.join(', ')}</p>
                  </div>
                )}

                {world.overallTone && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tone:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.overallTone}</p>
                  </div>
                )}

                {world.keyThemes?.length && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Themes:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.keyThemes.join(', ')}</p>
                  </div>
                )}

                {world.audienceRating && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.audienceRating}</p>
                  </div>
                )}

                {world.scopeScale && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Scope:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.scopeScale}</p>
                  </div>
                )}

                {world.technologyLevel?.length && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Technology:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.technologyLevel.join(', ')}</p>
                  </div>
                )}

                {world.magicLevel?.length && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Magic:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.magicLevel.join(', ')}</p>
                  </div>
                )}

                {world.cosmologyModel && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cosmology:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.cosmologyModel}</p>
                  </div>
                )}

                {world.climateBiomes?.length && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Climate:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{world.climateBiomes.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
