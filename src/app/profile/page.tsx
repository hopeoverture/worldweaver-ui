'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProfileStats } from '../api/profile/stats/route'
import { ActivityResponse } from '../api/profile/activity/route'
import type { Profile, ActivityLog } from '@/lib/supabase/types'

interface ExtendedProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  social_links: Record<string, string>;
  preferences: Record<string, any>;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Activity state
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [activitiesTotal, setActivitiesTotal] = useState(0)

  // Form states
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    avatar_url: profile?.avatar_url || '',
    banner_url: profile?.banner_url || '',
    social_links: {
      twitter: (profile?.social_links as any)?.twitter || '',
      github: (profile?.social_links as any)?.github || '',
      linkedin: (profile?.social_links as any)?.linkedin || ''
    }
  })

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Load stats on component mount
  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  // Load activities when activity tab is selected
  useEffect(() => {
    if (user && activeTab === 'activity') {
      fetchActivities()
    }
  }, [user, activeTab])

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
        banner_url: profile.banner_url || '',
        social_links: {
          twitter: (profile.social_links as any)?.twitter || '',
          github: (profile.social_links as any)?.github || '',
          linkedin: (profile.social_links as any)?.linkedin || ''
        }
      })
    }
  }, [profile])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/profile/stats', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchActivities = async (limit = 20) => {
    setLoadingActivities(true)
    try {
      const response = await fetch(`/api/profile/activity?limit=${limit}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data: ActivityResponse = await response.json()
        setActivities(data.activities || [])
        setActivitiesTotal(data.total || 0)
      } else {
        console.error('Failed to fetch activities:', response.statusText)
        setActivities([])
        setActivitiesTotal(0)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
      setActivitiesTotal(0)
    } finally {
      setLoadingActivities(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-100">Please sign in</h2>
          <p className="mt-2 text-gray-400">You need to be signed in to view this page.</p>
        </div>
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    // Prepare update data with all new fields
    const updateData: Partial<Profile> = {
      full_name: formData.full_name || null,
      avatar_url: formData.avatar_url || null,
      bio: formData.bio || null,
      location: formData.location || null,
      website: formData.website || null,
      social_links: formData.social_links,
      banner_url: formData.banner_url || null,
    }

    const { error } = await updateProfile(updateData)

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMilliseconds = now.getTime() - date.getTime()
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else {
      return formatDate(dateString)
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('create')) return '✨'
    if (action.includes('update')) return '✏️'
    if (action.includes('delete')) return '🗑️'
    if (action.includes('archive')) return '📦'
    if (action.includes('invite') || action.includes('member')) return '👥'
    if (action.includes('profile')) return '👤'
    return '📝'
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const StatCard = ({ title, value, icon, description }: {
    title: string
    value: number | string
    icon: string
    description?: string
  }) => (
    <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-neutral-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Banner Section */}
      <div className="relative h-48 bg-gradient-to-r from-brand-600 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

        {/* Profile Header */}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-6">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-neutral-700 border-4 border-gray-900 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                {profile?.full_name || 'Anonymous User'}
              </h1>
              <p className="text-blue-200">{user.email}</p>
              <p className="text-blue-300 text-sm">
                Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {updateSuccess && (
          <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-300">Profile updated successfully!</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-neutral-800 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-neutral-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-100">Profile Information</h2>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter your full name"
                        className="bg-neutral-700 border-neutral-600 text-gray-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-gray-100 placeholder:text-gray-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                          Location
                        </label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, Country"
                          className="bg-neutral-700 border-neutral-600 text-gray-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                          Website
                        </label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourwebsite.com"
                          className="bg-neutral-700 border-neutral-600 text-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">
                        Avatar URL
                      </label>
                      <Input
                        id="avatarUrl"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="bg-neutral-700 border-neutral-600 text-gray-100"
                      />
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Social Links</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-blue-400 w-20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            <span className="text-sm">Twitter</span>
                          </div>
                          <Input
                            value={formData.social_links.twitter}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, twitter: e.target.value }
                            }))}
                            placeholder="username (without @)"
                            className="bg-neutral-700 border-neutral-600 text-gray-100 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-gray-300 w-20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="text-sm">GitHub</span>
                          </div>
                          <Input
                            value={formData.social_links.github}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, github: e.target.value }
                            }))}
                            placeholder="username"
                            className="bg-neutral-700 border-neutral-600 text-gray-100 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-blue-600 w-20">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="text-sm">LinkedIn</span>
                          </div>
                          <Input
                            value={formData.social_links.linkedin}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, linkedin: e.target.value }
                            }))}
                            placeholder="username"
                            className="bg-neutral-700 border-neutral-600 text-gray-100 flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {updateError && (
                      <div className="bg-red-900/20 border border-red-700 rounded-md p-4">
                        <p className="text-red-300">{updateError}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            full_name: profile?.full_name || '',
                            bio: profile?.bio || '',
                            location: profile?.location || '',
                            website: profile?.website || '',
                            avatar_url: profile?.avatar_url || '',
                            banner_url: profile?.banner_url || '',
                            social_links: {
                              twitter: (profile?.social_links as any)?.twitter || '',
                              github: (profile?.social_links as any)?.github || '',
                              linkedin: (profile?.social_links as any)?.linkedin || ''
                            }
                          })
                          setUpdateError(null)
                        }}
                        className="border-neutral-600 text-gray-300 hover:bg-neutral-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <p className="text-gray-100">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                      <p className="text-gray-100">{profile?.full_name || 'Not set'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                      <p className="text-gray-100">{profile?.bio || 'Tell us about yourself...'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                        <p className="text-gray-100">{profile?.location || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Website</label>
                        <p className="text-gray-100">
                          {profile?.website ? (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-400 hover:text-brand-300 hover:underline"
                            >
                              {profile.website}
                            </a>
                          ) : 'Not set'}
                        </p>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Social Links</label>
                      <div className="flex gap-4">
                        {profile && (profile.social_links as any)?.twitter && (
                          <a
                            href={`https://twitter.com/${(profile.social_links as any).twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            @{(profile.social_links as any).twitter}
                          </a>
                        )}
                        {(profile?.social_links as any)?.github && (
                          <a
                            href={`https://github.com/${(profile?.social_links as any).github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            {(profile?.social_links as any).github}
                          </a>
                        )}
                        {(profile?.social_links as any)?.linkedin && (
                          <a
                            href={`https://linkedin.com/in/${(profile?.social_links as any).linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            {(profile?.social_links as any).linkedin}
                          </a>
                        )}
                        {!(profile?.social_links as any)?.twitter && !(profile?.social_links as any)?.github && !(profile?.social_links as any)?.linkedin && (
                          <p className="text-gray-500">No social links added</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-100">Your Statistics</h2>

                {loadingStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 animate-pulse">
                        <div className="h-4 bg-neutral-700 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-neutral-700 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard
                      title="Worlds Owned"
                      value={stats.worldsOwned}
                      icon="🌍"
                      description="Worlds you created"
                    />
                    <StatCard
                      title="Collaborating"
                      value={stats.worldsCollaborating}
                      icon="🤝"
                      description="Worlds you're a member of"
                    />
                    <StatCard
                      title="Total Entities"
                      value={stats.totalEntities}
                      icon="🎯"
                      description="Across all accessible worlds"
                    />
                    <StatCard
                      title="Custom Templates"
                      value={stats.totalTemplates}
                      icon="📋"
                      description="Templates you've created"
                    />
                    <StatCard
                      title="Relationships"
                      value={stats.totalRelationships}
                      icon="🔗"
                      description="Entity connections made"
                    />
                    <StatCard
                      title="Folders"
                      value={stats.totalFolders}
                      icon="📁"
                      description="Organization structures"
                    />
                  </div>
                ) : (
                  <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 text-center">
                    <p className="text-gray-400">Failed to load statistics</p>
                    <Button onClick={fetchStats} className="mt-2">
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-100">Recent Activity</h2>
                  {activitiesTotal > 0 && (
                    <p className="text-sm text-gray-400">{activitiesTotal} total activities</p>
                  )}
                </div>

                {loadingActivities ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-neutral-700 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities?.map((activity) => (
                      <div key={activity.id} className="flex gap-3 p-4 bg-neutral-700/50 rounded-lg">
                        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{getActivityIcon(activity.action)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-100">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">
                              {formatRelativeTime(activity.created_at || '')}
                            </p>
                            {activity.resource_type && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-xs text-gray-500 capitalize">
                                  {activity.resource_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {activitiesTotal > activities.length && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => fetchActivities(activities.length + 20)}
                          disabled={loadingActivities}
                          className="border-neutral-600 text-gray-300 hover:bg-neutral-700"
                        >
                          Load More Activities
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-gray-400 mb-2">No activity yet</p>
                    <p className="text-sm text-gray-500">
                      Start creating worlds and content to see your activity timeline
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Notification Preferences */}
                <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive updates about your worlds and collaborations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={(profile?.preferences as any)?.emailNotifications !== false}
                          className="sr-only peer"
                          onChange={(e) => {
                            // TODO: Update preferences
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 font-medium">Member Invitations</p>
                        <p className="text-sm text-gray-400">Get notified when you're invited to collaborate</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={(profile?.preferences as any)?.memberInvitations !== false}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 font-medium">World Updates</p>
                        <p className="text-sm text-gray-400">Notifications about changes in worlds you're part of</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={(profile?.preferences as any)?.worldUpdates !== false}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-100 font-medium">Profile Visibility</p>
                        <p className="text-sm text-gray-400">Make your profile visible to other users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={(profile?.preferences as any)?.publicProfile !== false}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Default World Visibility</label>
                      <select
                        defaultValue={(profile?.preferences as any)?.defaultWorldVisibility || 'private'}
                        className="w-full rounded-md border border-neutral-600 bg-neutral-700 px-3 py-2 text-gray-100 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                      >
                        <option value="private">Private (only you and invited members)</option>
                        <option value="public">Public (visible to everyone)</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">New worlds will use this visibility setting by default</p>
                    </div>
                  </div>
                </div>

                {/* Account Management */}
                <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">Account Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                      <div>
                        <p className="text-gray-100 font-medium">Change Password</p>
                        <p className="text-sm text-gray-400">Update your account password</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-neutral-600 text-gray-300 hover:bg-neutral-700"
                        onClick={() => {
                          // TODO: Implement password change modal
                          alert('Password change functionality coming soon!')
                        }}
                      >
                        Change Password
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                      <div>
                        <p className="text-gray-100 font-medium">Export Data</p>
                        <p className="text-sm text-gray-400">Download your worlds and content</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-neutral-600 text-gray-300 hover:bg-neutral-700"
                        onClick={() => {
                          // TODO: Implement data export
                          alert('Data export functionality coming soon!')
                        }}
                      >
                        Export Data
                      </Button>
                    </div>

                    <div className="border-t border-neutral-600 pt-4">
                      <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700 rounded-lg">
                        <div>
                          <p className="text-red-300 font-medium">Delete Account</p>
                          <p className="text-sm text-red-400">Permanently delete your account and all data</p>
                        </div>
                        <Button
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-900/30"
                          onClick={() => {
                            // TODO: Implement account deletion with confirmation
                            alert('Account deletion functionality coming soon!')
                          }}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Overview</h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Worlds</span>
                    <span className="text-gray-100 font-medium">{stats.worldsOwned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entities</span>
                    <span className="text-gray-100 font-medium">{formatNumber(stats.totalEntities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Templates</span>
                    <span className="text-gray-100 font-medium">{stats.totalTemplates}</span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-neutral-700 rounded w-16"></div>
                      <div className="h-4 bg-neutral-700 rounded w-8"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Account Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Joined</span>
                  <p className="text-gray-100 mt-1">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Email</span>
                  <p className="text-gray-100 mt-1 truncate">{user.email}</p>
                </div>
                <div>
                  <span className="text-gray-400">User ID</span>
                  <p className="text-gray-100 mt-1 text-xs font-mono truncate">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}