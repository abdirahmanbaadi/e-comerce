import LegacyPageRenderer from '../components/LegacyPageRenderer';
import profileHtml from '../legacy/profile.html?raw';

export default function Profile() {
  return <LegacyPageRenderer html={profileHtml} pageKey="profile" />;
}
