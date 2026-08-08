import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import ProfileSidebar from '../features/profile/ProfileLayout';
import { ProfileInfoTab, ProfileOrdersTab, ProfileHelpTab } from '../features/profile/ProfileContent';
import ProfileSettingsTab from '../features/profile/ProfileAccount';
import ProfileTrackOrderTab from '../features/profile/ProfileTrackOrder';
import { useAuth } from '../context/AuthContext';
import { useSupportChat } from '../hooks/useSupportChat';
import { useNotifications } from '../hooks/useNotifications';

const ProfileNotificationsTab = lazy(() => import('../features/profile/ProfileNotifications'));

const VALID_TABS = ['profile', 'orders', 'track', 'notifications', 'help', 'settings'];

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, syncFromStorage } = useAuth();

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'profile';
  const trackOrderId = searchParams.get('orderId') || '';
  const openTrackQr = searchParams.get('qr') === '1';
  const notifId = searchParams.get('notifId') || '';
  const supportEnabled = user?.isLoggedIn && (activeTab === 'notifications' || activeTab === 'help');

  const [unreadCount, setUnreadCount] = useState(0);
  const notifications = useNotifications({
    enabled: user?.isLoggedIn,
    pollMs: 45000,
    previewMocks: true,
  });

  const refreshNotifications = notifications.refresh;

  const handleAdminSupportReply = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const supportChat = useSupportChat(supportEnabled, { onAdminReply: handleAdminSupportReply });

  useEffect(() => {
    document.body.style.overflow = '';
    const token = localStorage.getItem('token');
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn && !token) {
      localStorage.removeItem('isLoggedIn');
      syncFromStorage();
    }
  }, [syncFromStorage]);

  useEffect(() => {
    setUnreadCount(notifications.unreadCount);
  }, [notifications.unreadCount]);

  const handleTabChange = useCallback(
    (tab, extra = {}) => {
      if (tab === 'profile') {
        setSearchParams({});
        return;
      }
      const params = { tab };
      if (extra.orderId) params.orderId = extra.orderId;
      if (extra.notifId) params.notifId = extra.notifId;
      if (extra.qr) params.qr = extra.qr;
      setSearchParams(params);
    },
    [setSearchParams]
  );

  const handleNotifIdChange = useCallback(
    (id) => {
      const params = { tab: 'notifications' };
      if (id) params.notifId = id;
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] font-sans text-[#111]">
      <div className={`min-h-screen lg:grid lg:grid-cols-[240px_1fr] ${activeTab === 'help' ? 'lg:h-screen lg:overflow-hidden' : ''}`}>
          <ProfileSidebar activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />

          <main
            className={`flex flex-col px-4 sm:px-6 lg:px-10 ${
              activeTab === 'help'
                ? 'overflow-hidden py-3 sm:py-4 lg:h-[100dvh] lg:max-h-[100dvh] lg:py-5 max-lg:min-h-[calc(100dvh-8rem)]'
                : 'min-h-screen gap-5 py-4 sm:py-5 lg:py-6'
            }`}
          >
            <div key={activeTab} className="animate-profileTabIn flex min-h-0 flex-1 flex-col">
            {activeTab === 'profile' && <ProfileInfoTab />}
            {activeTab === 'orders' && (
              <ProfileOrdersTab onTrackOrder={(id) => handleTabChange('track', { orderId: id })} />
            )}
            {activeTab === 'track' && (
              <ProfileTrackOrderTab initialOrderId={trackOrderId} openQr={openTrackQr} />
            )}
            {activeTab === 'notifications' && (
              <Suspense
                fallback={
                  <div className="p-4">
                    <h1 className="mb-2 font-display text-[2.3rem] font-bold text-deepGreen">Notifications</h1>
                    <p className="text-[#666666]">Loading notifications...</p>
                  </div>
                }
              >
                <ProfileNotificationsTab
                  onUnreadChange={setUnreadCount}
                  supportChat={supportChat}
                  notifications={notifications}
                  initialNotifId={notifId}
                  onNotifIdChange={handleNotifIdChange}
                />
              </Suspense>
            )}
            {activeTab === 'help' && <ProfileHelpTab supportChat={supportChat} />}
            {activeTab === 'settings' && <ProfileSettingsTab />}
            </div>
          </main>
      </div>
    </div>
  );
}
