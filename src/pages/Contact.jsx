import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { apiUrl, fetchDeliveryDistricts } from '../utils/data';
import { formatMoney, productImage } from '../utils/format';

const CONTACT = {
  phone: '+252 61 234 5678',
  phoneHref: 'tel:+252612345678',
  whatsappHref: 'https://wa.me/252612345678',
  email: 'support@mogadishufurniture.com',
  emailHref: 'mailto:support@mogadishufurniture.com',
  address: 'Hodan District, Mogadishu, Somalia',
  hours: 'Sat – Thu, 9:00 AM – 6:00 PM',
};

const FALLBACK_FAQS = [
  {
    id: 'faq-1',
    question: 'How do I pay with EVC Plus?',
    answer:
      'Select EVC Plus at checkout and enter your registered mobile number. Payment is processed securely via Waafi.',
  },
  {
    id: 'faq-2',
    question: 'Do you deliver across Mogadishu?',
    answer:
      'Yes. We deliver to major districts in Mogadishu. Delivery fees vary by district and are shown at checkout.',
  },
  {
    id: 'faq-3',
    question: 'Can I track my order?',
    answer:
      'Yes. After placing an order you receive an Order ID. Use the Track Order page to follow delivery status.',
  },
  {
    id: 'faq-4',
    question: 'How do I pay with EVC Plus?',
    answer:
      'At checkout, enter your Somali mobile number. After you place the order, approve the EVC Plus prompt on your phone and enter your PIN. Payment is confirmed instantly via Waafi.',
  },
];

function GoldLine() {
  return (
    <div className="my-3 flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-gold/35" />
      <span className="text-[0.7rem] text-gold">✦</span>
      <span className="h-px w-10 bg-gold/35" />
    </div>
  );
}

export default function Contact() {
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    let active = true;

    fetch(apiUrl('/api/cms'))
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.success || !data.cms?.faqs?.length) return;
        setFaqs([...data.cms.faqs].sort((a, b) => (a.order || 0) - (b.order || 0)));
      })
      .catch(() => {});

    fetchDeliveryDistricts()
      .then((list) => {
        if (active) setDistricts(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const heroImage = productImage('/product-images/emerald-luxe-dining-set-main.jpeg.jpeg');

  return (
    <div className="min-h-screen bg-softBg font-sans text-[#111111]">
      <StoreNavbar />

      <main className="container py-8 md:py-12">
        {/* Hero card — same family as Track Order */}
        <div className="mb-8 overflow-hidden rounded-[28px] border border-gold/20 bg-base shadow-[0_20px_50px_rgba(7,61,53,0.1)]">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-gold/15 bg-[linear-gradient(180deg,#FAF8F2_0%,#F4EFE6_100%)] px-6 py-8 lg:border-b-0 lg:border-r">
              <span className="mb-2 inline-block text-[0.72rem] font-extrabold uppercase tracking-[2.5px] text-gold">
                Contact Us
              </span>
              <h1 className="mb-0 font-display text-[2rem] font-bold text-deepGreen sm:text-[2.35rem]">
                We&apos;re Here to Help
              </h1>
              <GoldLine />
              <p className="mb-6 max-w-[440px] text-[0.88rem] leading-relaxed text-[#666666]">
                Questions about delivery, payments, or your order? Reach us during business hours across
                Mogadishu.
              </p>

              <div className="space-y-3 text-[0.88rem]">
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-center gap-3 rounded-xl bg-softBg px-4 py-3 font-semibold text-deepGreen no-underline ring-1 ring-gold/15 hover:bg-nav"
                >
                  <i className="fa-solid fa-phone text-gold" />
                  {CONTACT.phone}
                </a>
                <a
                  href={CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-softBg px-4 py-3 font-semibold text-deepGreen no-underline ring-1 ring-gold/15 hover:bg-nav"
                >
                  <i className="fa-brands fa-whatsapp text-gold" />
                  WhatsApp Us
                </a>
                <a
                  href={CONTACT.emailHref}
                  className="flex items-center gap-3 rounded-xl bg-softBg px-4 py-3 font-semibold text-deepGreen no-underline ring-1 ring-gold/15 hover:bg-nav"
                >
                  <i className="fa-solid fa-envelope text-gold" />
                  {CONTACT.email}
                </a>
                <p className="mb-0 flex items-start gap-3 px-1 py-1 text-[#5f5f5f]">
                  <i className="fa-solid fa-location-dot mt-1 text-gold" />
                  {CONTACT.address}
                </p>
                <p className="mb-0 flex items-center gap-3 px-1 text-[#666666]">
                  <i className="fa-regular fa-clock text-gold" />
                  {CONTACT.hours}
                </p>
              </div>
            </div>

            <div className="relative min-h-[240px]">
              <img src={heroImage} alt="Showroom" className="h-full min-h-[240px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-deepGreen/50 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* FAQs */}
          <section>
            <h2 className="mb-4 font-display text-[1.5rem] font-bold text-deepGreen">FAQs</h2>
            <div className="overflow-hidden rounded-2xl border border-gold/15 bg-base shadow-sm">
              {faqs.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div key={item.id || item.question} className="border-b border-gold/10 last:border-b-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-4 text-left"
                      onClick={() => setOpenFaq(open ? -1 : index)}
                    >
                      <span className="font-semibold text-deepGreen">{item.question}</span>
                      <i className={`fa-solid ${open ? 'fa-minus' : 'fa-plus'} shrink-0 text-gold`} />
                    </button>
                    {open && (
                      <div className="border-t border-gold/10 px-4 py-3 text-[0.88rem] leading-relaxed text-[#5f5f5f]">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Delivery + links */}
          <section>
            <h2 className="mb-4 font-display text-[1.5rem] font-bold text-deepGreen">Delivery Fees</h2>
            <div className="mb-6 overflow-hidden rounded-2xl border border-gold/15 bg-base shadow-sm">
              {loadingDistricts ? (
                <p className="mb-0 px-4 py-8 text-center text-[0.88rem] text-[#666666]">
                  <i className="fa-solid fa-spinner fa-spin mr-2 text-gold" />
                  Loading districts…
                </p>
              ) : (
                <ul className="m-0 divide-y divide-gold/10 p-0">
                  {districts.map((d) => (
                    <li
                      key={d.value}
                      className="flex list-none items-center justify-between px-4 py-3 text-[0.88rem]"
                    >
                      <span className="font-semibold text-deepGreen">{d.value}</span>
                      <span className="font-bold text-gold">{formatMoney(d.fee)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/profile?tab=help"
                className="inline-flex items-center gap-2 rounded-full bg-deepGreen px-4 py-2.5 text-[0.82rem] font-bold text-[#FAF8F2] no-underline hover:bg-[#052e28]"
              >
                <i className="fa-solid fa-headset" />
                Help & Support
              </Link>
              <Link
                to="/track-order"
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-base px-4 py-2.5 text-[0.82rem] font-bold text-deepGreen no-underline hover:bg-nav"
              >
                <i className="fa-solid fa-truck" />
                Track Order
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-base px-4 py-2.5 text-[0.82rem] font-bold text-deepGreen no-underline hover:bg-nav"
              >
                <i className="fa-solid fa-bag-shopping" />
                Shop
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
