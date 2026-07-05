import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { apiUrl } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/pages/Home.css';

const DEFAULT_HERO = {
  smallTitle: 'Premium Furniture Collection',
  title: 'Elevate Your Home\nwith Modern Comfort',
  description:
    'Discover beautifully crafted furniture designed for stylish homes in Mogadishu — elegant designs, trusted quality, secure mobile money payment, and fast delivery.',
  ctaText: 'Explore Products',
  ctaLink: '/products',
  image: '/hero1.jpeg',
};

export default function Home() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { addToCart, syncFromStorage: syncCart } = useCart();
  const { products } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [banners, setBanners] = useState([]);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  useEffect(() => {
    fetch(apiUrl('/api/cms'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cms) {
          if (data.cms.hero) setHero({ ...DEFAULT_HERO, ...data.cms.hero });
          setBanners((data.cms.banners || []).filter((b) => b.active));
          setPromotions((data.cms.promotions || []).filter((p) => p.active));
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
    <div className="home-page">
      <MainNavbar />

      <section
        className="hero-section"
        style={hero.image ? { backgroundImage: `linear-gradient(rgba(7,61,53,0.55), rgba(7,61,53,0.55)), url(${hero.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="container">
          <div className="hero-content">
            <span className="hero-small-title">{hero.smallTitle}</span>

            <h1>
              {(hero.title || '').split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p>{hero.description}</p>

            <Link to={hero.ctaLink || '/products'} className="btn-shop">
              <i className="fa-solid fa-bag-shopping" />
              {hero.ctaText || 'Explore Products'}
            </Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="container py-4">
          <div className="row g-3">
            {banners.slice(0, 3).map((banner) => (
              <div key={banner.id} className="col-md-4">
                <Link to={banner.link || '/products'} className="text-decoration-none">
                  <div className="p-3 rounded-4 bg-white shadow-sm h-100">
                    {banner.image && (
                      <img
                        src={banner.image.startsWith('/') ? banner.image : `/${banner.image}`}
                        alt={banner.title}
                        className="w-100 rounded-3 mb-2"
                        style={{ maxHeight: 120, objectFit: 'cover' }}
                      />
                    )}
                    <h4 className="text-success mb-1">{banner.title}</h4>
                    <p className="text-muted mb-0 small">{banner.subtitle}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {promotions.length > 0 && (
        <section className="container py-3">
          <div className="row g-3">
            {promotions.slice(0, 2).map((promo) => (
              <div key={promo.id || promo.code} className="col-md-6">
                <div className="p-4 rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #073D35, #0a5c4d)' }}>
                  <h4 className="mb-2">{promo.description || promo.code}</h4>
                  <p className="mb-3 small opacity-75">{promo.subtitle || 'Use this code at checkout'}</p>
                  {promo.code && (
                    <span className="badge bg-light text-success px-3 py-2">Code: {promo.code}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <main id="products-section" className="container products-section">
        <div className="section-top">
          <span className="section-label">Curated for Your Home</span>

          <h2 className="section-title">Featured Furniture Pieces</h2>

          <p className="section-desc">
            Discover selected furniture pieces crafted for modern homes in Mogadishu. View product
            details, prices, ratings, and add your favorite items to the cart.
          </p>
        </div>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-4">
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
