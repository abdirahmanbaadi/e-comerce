import LegacyPageRenderer from '../components/LegacyPageRenderer';
import categoriesHtml from '../legacy/categories.html?raw';

export default function Categories() {
  return <LegacyPageRenderer html={categoriesHtml} pageKey="categories" />;
}
