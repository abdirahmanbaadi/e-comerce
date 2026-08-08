import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import ProductModal from '../features/products/StoreProducts';
import { HomeSectionHeader, ProductRail } from '../features/products/ProductRail';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { apiUrl, fetchWithTimeout } from '../utils/data';
import { productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';

const DEFAULT_HERO = {
  smallTitle: 'Premium Furniture Collection',
  title: 'Elevate Your Home\nwith Modern Comfort',
  description:
    'Discover beautifully crafted furniture designed for stylish homes in Mogadishu — elegant designs, trusted quality, secure mobile money payment, and fast delivery.',
  ctaText: 'Explore Products',
  ctaLink: '/products',
  image: '/product-images/hero1.jpeg',
};

const RAIL_LIMIT = 10;

function heroBackgroundStyle(image) {
  const url = productImage(image || DEFAULT_HERO.image);
  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), url("${url}")`,
  };
}

function PromoBannerCard({ banner }) {
  const imageUrl = productImage(banner.image);
  const link = banner.link || '/products';
  const isExternal = /^https?:\/\//i.test(link);

  const content = (
    <article className="group relative overflow-hidden rounded-2xl border border-deepGreen/8 bg-white shadow-[0_8px_30px_rgba(7,61,53,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(7,61,53,0.12)]">
      <div className="grid min-h-[180px] md:grid-cols-12">
        <div
          className="min-h-[140px] bg-cover bg-center md:col-span-5"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
        <div className="flex flex-col justify-center p-5 md:col-span-7 md:p-6">
          <span className="mb-2 text-[0.72rem] font-extrabold uppercase tracking-[2px] text-gold">Special Offer</span>
          <h3 className="mb-2 font-display text-[1.45rem] font-bold leading-tight text-deepGreen md:text-[1.75rem]">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="mb-4 text-[0.92rem] leading-relaxed text-[#5f5f5f]">{banner.subtitle}</p>
          )}
          <span className="inline-flex w-fit items-center gap-2 rounded-md bg-btnDark px-4 py-2 text-[0.82rem] font-extrabold text-white transition group-hover:bg-[#111]">
            Shop now
            <i className="fa-solid fa-arrow-right text-[0.75rem]" />
          </span>
        </div>
      </div>
    </article>
  );

  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="block no-underline">
        {content}
      </a>
    );
  }

  return (
    <Link to={link} className="block no-underline">
      {content}
    </Link>
  );
}

export default function Home() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { addToCart, syncFromStorage: syncCart } = useCart();
  const { products } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  useEffect(() => {
    fetchWithTimeout(apiUrl('/api/cms'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cms) {
          if (data.cms.hero) {
            const cmsHero = data.cms.hero;
            setHero({
              ...DEFAULT_HERO,
              ...cmsHero,
              image: cmsHero.image ? productImage(cmsHero.image) : DEFAULT_HERO.image,
            });
          }
          if (Array.isArray(data.cms.banners)) {
            setBanners(
              data.cms.banners
                .filter((b) => b.active !== false)
                .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeProducts = useMemo(
    () => (products || []).filter((p) => p.status !== 'Inactive'),
    [products]
  );

  const popular = useMemo(() => {
    const byPopularity = [...activeProducts].sort(
      (a, b) => Number(b.popularity || 0) - Number(a.popularity || 0)
    );
    return (byPopularity.length ? byPopularity : activeProducts).slice(0, RAIL_LIMIT);
  }, [activeProducts]);

  const newArrivals = useMemo(
    () => [...activeProducts].slice(-RAIL_LIMIT).reverse(),
    [activeProducts]
  );

  const bestSellers = useMemo(
    () =>
      [...activeProducts]
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .slice(0, RAIL_LIMIT),
    [activeProducts]
  );

  const recommended = useMemo(() => {
    const deals = activeProducts.filter((p) => p.discount || p.oldPrice).slice(0, RAIL_LIMIT);
    return deals.length ? deals : popular;
  }, [activeProducts, popular]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeProduct = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product, event) => {
    event?.stopPropagation();
    if (product.stock === 'out-of-stock') {
      showTopFloatNotification('This product is out of stock!', 'danger');
      return;
    }
    const added = addToCart(product, 1);
    if (added) {
      showTopFloatNotification('1 item added to cart!');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-base font-sans text-[#111111]">
      <StoreNavbar />

      <section
        className="flex min-h-[50vh] items-center bg-cover bg-center bg-no-repeat py-12 md:min-h-[58vh] md:py-16"
        style={heroBackgroundStyle(hero.image)}
      >
        <div className="container">
          <div className="max-w-[650px]">
            <span className="mb-3.5 inline-block text-[0.78rem] font-extrabold uppercase tracking-[3px] text-gold">
              {hero.smallTitle}
            </span>

            <h1 className="mb-5 font-display text-[2.75rem] font-bold leading-[0.98] tracking-tight text-deepGreen md:text-[4.25rem]">
              {(hero.title || '').split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="mb-8 max-w-[570px] text-[1.02rem] font-medium leading-[1.85] text-[#3f3f3f]">
              {hero.description}
            </p>

            <Link
              to={hero.ctaLink || '/products'}
              className="inline-flex items-center gap-2.5 rounded-md bg-btnDark px-[30px] py-3 text-[0.9rem] font-extrabold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111111]"
            >
              <i className="fa-solid fa-bag-shopping" />
              {hero.ctaText || 'Explore Products'}
            </Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="container pb-2 pt-8 md:pt-10">
          <div className="mx-auto mb-6 max-w-[760px] text-center">
            <span className="mb-2 inline-block text-[0.76rem] font-extrabold uppercase tracking-[3px] text-gold">
              Limited Time
            </span>
            <h2 className="font-display text-[2rem] font-bold tracking-tight text-deepGreen md:text-[2.4rem]">
              Current Offers
            </h2>
          </div>
          <div className={`grid gap-5 ${banners.length > 1 ? 'md:grid-cols-2' : 'max-w-3xl mx-auto'}`}>
            {banners.map((banner) => (
              <PromoBannerCard key={banner.id || banner.title} banner={banner} />
            ))}
          </div>
        </section>
      )}

      <main id="products-section" className="container space-y-10 pb-16 pt-8 md:space-y-12 md:pt-10">
        <section>
          <HomeSectionHeader
            eyebrow="Trending"
            title="Popular Products"
            to="/products?sort=rating"
          />
          <ProductRail products={popular} onOpen={openProduct} onAddToCart={handleAddToCart} />
        </section>

        <section>
          <HomeSectionHeader
            eyebrow="Just in"
            title="New Arrivals"
            to="/products?sort=newest"
          />
          <ProductRail products={newArrivals} onOpen={openProduct} onAddToCart={handleAddToCart} />
        </section>

        <section>
          <HomeSectionHeader
            eyebrow="Top rated"
            title="Best Sellers"
            to="/products?sort=rating"
          />
          <ProductRail products={bestSellers} onOpen={openProduct} onAddToCart={handleAddToCart} />
        </section>

        <section>
          <HomeSectionHeader
            eyebrow="For you"
            title="Recommended"
            to="/products"
          />
          <ProductRail products={recommended} onOpen={openProduct} onAddToCart={handleAddToCart} />
        </section>
      </main>

      <ProductModal isOpen={modalOpen} product={selectedProduct} onClose={closeProduct} />
    </div>
  );
}
