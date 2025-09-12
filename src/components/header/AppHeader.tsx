'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '../ui/Button';

export function AppHeader() {
  const pathname = usePathname();
  const isWorldPage = pathname?.startsWith('/world/');
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't show header on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

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
          {loading ? (
            <div className='h-9 w-9 rounded-full bg-gray-200 animate-pulse'></div>
          ) : user ? (
            <>
              {/* Quick actions for authenticated users */}
              <div className='hidden sm:flex items-center gap-2'>
                <Button variant='ghost' size='sm'>
                  <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  <span className='hidden lg:inline'>Search</span>
                </Button>
              </div>

              {/* User menu */}
              <div className='relative group'>
                <Link href="/profile">
                  <button className='group h-9 w-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 hover:scale-110 hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-200 shadow-md flex items-center justify-center text-white font-medium hover:-translate-y-0.5 hover:rotate-3 active:scale-95' aria-label='Profile menu'>
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className='text-sm group-hover:scale-110 transition-transform duration-200'>
                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </button>
                </Link>

                {/* Dropdown menu */}
                <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 dark:border-neutral-700'>
                  <div className='px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-neutral-700'>
                    <p className='font-medium text-gray-900 dark:text-gray-100'>
                      {profile?.full_name || 'User'}
                    </p>
                    <p className='truncate'>{user.email}</p>
                  </div>
                  
                  <Link href="/profile" className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'>
                    Your Profile
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className='block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Not authenticated - show login/register buttons
            <div className='flex items-center gap-2'>
              <Link href="/login">
                <Button variant='ghost' size='sm'>
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size='sm'>
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}