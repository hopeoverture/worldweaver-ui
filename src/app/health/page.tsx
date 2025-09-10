'use client';

import { useEffect, useState } from 'react';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: any;
}

interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setHealthData({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: [{
          service: 'health_fetch',
          status: 'unhealthy',
          responseTime: 0,
          error: 'Failed to fetch health data'
        }],
        summary: { total: 1, healthy: 0, unhealthy: 1, degraded: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health status...</p>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">❌ Unable to load health data</p>
          <button 
            onClick={fetchHealthData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 border-b border-gray-200 ${getStatusColor(healthData.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(healthData.status)}</span>
                <div>
                  <h1 className="text-xl font-semibold">System Health</h1>
                  <p className="text-sm opacity-75">Overall Status: {healthData.status.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right text-sm opacity-75">
                <p>Last Updated: {lastUpdated.toLocaleTimeString()}</p>
                <p>Timestamp: {new Date(healthData.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{healthData.summary.total}</div>
                <div className="text-sm text-gray-600">Total Checks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{healthData.summary.healthy}</div>
                <div className="text-sm text-gray-600">Healthy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{healthData.summary.degraded}</div>
                <div className="text-sm text-gray-600">Degraded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{healthData.summary.unhealthy}</div>
                <div className="text-sm text-gray-600">Unhealthy</div>
              </div>
            </div>
          </div>

          {/* Individual Checks */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold mb-4">Service Checks</h2>
            <div className="space-y-3">
              {healthData.checks.map((check, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(check.status)}</span>
                      <div>
                        <h3 className="font-medium">{check.service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                        {check.error && (
                          <p className="text-sm opacity-75 mt-1">{check.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{check.responseTime}ms</div>
                      <div className="opacity-75">{check.status}</div>
                    </div>
                  </div>
                  
                  {check.details && (
                    <div className="mt-3 pt-3 border-t border-current opacity-50">
                      <details className="text-sm">
                        <summary className="cursor-pointer hover:opacity-75">Details</summary>
                        <pre className="mt-2 text-xs overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Health checks run every 30 seconds automatically
              </div>
              <button
                onClick={fetchHealthData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This page provides real-time monitoring of critical system components.</p>
          <p>API endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/health/db</code></p>
        </div>
      </div>
    </div>
  );
}