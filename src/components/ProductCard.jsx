import { formatMoney, productImage } from '../utils/format';
import { getMaterialLabel } from '../utils/productFilters';

export default function ProductCard({
  product,
  onOpen,
  onAddToCart,
  className = 'col',
  categoryFormat = 'slash',
}) {
  const discountBadge = product.discount ? (
    <span className="discount-badge">{product.discount}</span>
  ) : null;

  const oldPrice =
    product.discount && product.oldPrice ? (
      <span className="old-price">{formatMoney(product.oldPrice)}</span>
    ) : null;

  const categoryText =
    categoryFormat === 'dot'
      ? `${product.label || product.category} • ${product.materialLabel || getMaterialLabel(product.materialType)}`
      : `${product.label || product.category} / ${product.materialLabel || getMaterialLabel(product.materialType)}`;

  return (
    <div className={className}>
      <div className="product-card" onClick={() => onOpen(product)} role="presentation">
        <div className="product-img-box">
          {discountBadge}
          <img src={productImage(product.images?.[0])} alt={product.title} />
        </div>

        <div className="product-info">
          <h3 className="product-name" title={product.title}>
            {product.title}
          </h3>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="product-category mb-0" style={{ textTransform: 'capitalize' }}>
              {categoryText}
            </div>
            <span className="rating-line">
              <i className="fa-solid fa-star" /> {product.rating}
            </span>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div className="price-wrap">
              <span className="product-price">{formatMoney(product.price)}</span>
              {oldPrice}
            </div>

            <button
              type="button"
              className="btn-card-cart"
              onClick={(e) => onAddToCart(product, e)}
              title="Add to Cart"
            >
              <i className="fa-solid fa-cart-shopping" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
