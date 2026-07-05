import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useWishlist } from '../context/WishlistContext';
import { formatMoney, productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';

export default function WishlistDropdown({ onClose }) {
  const { products } = useProducts();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const wishlistedItems = products.filter(
    (p) => wishlist[p.title] && p.status !== 'Inactive'
  );
  const itemCount = wishlistedItems.length;

  const handleAddToCart = (product) => {
    if (product.stock === 'out-of-stock') {
      showTopFloatNotification('This product is currently out of stock!', 'danger');
      return;
    }
    addToCart(product, 1);
    removeFromWishlist(product.title);
    showTopFloatNotification('1 item added to cart & removed from wishlist!', 'success');
  };

  const handleRemove = (product) => {
    removeFromWishlist(product.title);
    showTopFloatNotification('Product removed from wishlist!', 'success');
  };

  return (
    <div className="nav-dropdown nav-dropdown--wishlist" role="dialog" aria-label="Wishlist">
      <div className="nav-dropdown-head">
        <strong>Wishlist</strong>
        <span className="nav-dropdown-count">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {itemCount === 0 ? (
        <div className="nav-dropdown-empty">
          <i className="fa-regular fa-heart" style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block', opacity: 0.35 }} />
          Your wishlist is empty.
          <Link to="/products" className="nav-dropdown-footer-link" style={{ marginTop: 12 }} onClick={onClose}>
            Browse Shop
          </Link>
        </div>
      ) : (
        <>
          <div className="nav-dropdown-list" style={{ padding: '8px 10px' }}>
            {wishlistedItems.map((product) => {
              const isOutOfStock = product.stock === 'out-of-stock';
              return (
                <div key={product.id} className="nav-wishlist-item">
                  <img
                    src={productImage(product.images[0])}
                    alt={product.title}
                    className="nav-wishlist-img"
                  />
                  <div className="nav-wishlist-info">
                    <h4 className="nav-wishlist-name" title={product.title}>
                      {product.title}
                    </h4>
                    <div className="nav-wishlist-meta">
                      {product.label || product.category}
                    </div>
                    <div className="nav-wishlist-price">{formatMoney(product.price)}</div>
                  </div>
                  <div className="nav-wishlist-actions">
                    <button
                      type="button"
                      className="nav-wishlist-icon-btn nav-wishlist-icon-btn--cart"
                      title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="fa-solid fa-cart-shopping" />
                    </button>
                    <button
                      type="button"
                      className="nav-wishlist-icon-btn nav-wishlist-icon-btn--delete"
                      title="Remove from wishlist"
                      onClick={() => handleRemove(product)}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="nav-dropdown-footer">
            <Link to="/products" className="nav-dropdown-footer-link" onClick={onClose}>
              View all products
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
