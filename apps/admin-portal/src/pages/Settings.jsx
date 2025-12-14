import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { settingsAPI } from '../services/api';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    websocketEnabled: false,
    pollingEnabled: true,
    pollingInterval: 3000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.get().then((res) => res.data.settings),
    onSuccess: (settings) => {
      setFormData({
        websocketEnabled: settings.websocketEnabled ?? false,
        pollingEnabled: settings.pollingEnabled ?? true,
        pollingInterval: settings.pollingInterval ?? 3000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => settingsAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      alert('Settings updated successfully! Note: WebSocket changes require server restart.');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <p>Loading settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-espro-dark mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WebSocket Settings */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-espro-dark mb-4">WebSocket Configuration</h2>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-700 font-medium">Enable WebSocket</label>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable real-time updates via WebSocket. When disabled, the system uses polling.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.websocketEnabled}
                    onChange={(e) => handleChange('websocketEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-espro-orange"></div>
                </label>
              </div>
              {formData.websocketEnabled && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> WebSocket changes require a server restart to take effect.
                  </p>
                </div>
              )}
            </div>

            {/* Polling Settings */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-espro-dark mb-4">Polling Configuration</h2>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-gray-700 font-medium">Enable Polling</label>
                    <p className="text-sm text-gray-500 mt-1">
                      Enable API polling for real-time updates. When disabled, no automatic updates will occur.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pollingEnabled}
                      onChange={(e) => handleChange('pollingEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-espro-orange"></div>
                  </label>
                </div>
              </div>

              {formData.pollingEnabled && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Polling Interval (milliseconds)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={formData.pollingInterval}
                    onChange={(e) => handleChange('pollingInterval', parseInt(e.target.value) || 3000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-espro-orange focus:border-espro-orange"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Interval between API polls (1000-60000 ms). Lower values = more frequent updates but higher server load.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Current: {formData.pollingInterval}ms ({formData.pollingInterval / 1000}s)
                  </p>
                </div>
              )}

              {!formData.pollingEnabled && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> With polling disabled, the self-order portal and barista portal will not automatically update. Users will need to manually refresh the page.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    websocketEnabled: data?.websocketEnabled ?? false,
                    pollingEnabled: data?.pollingEnabled ?? true,
                    pollingInterval: data?.pollingInterval ?? 3000,
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="px-6 py-2 bg-espro-orange text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
