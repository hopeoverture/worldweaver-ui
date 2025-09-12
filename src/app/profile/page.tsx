'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">You need to be signed in to view this page.</p>
        </div>
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    const { error } = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl || null,
    })

    if (error) {
      setUpdateError(error.message)
    } else {
      setUpdateSuccess(true)
      setIsEditing(false)
      setTimeout(() => setUpdateSuccess(false), 3000)
    }

    setIsUpdating(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>

            {updateSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">Profile updated successfully!</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center space-x-6">
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {profile?.full_name || 'No name set'}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Profile form */}
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full name
                    </label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700">
                      Avatar URL
                    </label>
                    <Input
                      id="avatarUrl"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a URL to an image to use as your avatar
                    </p>
                  </div>

                  {updateError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-800">{updateError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setFullName(profile?.full_name || '')
                        setAvatarUrl(profile?.avatar_url || '')
                        setUpdateError(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.full_name || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <Button
                      onClick={() => setIsEditing(true)}
                    >
                      Edit profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
