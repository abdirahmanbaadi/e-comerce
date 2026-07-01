import LegacyPageRenderer from '../components/LegacyPageRenderer';
import checkoutHtml from '../legacy/checkout.html?raw';

export default function Checkout() {
  return <LegacyPageRenderer html={checkoutHtml} pageKey="checkout" />;
}
