import { useState, useEffect } from 'react';
import { announcementAPI } from '@/services/api';
import type { Announcement } from '@/types';

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementAPI.getActiveAnnouncements();
      if (response.success && response.data?.announcements) {
        setAnnouncements(response.data.announcements);
      }
    } catch (err) {
      setError('Failed to load announcements');
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements
  };
};