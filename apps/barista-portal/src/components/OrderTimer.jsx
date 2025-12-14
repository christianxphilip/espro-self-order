import { useState, useEffect } from 'react';

export default function OrderTimer({ createdAt }) {
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const created = new Date(createdAt);
      const diff = Math.floor((now - created) / 1000); // seconds

      if (diff < 60) {
        setTimeElapsed(`${diff}s ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeElapsed(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeElapsed(`${hours}h ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <p className="text-xs text-gray-500 mt-2">{timeElapsed}</p>
  );
}
