'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General settings
    appName: 'WorldWeaver',
    language: 'en',
    timezone: 'UTC',
    
    // Appearance settings
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    
    // Data settings
    autoSave: true,
    autoSaveInterval: 30,
    backupEnabled: true,
    backupFrequency: 'daily',
    
    // Privacy settings
    analytics: false,
    crashReporting: true,
    betaFeatures: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    soundEffects: true,
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
  };

  const handleReset = () => {
    console.log('Resetting settings');
  };

  const handleExport = () => {
    console.log('Exporting data');
  };

  const handleImport = () => {
    console.log('Importing data');
  };

  const tabs: TabItem[] = [
    {
      key: 'general',
      label: 'General',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      render: (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Application Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure basic application preferences
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Application Name
                </label>
                <Input
                  value={settings.appName}
                  onChange={(e) => handleSettingChange('appName', e.target.value)}
                  placeholder="Enter application name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <Select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <Select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'appearance',
      label: 'Appearance',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
      render: (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Theme Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize the visual appearance of the application
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <Select
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Compact Mode</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reduce spacing and padding for a denser layout</p>
                </div>
                <Toggle
                  pressed={settings.compactMode}
                  onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Animations</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable smooth transitions and animations</p>
                </div>
                <Toggle
                  pressed={settings.animations}
                  onClick={() => handleSettingChange('animations', !settings.animations)}
                />
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'data',
      label: 'Data & Storage',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      render: (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Auto-Save Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure automatic saving behavior
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-Save</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save changes as you work</p>
                </div>
                <Toggle
                  pressed={settings.autoSave}
                  onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                />
              </div>
              
              {settings.autoSave && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auto-Save Interval (seconds)
                  </label>
                  <Input
                    type="number"
                    value={settings.autoSaveInterval}
                    onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
                    min="10"
                    max="300"
                  />
                </div>
              )}
            </div>
          </Card>
          
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Backup Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure data backup and recovery options
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Automatic Backups</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Regularly backup your data to prevent loss</p>
                </div>
                <Toggle
                  pressed={settings.backupEnabled}
                  onClick={() => handleSettingChange('backupEnabled', !settings.backupEnabled)}
                />
              </div>
              
              {settings.backupEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Backup Frequency
                  </label>
                  <Select
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleExport}>
                    Export Data
                  </Button>
                  <Button variant="outline" onClick={handleImport}>
                    Import Data
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Storage Usage
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View current storage consumption
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Worlds</span>
                  <span className="font-medium">2.4 MB</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Assets</span>
                  <span className="font-medium">1.8 MB</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Backups</span>
                  <span className="font-medium">5.2 MB</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Used</span>
                  <span>9.4 MB / 100 MB</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'privacy',
      label: 'Privacy',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      render: (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Privacy Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Control how your data is used and shared
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Analytics</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Help improve the app by sharing anonymous usage data</p>
                </div>
                <Toggle
                  pressed={settings.analytics}
                  onClick={() => handleSettingChange('analytics', !settings.analytics)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Crash Reporting</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically send crash reports to help fix bugs</p>
                </div>
                <Toggle
                  pressed={settings.crashReporting}
                  onClick={() => handleSettingChange('crashReporting', !settings.crashReporting)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Beta Features</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get early access to new features and improvements</p>
                </div>
                <Toggle
                  pressed={settings.betaFeatures}
                  onClick={() => handleSettingChange('betaFeatures', !settings.betaFeatures)}
                />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Data Management
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your personal data and account
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Your Privacy Matters
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Your creative work stays private. We never access your worlds, entities, or templates without your explicit permission.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline">
                  Download My Data
                </Button>
                <Button variant="outline">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
        </svg>
      ),
      render: (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Notification Preferences
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose how and when to receive notifications
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates and announcements via email</p>
                </div>
                <Toggle
                  pressed={settings.emailNotifications}
                  onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Push Notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get real-time notifications in your browser</p>
                </div>
                <Toggle
                  pressed={settings.pushNotifications}
                  onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Sound Effects</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for actions and notifications</p>
                </div>
                <Toggle
                  pressed={settings.soundEffects}
                  onClick={() => handleSettingChange('soundEffects', !settings.soundEffects)}
                />
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your WorldWeaver experience and manage your preferences.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Action buttons */}
      <div className="max-w-6xl mx-auto mt-8 flex justify-between items-center pt-6 border-t border-gray-200 dark:border-neutral-800">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
