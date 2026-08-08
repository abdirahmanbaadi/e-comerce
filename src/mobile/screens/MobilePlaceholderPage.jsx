import MobileBottomNav from '../MobileBottomNav';

export default function MobilePlaceholderPage({ title, subtitle }) {
  return (
    <div className="mmf-pwa flex min-h-[100dvh] flex-col bg-[#fff7ed] pb-[calc(8.5rem+env(safe-area-inset-bottom))] font-sans text-[#2f241a]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm ring-1 ring-[#eadfce]">
          MMF
        </div>
        <h1 className="m-0 text-2xl font-black">{title}</h1>
        <p className="mt-2 max-w-xs text-[0.9rem] font-semibold leading-relaxed text-[#7f6b57]">
          {subtitle || 'Send this screen design next and I will build it to match.'}
        </p>
      </main>
      <MobileBottomNav />
    </div>
  );
}
