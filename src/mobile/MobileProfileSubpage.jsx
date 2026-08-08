import { useNavigate } from 'react-router-dom';

/** Shared chrome for profile sub-pages (back + title + optional right action). */
export default function MobileProfileSubpage({
  title,
  children,
  footer = null,
  rightAction = null,
  backTo = '/app/profile',
  onBack = null,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(backTo);
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#f7f2eb] font-sans text-[#111111]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#eadfce] bg-[#f7f2eb]/95 px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))] backdrop-blur">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[0.85rem]" />
          </button>
          <h1 className="m-0 min-w-0 flex-1 truncate text-[1.05rem] font-black text-[#2f241a]">{title}</h1>
          {rightAction ? (
            <div className="shrink-0">{rightAction}</div>
          ) : (
            <span className="h-10 w-10 shrink-0" aria-hidden="true" />
          )}
        </header>
        <main className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">{children}</main>
        {footer}
      </div>
    </div>
  );
}

