import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';

export default function HomePage() {
  // Check for global custom redirect
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsAPI.getPublic(),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && settingsData?.data?.settings?.customRedirectEnabled && settingsData?.data?.settings?.customRedirectUrl) {
      window.location.href = settingsData.data.settings.customRedirectUrl;
      return;
    }
  }, [settingsData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-espro-cream p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-espro-dark mb-4">ESPRO Self Order</h1>
        <p className="text-lg text-gray-600 mb-8">Scan QR Code to Start</p>
      </div>
    </div>
  );
}

