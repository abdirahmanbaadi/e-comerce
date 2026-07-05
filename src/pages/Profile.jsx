import { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileInfoTab from '../components/profile/ProfileInfoTab';
import ProfileOrdersTab from '../components/profile/ProfileOrdersTab';
import ProfileNotificationsTab from '../components/profile/ProfileNotificationsTab';
import ProfileHelpTab from '../components/profile/ProfileHelpTab';
import ProfileSettingsTab from '../components/profile/ProfileSettingsTab';
import { useAuth } from '../context/AuthContext';
import { useSupportChat } from '../hooks/useSupportChat';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/pages/Profile.css';

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
    <div className="profile-page">
      <div className="pf-page-wrapper">
        <div className="pf-layout">
          <ProfileSidebar activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />

          <main className="pf-main-content">
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
