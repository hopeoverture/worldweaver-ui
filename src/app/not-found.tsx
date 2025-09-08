export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 5.656M21 21l-4.35-4.35M17.657 14.828A8 8 0 1114.828 17.657" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <a href="/" className="text-brand-600 hover:text-brand-700">Return to home</a>
        </div>
      </div>
    </div>
  )
}


