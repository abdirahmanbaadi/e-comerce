import LegacyPageRenderer from '../components/LegacyPageRenderer';
import cartHtml from '../legacy/cart.html?raw';

export default function Cart() {
  return <LegacyPageRenderer html={cartHtml} pageKey="cart" />;
}
