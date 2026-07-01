import LegacyPageRenderer from '../components/LegacyPageRenderer';
import adminHtml from '../legacy/admin.html?raw';

export default function Admin() {
  return <LegacyPageRenderer html={adminHtml} pageKey="admin" />;
}
