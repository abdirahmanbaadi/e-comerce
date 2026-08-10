import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { productImage } from '../../utils/format';
import {
  getNotificationListText,
  getNotificationProductImage,
  getNotificationTitle,
  getNotificationTypeTone,
} from '../../utils/notificationTypes';
import MobileNotificationDetailSheet from '../MobileNotificationDetailSheet';

export default function MobileNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications({
    enabled: Boolean(user?.isLoggedIn),
    pollMs: 30000,
  });
  const [active, setActive] = useState(null);

  const openItem = async (item) => {
    setActive(item);
    if (item?.unread && item?.id) {
      await markRead(item.id);
    }
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] font-sans text-[#111111]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md">
        <header className="sticky top-0 z-20 border-b border-[#f0e9df] bg-[#fff7ed] px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
              aria-label="Back"
            >
              <i className="fa-solid fa-chevron-left text-[0.85rem]" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[1.1rem] font-black text-[#2f241a]">Notifications</h1>
              <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#8b8178]">
                {!user?.isLoggedIn
                  ? 'Sign in to see updates'
                  : unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'All caught up'}
              </p>
            </div>
            {user?.isLoggedIn && unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="shrink-0 border-0 bg-transparent px-1 text-[0.74rem] font-black text-[#8a5a33]"
              >
                Mark all
              </button>
            ) : (
              <span className="h-10 w-10 shrink-0" aria-hidden="true" />
            )}
          </div>
        </header>

        <main className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3">
          {!user?.isLoggedIn ? (
            <div className="px-2 py-16 text-center">
              <i className="fa-regular fa-bell mb-4 text-4xl text-[#d8c8b6]" />
              <h2 className="m-0 text-[1.15rem] font-black text-[#1c140e]">Sign in for notifications</h2>
              <p className="mx-auto mb-0 mt-2 max-w-xs text-[0.85rem] font-semibold leading-relaxed text-[#8b8178]">
                Order updates, offers, and delivery alerts appear here when you are signed in.
              </p>
              <button
                type="button"
                onClick={() => navigate('/app/login', { state: { from: '/app/notifications' } })}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border-0 bg-[#6b4228] px-6 text-[0.86rem] font-black text-white"
              >
                Sign in
              </button>
            </div>
          ) : null}

          {user?.isLoggedIn && loading && items.length === 0 ? (
            <p className="mb-0 mt-10 text-center text-[0.86rem] font-semibold text-[#8b8178]">
              Loading notifications…
            </p>
          ) : null}

          {user?.isLoggedIn && error ? (
            <div className="mb-3 rounded-2xl bg-[#fff1e8] px-3.5 py-3 text-center">
              <p className="mb-2 mt-0 text-[0.8rem] font-semibold text-[#9a5b12]">{error}</p>
              <button
                type="button"
                onClick={() => refresh()}
                className="rounded-full border-0 bg-[#2f6b45] px-4 py-2 text-[0.78rem] font-black text-white"
              >
                Retry
              </button>
            </div>
          ) : null}

          {user?.isLoggedIn && !loading && !error && items.length === 0 ? (
            <p className="mb-0 mt-10 text-center text-[0.86rem] font-semibold text-[#8b8178]">
              No notifications yet. Order and delivery updates will show up here.
            </p>
          ) : null}

          {user?.isLoggedIn ? (
            <ul className="m-0 list-none space-y-2 p-0">
              {items.map((item) => {
                const meta = getNotificationTypeTone(item.type);
                const title = getNotificationTitle(item);
                const preview = getNotificationListText(item);
                const thumbSrc = getNotificationProductImage(item);
                const thumb = thumbSrc ? productImage(thumbSrc) : '';
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full items-start gap-3 rounded-[16px] border-0 px-3 py-2.5 text-left shadow-sm ring-1 ${
                        item.unread ? 'bg-white ring-[#eadfce]' : 'bg-[#fffaf3] ring-[#f0e9df]'
                      }`}
                    >
                      {thumb ? (
                        <span className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-[#efe6da] ring-1 ring-[#eadfce]">
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white ${meta.tone}`}
                          >
                            <i className={`${meta.iconStyle} ${meta.icon} text-[0.5rem]`} />
                          </span>
                        </span>
                      ) : (
                        <span
                          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${meta.tone}`}
                        >
                          <i className={`${meta.iconStyle} ${meta.icon} text-[0.95rem]`} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <strong className="block text-[0.86rem] font-black leading-snug text-[#111111]">
                            {title}
                          </strong>
                          {item.unread ? (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c45c4a]" />
                          ) : null}
                        </span>
                        <small className="mt-0.5 line-clamp-2 block text-[0.74rem] font-semibold leading-snug text-[#8b8178]">
                          {preview}
                        </small>
                        <small className="mt-1.5 block text-[0.66rem] font-semibold text-[#b0a498]">
                          {item.time}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </main>
      </div>

      <MobileNotificationDetailSheet
        open={Boolean(active)}
        item={active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
