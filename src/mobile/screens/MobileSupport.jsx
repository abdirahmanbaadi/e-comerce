import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HELP_CATEGORIES as CATEGORIES,
  HELP_FAQS as FAQS,
  HELP_PHONE_HREF as PHONE_HREF,
  HELP_WHATSAPP_HREF as WHATSAPP_HREF,
} from '../../utils/helpCenterContent';

function FaqRow({ item, open, onToggle }) {
  return (
    <div className="border-b border-[#eceae6] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 text-[0.92rem] font-medium leading-snug text-[#111111]">{item.q}</span>
        <i
          className={`fa-solid fa-chevron-down text-[0.7rem] text-[#9a9a9a] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open ? (
        <p className="mb-4 mt-0 px-4 text-[0.86rem] font-normal leading-relaxed text-[#6b6b6b]">{item.a}</p>
      ) : null}
    </div>
  );
}

function ContactRow({ icon, iconClass, label, onClick, href }) {
  const className =
    'mb-3 flex w-full items-center gap-3.5 rounded-[18px] border border-[#e8e8e8] bg-white px-4 py-3.5 text-left no-underline last:mb-0';
  const inner = (
    <>
      <span className="mmf-contact-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#111111]">
        <i className={`${iconClass} ${icon} text-[1.05rem]`} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-[0.95rem] font-semibold text-[#111111]">{label}</span>
      <i className="fa-solid fa-chevron-right text-[0.7rem] text-[#c0c0c0]" />
    </>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export default function MobileSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/app/login', { replace: true, state: { from: '/app/profile/support' } });
    }
  }, [user, navigate]);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((item) => {
      const inCat = item.category === category;
      if (!inCat) return false;
      if (!q) return true;
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });
  }, [category, query]);

  useEffect(() => {
    setOpenFaq(null);
  }, [category, query]);

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-white font-sans text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-white px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#111111]"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[0.95rem]" />
          </button>
          <h1 className="m-0 flex-1 text-center text-[1.12rem] font-semibold tracking-tight">Help Center</h1>
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        </header>

        <main className="flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* FAQ */}
          <section className="mb-10">
            <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[0.82rem] font-semibold ${
                      active
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#dcdcdc] bg-white text-[#111111]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <label className="relative mb-4 block">
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.85rem] text-[#9a9a9a]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="h-11 w-full rounded-xl border-0 bg-[#f5f5f5] pl-10 pr-4 text-[0.88rem] font-medium text-[#111111] outline-none placeholder:text-[#9a9a9a]"
              />
            </label>

            <div className="overflow-hidden rounded-[20px] border border-[#eceae6] bg-white">
              {filteredFaqs.length === 0 ? (
                <p className="m-0 px-4 py-8 text-center text-[0.88rem] font-medium text-[#8a8a8a]">
                  No questions match your search.
                </p>
              ) : (
                filteredFaqs.map((item) => (
                  <FaqRow
                    key={item.id}
                    item={item}
                    open={openFaq === item.id}
                    onToggle={() => setOpenFaq((prev) => (prev === item.id ? null : item.id))}
                  />
                ))
              )}
            </div>
          </section>

          {/* Contact Us */}
          <section className="mb-4">
            <h2 className="mb-3 mt-0 text-[1.05rem] font-semibold tracking-tight text-[#111111]">Contact Us</h2>

            <ContactRow
              icon="fa-headset"
              iconClass="fa-solid"
              label="Customer Service"
              onClick={() => navigate('/app/profile/support/chat')}
            />
            <ContactRow
              icon="fa-whatsapp"
              iconClass="fa-brands"
              label="WhatsApp"
              href={WHATSAPP_HREF}
            />
            <ContactRow icon="fa-phone" iconClass="fa-solid" label="Phone" href={PHONE_HREF} />
          </section>
        </main>
      </div>
    </div>
  );
}
