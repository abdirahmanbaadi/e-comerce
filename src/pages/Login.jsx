import LegacyPageRenderer from '../components/LegacyPageRenderer';
import loginHtml from '../legacy/login.html?raw';

export default function Login() {
  return <LegacyPageRenderer html={loginHtml} pageKey="login" />;
}
