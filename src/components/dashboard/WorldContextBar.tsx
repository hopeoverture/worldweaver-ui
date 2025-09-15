'use client';
import { World } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface WorldContextBarProps {
  world: World;
  onEditWorld: () => void;
}

export function WorldContextBar({ world, onEditWorld }: WorldContextBarProps) {

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

        {/* World Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {world.genreBlend?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Genre</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.genreBlend.join(', ')}</p>
            </div>
          ) : null}

          {world.overallTone ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Tone</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {Array.isArray(world.overallTone) ? world.overallTone.join(', ') : world.overallTone}
              </p>
            </div>
          ) : null}

          {world.keyThemes?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Theme</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.keyThemes.join(', ')}</p>
            </div>
          ) : null}

          {world.audienceRating ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Audience Rating</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.audienceRating}</p>
            </div>
          ) : null}


          {world.technologyLevel?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Technology Level</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.technologyLevel.join(', ')}</p>
            </div>
          ) : null}

          {world.magicLevel?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Magic Level</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.magicLevel.join(', ')}</p>
            </div>
          ) : null}

          {world.cosmologyModel ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Cosmology Model</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.cosmologyModel}</p>
            </div>
          ) : null}

          {world.climateBiomes?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Travel Difficulty</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.climateBiomes.join(', ')}</p>
            </div>
          ) : null}

          {world.calendarTimekeeping ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Calendar & Timekeeping</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.calendarTimekeeping}</p>
            </div>
          ) : null}

          {world.societalOverview ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Societal Overview</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.societalOverview}</p>
            </div>
          ) : null}

          {world.conflictDrivers?.length ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Conflict Drivers</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {Array.isArray(world.conflictDrivers) ? world.conflictDrivers.join(', ') : world.conflictDrivers}
              </p>
            </div>
          ) : null}

          {world.rulesConstraints ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Rules & Constraints</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.rulesConstraints}</p>
            </div>
          ) : null}

          {world.aestheticDirection ? (
            <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Aesthetic Direction</span>
              <p className="text-sm text-gray-900 dark:text-gray-100">{world.aestheticDirection}</p>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
