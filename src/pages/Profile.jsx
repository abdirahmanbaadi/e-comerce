import { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import ProfileSidebar from '../features/profile/ProfileLayout';
import { ProfileInfoTab, ProfileOrdersTab, ProfileHelpTab } from '../features/profile/ProfileContent';
import ProfileNotificationsTab from '../features/profile/ProfileNotifications';
import ProfileSettingsTab from '../features/profile/ProfileAccount';
import { useAuth } from '../context/AuthContext';
import { useSupportChat } from '../hooks/useSupportChat';
import { useNotifications } from '../hooks/useNotifications';

const VALID_TABS = ['profile', 'orders', 'notifications', 'help', 'settings'];

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, syncFromStorage } = useAuth();

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'profile';

  const [unreadCount, setUnreadCount] = useState(0);
  const notifications = useNotifications({ enabled: user?.isLoggedIn, pollMs: 20000 });
  const supportChat = useSupportChat(activeTab === 'help' || activeTab === 'notifications');

  useEffect(() => {
    syncFromStorage();
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
    <div className="min-h-screen overflow-x-hidden bg-[#FCFAF7] font-sans text-[#111]">
      <div className="h-screen max-h-screen overflow-hidden max-lg:h-auto max-lg:max-h-none max-lg:overflow-visible">
        <div className="grid h-screen max-h-screen grid-cols-[240px_1fr] overflow-hidden max-lg:h-auto max-lg:max-h-none max-lg:grid-cols-1 max-lg:overflow-visible">
          <ProfileSidebar activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />

          <main className="flex h-screen max-h-screen flex-col gap-5 overflow-y-auto px-10 py-6 max-lg:h-auto max-lg:max-h-none max-lg:overflow-visible max-lg:p-6">
            {activeTab === 'profile' && <ProfileInfoTab />}
            {activeTab === 'orders' && <ProfileOrdersTab />}
            {activeTab === 'notifications' && (
              <ProfileNotificationsTab
                onUnreadChange={setUnreadCount}
                supportChat={supportChat}
                notifications={notifications}
              />
            )}
            {activeTab === 'help' && <ProfileHelpTab supportChat={supportChat} />}
            {activeTab === 'settings' && <ProfileSettingsTab />}
          </main>
        </div>
      </div>
    </div>
  );
}
