import { useState, useEffect } from 'react';

interface Stats {
  today: {
    total: number;
    success: number;
    duplicate: number;
    error: number;
    successRate: number;
    bySource: {
      website: number;
      facebook: number;
    };
  };
  lastHour: {
    total: number;
    success: number;
  };
  recent: Array<{
    timestamp: string;
    source: string;
    email: string;
    status: string;
  }>;
  errors: Array<{
    code: number;
    msg: string;
    count: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics/dashboard');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  if (!stats) {
    return <div className="p-8">Failed to load analytics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📊 Signup Analytics Dashboard</h1>

        {/* Today's Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Total Signups Today</div>
            <div className="text-3xl font-bold text-blue-600">{stats.today.total}</div>
            <div className="text-xs text-gray-500 mt-2">Last hour: {stats.lastHour.total}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Success Rate</div>
            <div className="text-3xl font-bold text-green-600">{stats.today.successRate}%</div>
            <div className="text-xs text-gray-500 mt-2">{stats.today.success} successful</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Duplicates</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.today.duplicate}</div>
            <div className="text-xs text-gray-500 mt-2">Already registered</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm font-semibold">Errors</div>
            <div className="text-3xl font-bold text-red-600">{stats.today.error}</div>
            <div className="text-xs text-gray-500 mt-2">Registration failures</div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Signup Sources</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-gray-600">🌐 Website Form</div>
              <div className="text-2xl font-bold text-blue-600">{stats.today.bySource.website}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-gray-600">📱 Facebook Leads</div>
              <div className="text-2xl font-bold text-purple-600">{stats.today.bySource.facebook}</div>
            </div>
          </div>
        </div>

        {/* Errors Breakdown */}
        {stats.errors.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Error Breakdown</h2>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Error Code</th>
                  <th className="text-left py-2">Message</th>
                  <th className="text-right py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.errors.map((error, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-mono text-red-600">{error.code}</td>
                    <td className="py-2">{error.msg}</td>
                    <td className="text-right py-2 font-bold">{error.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Signups */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Signups (Last 20)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Source</th>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((event, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-600">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-xs font-semibold">
                        {event.source === 'website' ? '🌐 Website' : '📱 Facebook'}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-sm">{event.email}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          event.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'duplicate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.status === 'success'
                          ? '✅ Success'
                          : event.status === 'duplicate'
                          ? '⚠️ Duplicate'
                          : '❌ Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Last updated: {new Date().toLocaleTimeString()} (auto-refreshes every 30 seconds)</p>
        </div>
      </div>
    </div>
  );
}
