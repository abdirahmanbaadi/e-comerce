import { useNavigate } from 'react-router-dom';
import { getMockUnreadCount } from './mockNotifications';

/** Header right icons — notifications only (orders/wishlist live under Profile). */
export default function MobileHeaderIcons({ plain = false }) {
  const navigate = useNavigate();
  const unreadCount = getMockUnreadCount();

  return (
    <div className={`flex shrink-0 items-center ${plain ? 'gap-3' : 'gap-2.5'}`}>
      <button
        type="button"
        onClick={() => navigate('/app/notifications')}
        className={
          plain
            ? 'relative flex h-10 w-10 items-center justify-center border-0 bg-transparent text-[#3d2a1c] transition-transform active:scale-90'
            : 'relative flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#5f4630] shadow-sm ring-1 ring-[#eadfce] transition-transform active:scale-90'
        }
        aria-label="Notifications"
      >
        <i className="fa-regular fa-bell text-[1.05rem]" />
        {unreadCount > 0 ? (
          plain ? (
            <span className="absolute -right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3d2a1c] px-1 text-[0.58rem] font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#c45c4a] ring-2 ring-white" />
          )
        ) : null}
      </button>
    </div>
  );
}
