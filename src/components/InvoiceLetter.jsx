import { formatMoney } from '../utils/format';

export default function InvoiceLetter({ order, variant = 'full' }) {
  if (!order) return null;

  return (
    <div className={`invoice-letter invoice-letter--${variant}`} id="invoice-letter">
      <div className="invoice-letter__paper">
        <div className="invoice-letter__top-bar" />

        <header className="invoice-letter__header">
          <div className="invoice-letter__brand">
            <div className="invoice-letter__logo-mark">
              <span className="invoice-letter__logo-frame" />
              <span className="invoice-letter__logo-inner">MF</span>
            </div>
            <div className="invoice-letter__brand-divider" />
            <div className="invoice-letter__brand-text">
              <span className="invoice-letter__brand-title">Mogadishu</span>
              <span className="invoice-letter__brand-subtitle">Modern Furniture</span>
            </div>
          </div>
          <h3 className="invoice-letter__title">Invoice</h3>
        </header>

        <div className="invoice-letter__meta invoice-letter__meta--compact">
          <div className="invoice-letter__meta-card">
            <span className="invoice-letter__label">Bill To</span>
            <p className="invoice-letter__value">
              {order.customer}
              <br />
              {order.phone}
              <br />
              {order.address}
            </p>
          </div>
          <div className="invoice-letter__meta-card">
            <span className="invoice-letter__label">Invoice Details</span>
            <p className="invoice-letter__value">
              {order.trackingCode}
              <br />
              {order.date}
            </p>
          </div>
        </div>

        <div className="invoice-letter__table-wrap">
          <table className="invoice-letter__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.price)}</td>
                  <td>{formatMoney(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-letter__totals">
          <div className="invoice-letter__totals-row">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="invoice-letter__totals-row">
              <span>Discount</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
          )}
          <div className="invoice-letter__totals-row">
            <span>Delivery</span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </div>
          <div className="invoice-letter__totals-row invoice-letter__totals-row--grand">
            <span>Total</span>
            <span>{order.total}</span>
          </div>
        </div>

        <footer className="invoice-letter__footer">
          Thank you for shopping with Mogadishu Modern Furniture
        </footer>
      </div>
    </div>
  );
}
