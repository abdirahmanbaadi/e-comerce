import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationDetailText,
  getNotificationListText,
  getNotificationOrderId,
  getNotificationTitle,
  getNotificationTypeTone,
} from '../../../utils/notificationTypes';
import { useSheetDrag } from '../../useSheetDrag';
import { useDriverContext } from '../DriverShell';

function driverCta(item) {
  const orderId = getNotificationOrderId(item);
  if (orderId) {
    return {
      label: 'View delivery',
      path: `/app/driver/jobs/${encodeURIComponent(orderId)}`,
    };
  }
  return {
    label: 'Open Deliveries',
    path: '/app/driver/jobs',
  };
}

function DriverNotificationDetailSheet({ open, item, onClose }) {
  const navigate = useNavigate();
  const { sheetStyle, handleProps } = useSheetDrag({ open, onClose });

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !item) return null;

  const meta = getNotificationTypeTone(item.type);
  const title = getNotificationTitle(item);
  const detailText = getNotificationDetailText(item);
  const orderId = getNotificationOrderId(item);
  const action = driverCta(item);

  const goAction = () => {
    onClose?.();
    navigate(action.path);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        style={sheetStyle}
      >
        <div
          className="flex cursor-grab flex-col items-center pb-1 pt-3 active:cursor-grabbing"
          {...handleProps}
          aria-label="Drag sheet"
          role="presentation"
        >
          <div className="mb-3 h-1.5 w-12 rounded-full bg-[#d8cfc4]" />
        </div>

        <div className="mb-4 flex items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
          >
            <i className={`${meta.iconStyle} ${meta.icon} text-[1.15rem]`} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[1.05rem] font-black text-[#1c140e]">{title}</h2>
            <p className="mb-0 mt-1 text-[0.75rem] font-semibold text-[#8b8178]">{item.time}</p>
          </div>
        </div>

        <p className="mb-4 mt-0 text-[0.9rem] font-medium leading-relaxed text-[#4a4038]">
          {detailText}
        </p>

        {orderId ? (
          <div className="mb-3 rounded-2xl bg-[#f7f2eb] px-3.5 py-2.5">
            <p className="mb-0.5 mt-0 text-[0.65rem] font-bold uppercase tracking-wide text-[#9a8d80]">
              Order ID
            </p>
            <p className="mb-0 truncate text-[0.82rem] font-black text-[#6b4228]">{orderId}</p>
          </div>
        ) : null}

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[0.86rem] font-black text-[#6b4228]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={goAction}
            className="flex min-h-[48px] flex-[1.35] items-center justify-center rounded-full border-0 bg-[#2f6b45] text-[0.86rem] font-black text-white"
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function DriverNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    notificationUnread,
    notificationsLoading,
    notificationsError,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
  } = useDriverContext();
  const [active, setActive] = useState(null);

  const openItem = async (item) => {
    setActive(item);
    if (item?.unread && item?.id) {
      await markNotificationRead(item.id);
    }
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
  };

  return (
    <div className="min-h-[100dvh] bg-[#fff7ed] text-[#111111]">
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
              {notificationUnread > 0 ? `${notificationUnread} unread` : 'All caught up'}
            </p>
          </div>
          {notificationUnread > 0 ? (
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
        {notificationsLoading && notifications.length === 0 ? (
          <p className="mb-0 mt-8 text-center text-[0.84rem] font-semibold text-[#8b8178]">
            Loading notifications…
          </p>
        ) : null}

        {notificationsError ? (
          <div className="mb-3 rounded-2xl bg-[#fff1e8] px-3.5 py-3 text-center">
            <p className="mb-2 mt-0 text-[0.8rem] font-semibold text-[#9a5b12]">{notificationsError}</p>
            <button
              type="button"
              onClick={() => refreshNotifications()}
              className="rounded-full border-0 bg-[#2f6b45] px-4 py-2 text-[0.78rem] font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!notificationsLoading && !notificationsError && notifications.length === 0 ? (
          <p className="mb-0 mt-10 text-center text-[0.86rem] font-semibold text-[#8b8178]">
            No notifications yet. New delivery assignments will show up here.
          </p>
        ) : null}

        <ul className="m-0 list-none space-y-2 p-0">
          {notifications.map((item) => {
            const meta = getNotificationTypeTone(item.type);
            const title = getNotificationTitle(item);
            const preview = getNotificationListText(item);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className={`flex w-full items-start gap-3 rounded-[16px] border-0 px-3 py-2.5 text-left shadow-sm ring-1 ${
                    item.unread ? 'bg-white ring-[#eadfce]' : 'bg-[#fffaf3] ring-[#f0e9df]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${meta.tone}`}
                  >
                    <i className={`${meta.iconStyle} ${meta.icon} text-[0.95rem]`} />
                  </span>
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
      </main>

      <DriverNotificationDetailSheet
        open={Boolean(active)}
        item={active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
