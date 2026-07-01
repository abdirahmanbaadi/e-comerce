import LegacyPageRenderer from '../components/LegacyPageRenderer';
import trackOrderHtml from '../legacy/track-order.html?raw';

export default function TrackOrder() {
  return <LegacyPageRenderer html={trackOrderHtml} pageKey="track-order" />;
}
