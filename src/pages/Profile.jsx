import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import ProfileSidebar from '../features/profile/ProfileLayout';
import { ProfileInfoTab, ProfileOrdersTab, ProfileHelpTab } from '../features/profile/ProfileContent';
import ProfileSettingsTab from '../features/profile/ProfileAccount';
import { useAuth } from '../context/AuthContext';
import { useSupportChat } from '../hooks/useSupportChat';
import { useNotifications } from '../hooks/useNotifications';

const ProfileNotificationsTab = lazy(() => import('../features/profile/ProfileNotifications'));

const VALID_TABS = ['profile', 'orders', 'notifications', 'help', 'settings'];

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, syncFromStorage } = useAuth();

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'profile';
  const supportEnabled = user?.isLoggedIn && (activeTab === 'notifications' || activeTab === 'help');

  const [unreadCount, setUnreadCount] = useState(0);
  const notifications = useNotifications({ enabled: user?.isLoggedIn, pollMs: 20000 });

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
    (tab) => {
      setSearchParams(tab === 'profile' ? {} : { tab });
    },
    [setSearchParams]
  );

  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] font-sans text-[#111]">
      <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
          <ProfileSidebar activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />

          <main className="flex min-h-screen flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
            {activeTab === 'profile' && <ProfileInfoTab />}
            {activeTab === 'orders' && <ProfileOrdersTab />}
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
                />
              </Suspense>
            )}
            {activeTab === 'help' && <ProfileHelpTab supportChat={supportChat} />}
            {activeTab === 'settings' && <ProfileSettingsTab />}
          </main>
      </div>
    </div>
  );
}
