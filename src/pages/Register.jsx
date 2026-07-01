import LegacyPageRenderer from '../components/LegacyPageRenderer';
import registerHtml from '../legacy/register.html?raw';

export default function Register() {
  return <LegacyPageRenderer html={registerHtml} pageKey="register" />;
}
