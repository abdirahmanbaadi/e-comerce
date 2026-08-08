/** Shared MMF brand mark — matches web AuthBrandHeader. */
export default function MobileAuthBrand({ className = '' }) {
  return (
    <div className={`mx-auto flex w-fit max-w-full items-center justify-center gap-2.5 ${className}`}>
      <div className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-[10px] border-2 border-gold" />
        <span className="relative z-[2] font-display text-[1.35rem] font-bold tracking-tight text-gold">MF</span>
      </div>
      <div className="h-10 w-px shrink-0 bg-gold opacity-85" />
      <div className="leading-tight">
        <span className="block font-display text-[1.55rem] font-bold tracking-wide text-deepGreen">Mogadishu</span>
        <span className="mt-0.5 block font-sans text-[0.62rem] font-extrabold uppercase tracking-[2px] text-deepGreen opacity-90">
          Modern Furniture
        </span>
      </div>
    </div>
  );
}
