'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/Button';

export function AppHeader() {
  const pathname = usePathname();
  const isWorldPage = pathname?.startsWith('/world/');

  return (
    <header className='sticky top-0 z-50 w-full border-b border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-neutral-900/80'>
      <div className='container h-16 flex items-center justify-between'>
        {/* Logo and brand */}
        <Link href='/' className='flex items-center gap-3 font-bold text-lg hover:opacity-80 transition-opacity'>
          <div className='relative'>
            <span className='inline-block h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 shadow-md' />
            <span className='absolute inset-0 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 opacity-20' />
          </div>
          <span className='text-gray-900 dark:text-gray-100'>WorldWeaver</span>
        </Link>

        {/* Navigation breadcrumb for world pages */}
        {isWorldPage && (
          <div className='hidden md:flex items-center text-sm text-gray-600 dark:text-gray-400'>
            <Link href='/' className='hover:text-brand-600 dark:hover:text-brand-400 transition-colors'>
              Worlds
            </Link>
            <svg className='mx-2 h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 dark:text-gray-100 font-medium'>Current World</span>
          </div>
        )}

        {/* Right side navigation */}
        <nav className='flex items-center gap-3'>
          {/* Quick actions */}
          <div className='hidden sm:flex items-center gap-2'>
            <Button variant='ghost' size='sm' glow='pink'>
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
              <span className='hidden lg:inline'>Search</span>
            </Button>
            
            <Link href="/settings">
              <Button variant='ghost' size='sm' glow='blue'>
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 616 0z' />
                </svg>
                <span className='hidden lg:inline'>Settings</span>
              </Button>
            </Link>
          </div>

          {/* Profile menu */}
          <Link href="/profile">
            <Button size='sm' glow='green' className='h-9 w-9 p-0 rounded-full flex items-center justify-center'>
              <span className='text-sm'>WB</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}