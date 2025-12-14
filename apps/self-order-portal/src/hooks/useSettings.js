import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';

/**
 * Custom hook to fetch settings and provide polling configuration
 * @returns {Object} Settings object with pollingEnabled and pollingInterval
 */
export function useSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsAPI.getPublic().then((res) => res.data.settings),
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000, // Refetch settings every minute
  });

  const settings = data || {
    pollingEnabled: true,
    pollingInterval: 5000, // Default fallback
  };

  return {
    settings,
    isLoading,
    // Helper to get refetchInterval for useQuery
    getRefetchInterval: (defaultInterval) => {
      if (!settings.pollingEnabled) {
        return false; // Disable polling
      }
      return settings.pollingInterval || defaultInterval;
    },
  };
}
