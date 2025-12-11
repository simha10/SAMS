import { useState, useEffect } from 'react';
import { announcementAPI } from '@/services/api';
import type { Announcement } from '@/types';

export const useAnnouncementModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const checkForNewAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementAPI.getActiveAnnouncements();
      if (response.success && response.data?.announcements && response.data.announcements.length > 0) {
        // Get the most recent announcement
        const sortedAnnouncements = [...response.data.announcements].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const mostRecent = sortedAnnouncements[0];
        
        // Check if this announcement has been shown to the user before
        const shownAnnouncements = JSON.parse(localStorage.getItem('shownAnnouncements') || '[]');
        const hasBeenShown = shownAnnouncements.includes(mostRecent._id);
        
        if (!hasBeenShown) {
          setLatestAnnouncement(mostRecent);
          setShowModal(true);
          // Mark as shown
          const updatedShown = [...shownAnnouncements, mostRecent._id];
          localStorage.setItem('shownAnnouncements', JSON.stringify(updatedShown));
        }
      }
    } catch (error) {
      console.error('Error checking for new announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsShown = (id: string) => {
    const shownAnnouncements = JSON.parse(localStorage.getItem('shownAnnouncements') || '[]');
    if (!shownAnnouncements.includes(id)) {
      const updatedShown = [...shownAnnouncements, id];
      localStorage.setItem('shownAnnouncements', JSON.stringify(updatedShown));
    }
  };

  const closeModal = () => {
    if (latestAnnouncement) {
      markAsShown(latestAnnouncement._id);
    }
    setShowModal(false);
    setLatestAnnouncement(null);
  };

  return {
    showModal,
    latestAnnouncement,
    loading,
    checkForNewAnnouncements,
    closeModal
  };
};