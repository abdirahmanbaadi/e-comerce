import { Link } from 'react-router-dom';

/** Temporary next step until you send the Home design */
export default function MobileHomePlaceholder() {
  return (
    <div className="mmf-pwa flex min-h-[100dvh] flex-col items-center justify-center bg-[#FAF7F1] px-6 text-center">
      <p className="m-0 font-display text-3xl font-bold text-deepGreen">MMF</p>
      <p className="mt-2 max-w-xs text-[0.9rem] font-semibold text-[#666]">
        Splash is ready. Send the next screen design (Home) and we will build it here.
      </p>
      <Link
        to="/app"
        className="mt-6 text-[0.85rem] font-bold text-teal no-underline"
      >
        ← Back to splash
      </Link>
    </div>
  );
}
