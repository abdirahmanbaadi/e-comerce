import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productImage } from '../../utils/format';
import MobileNotificationDetailSheet from '../MobileNotificationDetailSheet';
import { getNotificationIcon, MOCK_NOTIFICATIONS } from '../mockNotifications';

export default function MobileNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() =>
    MOCK_NOTIFICATIONS.map((n) => ({ ...n }))
  );
  const [active, setActive] = useState(null);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);

  const openItem = (item) => {
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setActive(item);
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
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
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
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
          <p className="mb-2.5 mt-0 text-[0.72rem] font-bold text-[#9a5b12]">
            Preview data — sample notifications for UI testing
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {items.map((item) => {
              const meta = getNotificationIcon(item.type);
              const thumb = item.productImage ? productImage(item.productImage) : '';
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={`flex w-full items-start gap-3 rounded-[16px] border-0 px-3 py-2.5 text-left shadow-sm ring-1 ${
                      item.unread
                        ? 'bg-white ring-[#eadfce]'
                        : 'bg-[#fffaf3] ring-[#f0e9df]'
                    }`}
                  >
                    {thumb ? (
                      <span className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-[#efe6da] ring-1 ring-[#eadfce]">
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
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
                          {item.title}
                        </strong>
                        {item.unread ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c45c4a]" />
                        ) : null}
                      </span>
                      <small className="mt-0.5 line-clamp-2 block text-[0.74rem] font-semibold leading-snug text-[#8b8178]">
                        {item.desc}
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
