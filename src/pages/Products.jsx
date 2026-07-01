import LegacyPageRenderer from '../components/LegacyPageRenderer';
import productsHtml from '../legacy/products.html?raw';

export default function Products() {
  return <LegacyPageRenderer html={productsHtml} pageKey="products" />;
}
