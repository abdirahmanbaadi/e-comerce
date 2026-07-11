import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { ProductCard } from '../features/products/StoreProducts';
import ProductModal from '../features/products/StoreProducts';
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

function heroBackgroundStyle(image) {
  const url = productImage(image || DEFAULT_HERO.image);
  return {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08)), url("${url}")`,
  };
}

export default function Home() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { addToCart, syncFromStorage: syncCart } = useCart();
  const { products } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hero, setHero] = useState(DEFAULT_HERO);

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
        }
      })
      .catch(() => {});
  }, []);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.status !== 'Inactive'),
    [products]
  );

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

      <main id="products-section" className="container pb-14 pt-8 md:pt-10">
        <div className="mx-auto mb-8 max-w-[760px] text-center md:mb-10">
          <span className="mb-2.5 inline-block text-[0.76rem] font-extrabold uppercase tracking-[3px] text-gold">
            Curated for Your Home
          </span>

          <h2 className="mb-3 font-display text-[2.25rem] font-bold tracking-tight text-deepGreen md:text-[2.9rem]">
            Featured Furniture Pieces
          </h2>

          <p className="mx-auto text-[0.98rem] leading-[1.8] text-[#5f5f5f]">
            Discover selected furniture pieces crafted for modern homes in Mogadishu. View product
            details, prices, ratings, and add your favorite items to the cart.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={openProduct}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </main>

      <ProductModal isOpen={modalOpen} product={selectedProduct} onClose={closeProduct} />
    </div>
  );
}
