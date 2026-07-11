import { Link } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useProducts } from '../context/ProductsContext';
import { productImage } from '../utils/format';

const CARD_ICONS = {
  payment: 'fa-credit-card',
  delivery: 'fa-truck-fast',
  track: 'fa-location-crosshairs',
};

const WHY_US = [
  {
    icon: 'fa-couch',
    title: 'Premium Quality',
    text: 'Quality furniture for comfort, durability, and modern Somali homes.',
  },
  {
    icon: CARD_ICONS.payment,
    title: 'Secure Payments',
    text: 'Pay with EVC Plus via Waafi or Cash on Delivery at checkout.',
  },
  {
    icon: CARD_ICONS.delivery,
    title: 'Fast Delivery',
    text: 'Delivery across Mogadishu districts with fees shown at checkout.',
  },
  {
    icon: 'fa-headset',
    title: 'Dedicated Support',
    text: 'Reach our team through Help & Support whenever you need help.',
  },
  {
    icon: CARD_ICONS.track,
    title: 'Track Your Order',
    text: 'See real-time delivery status anytime using your Order ID.',
  },
];

const STEPS = [
  {
    step: '01',
    icon: 'fa-bag-shopping',
    title: 'Browse & Shop',
    text: 'Explore living room, bedroom, dining, and office collections — add favorites to your cart.',
  },
  {
    step: '02',
    icon: CARD_ICONS.payment,
    title: 'Pay Your Way',
    text: 'Checkout with EVC Plus or Cash on Delivery. Apply promo codes for extra savings.',
  },
  {
    step: '03',
    icon: CARD_ICONS.track,
    title: 'Track Your Order',
    text: 'Use your Order ID on our Track Order page to follow delivery status in real time.',
  },
  {
    step: '04',
    icon: CARD_ICONS.delivery,
    title: 'Delivered to You',
    text: 'Your furniture arrives at your doorstep across Mogadishu — fast and handled with care.',
  },
];

const VALUES = [
  'Honest pricing with no hidden fees',
  'Quality pieces for everyday living',
  'Trusted mobile money payments',
  'Customer-first delivery experience',
  'Real-time order tracking with your Order ID',
];

function GoldLine({ compact = false }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${compact ? 'my-2' : 'my-4'}`}>
      <span className={`h-px bg-gold/35 ${compact ? 'w-7' : 'w-10'}`} />
      <span className={`text-gold ${compact ? 'text-[0.6rem]' : 'text-[0.7rem]'}`}>✦</span>
      <span className={`h-px bg-gold/35 ${compact ? 'w-7' : 'w-10'}`} />
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignClass = align === 'left' ? 'text-left mx-0' : 'text-center mx-auto';

  return (
    <div className={`mb-8 max-w-[680px] ${alignClass}`}>
      {eyebrow && (
        <span className="mb-2.5 inline-block text-[0.76rem] font-extrabold uppercase tracking-[3px] text-gold">
          {eyebrow}
        </span>
      )}
      <h2 className="mb-3 font-display text-[2rem] font-bold tracking-tight text-deepGreen md:text-[2.5rem]">
        {title}
      </h2>
      {description && (
        <p className="text-[0.98rem] leading-[1.85] text-[#5f5f5f]">{description}</p>
      )}
    </div>
  );
}

function StepCard({ step, icon, title, text, showConnector }) {
  return (
    <div className="group relative h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-10 hover:scale-[1.05]">
      <span
        className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[2px] w-0 -translate-x-1/2 rounded-full bg-gold opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-top-4 group-hover:w-12 group-hover:opacity-100"
        aria-hidden="true"
      />
      <article className="relative cursor-default rounded-2xl border border-gold/15 bg-base p-6 pt-8 shadow-[0_8px_28px_rgba(7,61,53,0.06)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-gold/35 group-hover:shadow-[0_28px_56px_rgba(7,61,53,0.16)]">
        {showConnector && (
          <span className="pointer-events-none absolute right-[-14px] top-1/2 z-[1] hidden h-px w-7 bg-gold/35 lg:block" />
        )}
        <span className="absolute -top-3.5 left-6 rounded-full border border-gold/35 bg-base px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[1px] text-[#111111] shadow-[0_4px_14px_rgba(7,61,53,0.08)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:border-gold/55 group-hover:shadow-[0_8px_20px_rgba(7,61,53,0.12)]">
          Step {step}
        </span>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-softBg ring-1 ring-gold/25 transition-all duration-500 group-hover:ring-gold/45">
          <i className={`fa-solid ${icon} text-[1.05rem] text-deepGreen`} />
        </div>
        <h3 className="mb-2 font-display text-[1.25rem] font-bold text-deepGreen">{title}</h3>
        <p className="m-0 text-[0.9rem] leading-[1.7] text-[#5f5f5f]">{text}</p>
      </article>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="group relative h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-10 hover:scale-[1.05]">
      <span
        className="pointer-events-none absolute left-1/2 top-0 z-[2] h-[2px] w-0 -translate-x-1/2 rounded-full bg-gold opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-top-4 group-hover:w-12 group-hover:opacity-100"
        aria-hidden="true"
      />
      <article className="relative flex h-full min-h-[288px] w-full cursor-pointer flex-col gap-2.5 rounded-2xl border border-gold/15 bg-base p-5 pb-6 shadow-[0_8px_28px_rgba(7,61,53,0.06)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-gold/35 group-hover:shadow-[0_28px_56px_rgba(7,61,53,0.16)]">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-softBg ring-1 ring-gold/25 transition-all duration-500 group-hover:ring-gold/45">
          <i className={`fa-solid ${icon} text-[1.05rem] text-deepGreen`} />
        </div>
        <h3 className="m-0 shrink-0 font-display text-[1.15rem] font-bold leading-snug text-deepGreen">{title}</h3>
        <p className="m-0 flex-1 text-[0.84rem] leading-[1.6] text-[#5f5f5f]">{text}</p>
      </article>
    </div>
  );
}

export default function About() {
  const { products } = useProducts();
  const activeProducts = products.filter((p) => p.status !== 'Inactive').length;
  const districtCount = 6;

  const stats = [
    { value: `${activeProducts || '20'}+`, label: 'Furniture Pieces' },
    { value: `${districtCount}+`, label: 'Delivery Districts' },
    { value: 'EVC & COD', label: 'Payment Options' },
    { value: '24/7', label: 'Order Tracking' },
  ];

  const heroImage = productImage('/product-images/ivory-luxe-living-room-set-main.jpeg.jpeg');

  return (
    <div className="overflow-x-hidden bg-base font-sans text-[#111111]">
      {/* Hero — full viewport, no scroll */}
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-softBg">
        <StoreNavbar />

        <section className="relative flex min-h-0 flex-1 items-center overflow-hidden py-4 md:py-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-deepGreen/5 blur-3xl" />

          <div className="container relative">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="max-lg:text-center">
                <span className="mb-2 inline-block text-[0.72rem] font-extrabold uppercase tracking-[3px] text-gold md:mb-2.5">
                  About Us
                </span>
                <h1 className="mb-3 font-display text-[2rem] font-bold leading-[1.05] tracking-tight text-deepGreen sm:text-[2.35rem] lg:text-[2.85rem]">
                  Crafting Comfort for Modern Mogadishu Homes
                </h1>
                <GoldLine compact />
                <p className="mx-auto mb-5 max-w-[540px] text-[0.92rem] font-medium leading-[1.75] text-[#3f3f3f] lg:mx-0 lg:text-[0.98rem]">
                  Mogadishu Modern Furniture brings thoughtfully designed furniture to your doorstep —
                  combining elegant style, trusted quality, secure mobile payments, and reliable delivery
                  across the city.
                </p>
                <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 rounded-md bg-deepGreen px-5 py-2.5 text-[0.88rem] font-extrabold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#052e28]"
                  >
                    <i className="fa-solid fa-bag-shopping" />
                    Shop Collection
                  </Link>
                  <Link
                    to="/track-order"
                    className="inline-flex items-center gap-2 rounded-md border border-deepGreen/20 bg-base px-5 py-2.5 text-[0.88rem] font-extrabold text-deepGreen no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-nav"
                  >
                    <i className="fa-solid fa-truck" />
                    Track Order
                  </Link>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[520px] lg:max-w-none">
                <div className="overflow-hidden rounded-2xl border border-gold/20 bg-base shadow-[0_18px_48px_rgba(7,61,53,0.12)]">
                  <img
                    src={heroImage}
                    alt="Modern living room furniture collection"
                    className="aspect-[4/3] max-h-[28vh] w-full object-cover sm:max-h-[32vh] lg:max-h-[min(48vh,380px)] lg:aspect-auto lg:h-[min(48vh,380px)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Stats */}
      <section className="border-y border-gold/15 bg-nav py-6">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((item) => (
              <div key={item.label} className="text-center">
                <p className="mb-0.5 font-display text-[1.65rem] font-bold text-deepGreen md:text-[1.85rem]">
                  {item.value}
                </p>
                <p className="m-0 text-[0.78rem] font-bold uppercase tracking-[1.5px] text-[#666666]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-14 md:py-16">
        <div className="container">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <SectionHeading
              align="left"
              eyebrow="Our Story"
              title="Furniture That Feels Like Home"
              description="We started with a simple idea: make quality modern furniture accessible to every household in Mogadishu — without complicated shopping or unreliable delivery."
            />

            <div className="space-y-5 text-[0.98rem] leading-[1.85] text-[#5f5f5f]">
              <p className="m-0">
                From living room sets and bedroom essentials to dining tables and office chairs, every
                piece in our catalog is chosen for comfort, durability, and timeless design that fits
                Somali homes.
              </p>
              <p className="m-0">
                Our online store lets you browse products, read reviews, apply promo codes, and pay with
                EVC Plus or Cash on Delivery — all from your phone. Once you order, track delivery in
                real time until your furniture arrives at your door.
              </p>

              <ul className="m-0 grid gap-2.5 p-0 pt-1">
                {VALUES.map((value) => (
                  <li
                    key={value}
                    className="group flex list-none cursor-default items-start gap-3 rounded-xl bg-softBg px-4 py-3 ring-1 ring-gold/15 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-2 hover:bg-nav hover:shadow-[0_6px_18px_rgba(7,61,53,0.07)] hover:ring-gold/35"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-deepGreen text-[0.55rem] text-white transition-transform duration-300 group-hover:scale-110">
                      <i className="fa-solid fa-check" />
                    </span>
                    <span className="text-[0.92rem] font-semibold text-deepGreen transition-colors duration-300 group-hover:text-[#052e28]">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-softBg py-14 md:py-16">
        <div className="container max-w-[1380px] px-4 md:px-6">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Built Around Trust & Convenience"
            description="Everything we do is designed to make furnishing your home simple, secure, and stress-free."
          />

          <div className="grid grid-cols-1 items-stretch gap-3 overflow-visible pb-4 pt-9 min-[640px]:grid-cols-2 lg:grid-cols-5">
            {WHY_US.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 md:py-16">
        <div className="container">
          <SectionHeading
            eyebrow="How It Works"
            title="From Browse to Doorstep"
            description="Four simple steps to transform your space with furniture you'll love."
          />

          <div className="grid gap-5 overflow-visible pb-4 pt-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {STEPS.map((item, index) => (
              <StepCard
                key={item.step}
                {...item}
                showConnector={index < STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — horizontal ribbon (distinct from Track Order card) */}
      <section className="border-t border-gold/15 bg-nav pb-8 pt-6 md:pb-10">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-base px-5 shadow-[0_6px_24px_rgba(7,61,53,0.06)] sm:px-6">
            <div className="flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between sm:gap-6 sm:py-4">
              <div className="text-center sm:text-left">
                <p className="mb-1 text-[0.68rem] font-extrabold uppercase tracking-[2px] text-gold">
                  Start Shopping
                </p>
                <h2 className="mb-1 font-display text-[1.45rem] font-bold leading-tight text-deepGreen md:text-[1.6rem]">
                  Ready to furnish your home?
                </h2>
                <p className="m-0 text-[0.82rem] leading-relaxed text-[#666666]">
                  Explore our collection or reach out if you need help.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 rounded-full bg-deepGreen py-2.5 pl-4 pr-3 text-[0.82rem] font-bold text-white no-underline transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#052b25] hover:shadow-[0_8px_22px_rgba(7,61,53,0.2)]"
                >
                  Shop Collection
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-white/25">
                    <i className="fa-solid fa-arrow-right text-[0.65rem]" />
                  </span>
                </Link>
                <Link
                  to="/profile?tab=help"
                  className="group inline-flex items-center gap-2 rounded-full border border-deepGreen/15 bg-softBg py-2.5 px-4 text-[0.82rem] font-bold text-deepGreen no-underline transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-gold/40 hover:bg-nav hover:shadow-[0_8px_22px_rgba(7,61,53,0.1)]"
                >
                  <i className="fa-regular fa-circle-question text-[0.8rem] text-gold transition-transform duration-300 group-hover:scale-110" />
                  Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
