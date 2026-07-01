import LegacyPageRenderer from '../components/LegacyPageRenderer';
import homeHtml from '../legacy/home.html?raw';

export default function Home() {
  return <LegacyPageRenderer html={homeHtml} pageKey="home" />;
}
