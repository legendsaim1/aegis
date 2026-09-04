'use client';

import { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import styles from './activity.module.css';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export default function ActivityList({ notifications: initialNotifications }) {
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState((initialNotifications?.length || 0) === 10);

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || notif.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/notifications?limit=10&offset=${notifications.length}`);
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(prev => [...prev, ...data.notifications]);
        setHasMore(data.notifications.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more activities', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className={styles.filterWrap}>
          <span className={styles.filterIcon}><FilterIcon /></span>
          <select 
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}><BellIcon /></div>
          <h2>No matching activities</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className={styles.activityList}>
          {filteredNotifications.map((notif) => {
            const date = new Date(notif.created_at);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const NotificationContent = () => (
              <div className={`${styles.notifCard} ${!notif.is_read ? styles.unread : ''}`}>
                <div className={`${styles.notifIconWrap} ${styles[notif.type] || styles.info}`}>
                  {notif.type === 'warning' || notif.type === 'error' ? '!' : '✓'}
                </div>
                <div className={styles.notifTextWrap}>
                  <p className={styles.notifTitle}>{notif.title || 'Notification'}</p>
                  <p className={styles.notifMessage}>{notif.message}</p>
                </div>
                <div className={styles.notifMeta}>
                  <span className={styles.notifDate} suppressHydrationWarning>{formattedDate}</span>
                  <span className={styles.notifTime} suppressHydrationWarning>{formattedTime}</span>
                </div>
              </div>
            );

            return (
              <div key={notif.id} className={styles.activityItem}>
                <NotificationContent />
              </div>
            );
          })}
          
          {hasMore && (
            <div className={styles.loadMoreWrap}>
              <button 
                className={styles.loadMoreBtn} 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Spinner size="sm" /> : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
