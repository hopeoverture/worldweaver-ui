'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';

interface UserProfile {
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar?: string;
  location: string;
  website: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  worldUpdates: boolean;
  collaborationInvites: boolean;
  weeklyDigest: boolean;
}

const defaultProfile: UserProfile = {
  name: 'World Builder',
  email: 'builder@worldweaver.app',
  username: 'worldbuilder',
  bio: 'Passionate about creating immersive fictional worlds and storytelling.',
  location: 'Earth',
  website: '',
  timezone: 'UTC-5',
  language: 'English',
  theme: 'system',
  emailNotifications: true,
  worldUpdates: true,
  collaborationInvites: true,
  weeklyDigest: false
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const tabs = [
    { key: 'general', label: 'General', render: null },
    { key: 'preferences', label: 'Preferences', render: null },
    { key: 'notifications', label: 'Notifications', render: null },
    { key: 'privacy', label: 'Privacy', render: null }
  ];

  const timezones = [
    'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 
    'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 
    'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 
    'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic'
  ];

  return (
    <main className="container py-8 max-w-4xl">
      {/* Back Navigation */}
      <div className="mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="hover:scale-105 transition-transform duration-200"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="mb-8 p-6 bg-gradient-to-br from-brand-50/50 via-purple-50/30 to-blue-50/50 dark:from-brand-900/20 dark:via-purple-900/10 dark:to-blue-900/20 border border-brand-200 dark:border-brand-800">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <button className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-sm font-medium">
              Change
            </button>
          </div>

          {/* Basic Info */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h2>
            <p className="text-brand-600 dark:text-brand-400 font-medium">@{profile.username}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">{profile.bio}</p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                    Website
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Tabs */}
      <Card className="p-6">
        <Tabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={profile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <Input
                    value={profile.username}
                    onChange={(e) => updateProfile({ username: e.target.value })}
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <Input
                    value={profile.location}
                    onChange={(e) => updateProfile({ location: e.target.value })}
                    placeholder="Where are you based?"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <Input
                    type="url"
                    value={profile.website}
                    onChange={(e) => updateProfile({ website: e.target.value })}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell us about yourself and your world-building interests..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {profile.bio.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <Select
                    value={profile.language}
                    onChange={(e) => updateProfile({ language: e.target.value })}
                  >
                    <option value="">Select language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <Select
                    value={profile.timezone}
                    onChange={(e) => updateProfile({ timezone: e.target.value })}
                  >
                    <option value="">Select timezone</option>
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme Preference
                  </label>
                  <Select
                    value={profile.theme}
                    onChange={(e) => updateProfile({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Compact Mode</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Show more content in less space</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Animation Effects</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enable hover animations and transitions</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">World Updates</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when your worlds are updated by collaborators</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.worldUpdates}
                      onChange={(e) => updateProfile({ worldUpdates: e.target.checked })}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Collaboration Invites</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive emails when someone invites you to collaborate on a world</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.collaborationInvites}
                      onChange={(e) => updateProfile({ collaborationInvites: e.target.checked })}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Digest</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get a summary of your world-building activity each week</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.weeklyDigest}
                      onChange={(e) => updateProfile({ weeklyDigest: e.target.checked })}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Updates</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Learn about new features and improvements</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser Notifications</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified in your browser for important updates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Profile Visibility</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Profile</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to find and view your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Show World Count</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Display the number of worlds you've created on your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity Status</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Show when you were last active</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Download Your Data
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Request Data Deletion
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-8 p-6 border-red-200 dark:border-red-800">
        <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Delete Account</h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
