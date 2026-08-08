import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import { formatMoney, productImage } from '../../utils/format';
import { resolveOrderStatus } from '../../utils/orderStatus';
import { MOCK_ORDERS } from '../mockOrders';
import MobileBottomNav from '../MobileBottomNav';
import MobileHeaderIcons from '../MobileHeaderIcons';
import MobileTrackSheet from '../MobileTrackSheet';

const FILTERS = [
  { value: 'all', label: 'All Orders' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out-for-delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLE = {
  processing: { label: 'Processing', className: 'bg-[#eaf2ff] text-[#2b59db]' },
  shipped: { label: 'Shipped', className: 'bg-[#fff1e6] text-[#d97706]' },
  delivered: { label: 'Delivered', className: 'bg-[#e8f7ee] text-[#087443]' },
  cancelled: { label: 'Cancelled', className: 'bg-[#fdecec] text-[#c0392b]' },
};

function countItems(order) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }
  return 1;
}

function orderImage(order, products) {
  const first = Array.isArray(order.items) ? order.items[0] : null;
  if (first?.image) return productImage(first.image);
  const title = first?.title || order.product;
  const match = (products || []).find(
    (product) =>
      product.title &&
      title &&
      (product.title.toLowerCase() === String(title).toLowerCase() ||
        String(title).toLowerCase().includes(product.title.toLowerCase()))
  );
  return productImage(match?.images?.[0] || match?.image || '');
}

function formatOrderDate(order) {
  const value = order.date || order.createdAt || order.created_at;
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return String(value);
}

function formatOrderTotal(order) {
  if (typeof order.amount === 'string' && order.amount.trim().startsWith('$')) return order.amount;
  const amount = parseFloat(String(order.amount || order.total || 0).replace(/[^0-9.]/g, '')) || 0;
  return formatMoney(amount);
}

export default function MobileOrders({ fromProfile = false } = {}) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [trackId, setTrackId] = useState('');
  const [trackError, setTrackError] = useState('');
  const [trackOpen, setTrackOpen] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState('');
  const ordersListPath = '/app/profile/orders';

  const loadOrders = useCallback(async () => {
    setOrders(MOCK_ORDERS);
    setLoading(false);
    setLoadError('');
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const status = resolveOrderStatus(order);
      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter ||
        (statusFilter === 'out-for-delivery' && status === 'shipped');
      const id = String(order.id || '').toLowerCase();
      const matchesSearch = !query || id.includes(query) || `#${id}`.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const handleTrackById = (event) => {
    event.preventDefault();
    const id = trackId.trim().replace(/^#/, '');
    if (!id) {
      setTrackError('Enter an Order ID to track.');
      return;
    }
    setTrackError('');
    setActiveTrackId(id);
    setTrackOpen(true);
  };

  return (
    <div
      className={`mmf-pwa min-h-[100dvh] bg-[#fff7ed] px-4 pt-4 font-sans text-[#111111] ${
        fromProfile
          ? 'pb-[max(2rem,env(safe-area-inset-bottom))]'
          : 'pb-[calc(8.5rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <main className="mx-auto max-w-md">
        <header className="mb-4 pt-[max(0.6rem,env(safe-area-inset-top))]">
          {fromProfile ? (
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/app/profile')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
                aria-label="Back to profile"
              >
                <i className="fa-solid fa-chevron-left text-[0.85rem]" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="m-0 text-[1.1rem] font-black text-[#2f241a]">My Orders</h1>
                <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#8b8178]">
                  Manage · track by Order ID
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#3d2a1c] shadow-sm"
                aria-label="Search orders"
              >
                <i className="fa-solid fa-magnifying-glass text-[0.95rem]" />
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="m-0 font-display text-[2rem] font-semibold leading-none text-[#3d2a1c]">My Orders</h1>
                <p className="mb-0 mt-1.5 text-[0.82rem] font-semibold text-[#8b8178]">
                  Manage orders · track by Order ID
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => setSearchOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-[#3d2a1c]"
                  aria-label="Search orders"
                >
                  <i className="fa-solid fa-magnifying-glass text-[1.02rem]" />
                </button>
                <MobileHeaderIcons plain />
              </div>
            </div>
          )}

          <form onSubmit={handleTrackById} className="mb-4">
            <label className="mb-1.5 block text-[0.72rem] font-black uppercase tracking-wide text-[#8b8178]">
              Track order
            </label>
            <div className="flex gap-2">
              <input
                value={trackId}
                onChange={(event) => {
                  setTrackId(event.target.value);
                  if (trackError) setTrackError('');
                }}
                placeholder="Enter Order ID"
                className="h-11 min-w-0 flex-1 rounded-2xl border-0 bg-white px-4 text-[0.82rem] font-semibold text-[#3c2c1f] shadow-sm outline-none ring-1 ring-[#eadfce] placeholder:text-[#9b8876]"
                autoComplete="off"
                inputMode="text"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full border-0 bg-[#6b4228] px-4 text-[0.8rem] font-black text-white"
              >
                Track
              </button>
            </div>
            {trackError ? (
              <p className="mb-0 mt-1.5 text-[0.74rem] font-bold text-[#c0392b]">{trackError}</p>
            ) : null}
          </form>

          {searchOpen ? (
            <label className="relative mb-4 block">
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b8876]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
                placeholder="Filter list by Order ID"
                className="h-11 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-[0.82rem] font-semibold text-[#3c2c1f] shadow-sm outline-none ring-1 ring-[#eadfce] placeholder:text-[#9b8876]"
              />
            </label>
          ) : null}

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`shrink-0 border-0 text-[0.84rem] font-bold ${
                  statusFilter === filter.value
                    ? 'rounded-full bg-[#3d2a1c] px-4 py-2 text-white'
                    : 'bg-transparent px-0 py-2 text-[#2f241a]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <p className="py-16 text-center text-[0.86rem] font-semibold text-[#8b8178]">Loading orders...</p>
        ) : loadError ? (
          <section className="rounded-[22px] bg-white px-5 py-8 text-center shadow-sm ring-1 ring-[#eee7df]">
            <p className="m-0 text-[0.86rem] font-semibold text-[#8b8178]">{loadError}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="mt-4 rounded-full border-0 bg-[#111111] px-5 py-2.5 text-[0.78rem] font-black text-white"
            >
              Try again
            </button>
          </section>
        ) : !filteredOrders.length ? (
          <section className="rounded-[26px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eee7df]">
            <i className="fa-solid fa-cube mb-4 text-4xl text-[#d8c8b6]" />
            <h2 className="m-0 text-[1.2rem] font-black">No orders found</h2>
            <p className="mx-auto mb-0 mt-2 max-w-xs text-[0.85rem] font-semibold leading-relaxed text-[#8b8178]">
              {orders.length ? 'Try another filter or search.' : 'When you place an order, it will show up here.'}
            </p>
            <Link
              to="/app/shop"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#111111] px-6 text-[0.86rem] font-black text-white no-underline"
            >
              Go to Shop
            </Link>
          </section>
        ) : (
          <section className="space-y-2.5">
            {filteredOrders.map((order) => {
              const status = resolveOrderStatus(order);
              const badge = STATUS_STYLE[status] || STATUS_STYLE.processing;
              const items = countItems(order);
              const image = orderImage(order, products);

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() =>
                    navigate(`/app/orders/${encodeURIComponent(order.id)}`, {
                      state: { from: ordersListPath },
                    })
                  }
                  className="block w-full rounded-[18px] border-0 bg-white p-3 text-left text-[#111111] shadow-[0_8px_20px_rgba(67,45,28,0.06)] ring-1 ring-[#f0e9df]"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="m-0 text-[0.88rem] font-black">#{order.id}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.66rem] font-black ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f4eee7]">
                      {image ? (
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#cbbba8]">
                          <i className="fa-solid fa-couch" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[0.76rem] font-semibold text-[#8b8178]">{formatOrderDate(order)}</p>
                      <p className="mb-0 mt-0.5 text-[0.74rem] font-bold text-[#8b8178]">
                        {items} item{items === 1 ? '' : 's'}
                      </p>
                    </div>
                    <p className="m-0 text-[0.92rem] font-black">{formatOrderTotal(order)}</p>
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </main>
      {fromProfile ? null : <MobileBottomNav />}
      <MobileTrackSheet
        open={trackOpen}
        orderId={activeTrackId}
        fallbackOrder={null}
        onClose={() => setTrackOpen(false)}
      />
    </div>
  );
}
