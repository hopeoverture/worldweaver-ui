import './globals.css';
import { ReactNode } from 'react';
import { AppHeader } from '@/components/header/AppHeader';

export const metadata = {
  title: 'WorldWeaver - Build Amazing Worlds',
  description: 'Create, manage, and explore your creative universes with WorldWeaver.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Force dark mode by default so UI appears dark as requested
    <html lang='en' className='dark scroll-smooth'>
      <body 
        className='min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 antialiased selection:bg-brand-100 dark:selection:bg-brand-900/50'
        suppressHydrationWarning={true}
      >
        <div className='flex min-h-screen flex-col'>
          <AppHeader />
          <main className='flex-1'>
            {children}
          </main>
          
          {/* Background decoration */}
          <div className='fixed inset-0 -z-10 bg-gradient-to-br from-brand-50/20 via-transparent to-blue-50/20 dark:from-brand-950/20 dark:to-blue-950/20' />
          <div className='fixed inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgb(148_163_184_/_0.4)_1px,transparent_0)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(71_85_105_/_0.4)_1px,transparent_0)]' />
        </div>
      </body>
    </html>
  );
}