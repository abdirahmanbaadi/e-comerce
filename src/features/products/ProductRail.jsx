import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from './StoreProducts';

export function HomeSectionHeader({ eyebrow, title, to }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <span className="mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-[2.5px] text-gold">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="m-0 font-display text-[1.55rem] font-bold tracking-tight text-deepGreen md:text-[1.85rem]">
          {title}
        </h2>
      </div>
      <Link
        to={to}
        className="shrink-0 text-[0.84rem] font-extrabold text-deepGreen no-underline transition hover:text-gold"
      >
        View all
        <i className="fa-solid fa-arrow-right ml-1.5 text-[0.7rem]" />
      </Link>
    </div>
  );
}

export function ProductRail({ products, onOpen, onAddToCart }) {
  const scrollerRef = useRef(null);

  const scrollByCard = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('[data-rail-card]');
    const step = card ? card.getBoundingClientRect().width + 16 : 280;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (!products?.length) {
    return (
      <p className="m-0 py-6 text-center text-[0.9rem] font-medium text-[#888888]">
        No products in this section yet.
      </p>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        className="absolute -left-2 top-[42%] z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white text-deepGreen shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition hover:bg-deepGreen hover:text-white md:flex"
        aria-label="Scroll left"
      >
        <i className="fa-solid fa-chevron-left text-[0.8rem]" />
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        className="absolute -right-2 top-[42%] z-[2] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white text-deepGreen shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition hover:bg-deepGreen hover:text-white md:flex"
        aria-label="Scroll right"
      >
        <i className="fa-solid fa-chevron-right text-[0.8rem]" />
      </button>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scroll-smooth scrollbar-hide"
      >
        {products.map((product) => (
          <div
            key={product.id || product.title}
            data-rail-card
            className="w-[240px] shrink-0 sm:w-[260px]"
          >
            <ProductCard product={product} onOpen={onOpen} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}
