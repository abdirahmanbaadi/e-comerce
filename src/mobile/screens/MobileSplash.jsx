import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SPLASH_SEEN_KEY = 'mmf_pwa_splash_seen';
const SPLASH_SRC = '/app/mmf-splash-hero.jpg?v=6';
const TITLE = 'Mogadishu';
const SUBTITLE = 'Modern Furniture';
/** Letter-by-letter brand reveal total (~3s). */
const FLASH_MS = 3000;
const LETTER_STAGGER_MS = 90;
const SUB_DELAY_MS = TITLE.length * LETTER_STAGGER_MS + 120;

function markSplashSeen() {
  try {
    localStorage.setItem(SPLASH_SEEN_KEY, '1');
    sessionStorage.removeItem(SPLASH_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSeenMobileSplash() {
  try {
    if (localStorage.getItem(SPLASH_SEEN_KEY) === '1') return true;
    if (sessionStorage.getItem(SPLASH_SEEN_KEY) === '1') {
      localStorage.setItem(SPLASH_SEEN_KEY, '1');
      sessionStorage.removeItem(SPLASH_SEEN_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Letter-by-letter brand reveal on white — Mogadishu (large) then Modern Furniture. */
function LogoFlash({ onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const holdMs = reduceMotion ? 600 : FLASH_MS - 280;
    const doneMs = reduceMotion ? 700 : FLASH_MS;

    const exitTimer = window.setTimeout(() => setExiting(true), holdMs);
    const doneTimer = window.setTimeout(() => onDone?.(), doneMs);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`mmf-brand-reveal mmf-pwa flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-white px-6 ${
        exiting ? 'is-exiting' : ''
      }`}
    >
      <div className="mmf-brand-reveal__stack flex max-w-[94vw] flex-col items-center text-center">
        <h1
          className="m-0 flex flex-wrap justify-center font-display text-[clamp(3.25rem,14vw,5.25rem)] font-bold leading-[0.95] tracking-tight text-[#073D35]"
          aria-label={TITLE}
        >
          {TITLE.split('').map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="mmf-brand-reveal__letter"
              style={{ animationDelay: `${index * LETTER_STAGGER_MS}ms` }}
            >
              {char}
            </span>
          ))}
        </h1>
        <p
          className="mmf-brand-reveal__sub mb-0 mt-4 font-sans text-[clamp(0.85rem,3.2vw,1.1rem)] font-extrabold uppercase tracking-[0.22em] text-[#8a6a2a]"
          style={{ animationDelay: `${SUB_DELAY_MS}ms` }}
        >
          {SUBTITLE}
        </p>
      </div>
    </div>
  );
}

/** First launch: full splash + Get Started. Later launches: logo reveal → Home. */
export default function MobileSplash() {
  const navigate = useNavigate();
  const [mode] = useState(() => (hasSeenMobileSplash() ? 'flash' : 'onboard'));

  const goHome = () => {
    navigate('/app/home', { replace: true });
  };

  const continueApp = () => {
    markSplashSeen();
    goHome();
  };

  if (mode === 'flash') {
    return <LogoFlash onDone={goHome} />;
  }

  return (
    <div className="mmf-pwa flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f3eee6] px-4 py-5">
      <div className="relative aspect-[9/16] h-[min(94dvh,780px)] overflow-hidden rounded-[28px] shadow-[0_22px_70px_rgba(59,45,35,0.16)]">
        <img
          src={SPLASH_SRC}
          alt="Mogadishu Modern Furniture"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
        />

        <div className="relative z-[1] flex h-full flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="flex-1" />
          <button
            type="button"
            onClick={continueApp}
            className="flex min-h-[54px] w-full items-center justify-center rounded-full border-0 bg-[#073D35] px-8 text-[0.95rem] font-semibold text-white shadow-[0_10px_28px_rgba(7,61,53,0.28)]"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
