import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { WishlistProvider } from './context/WishlistContext';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { LoginPage, RegisterPage } from './pages/Auth';
import Profile from './pages/Profile';
import TrackOrder from './pages/TrackOrder';
import ApplyDelivery from './pages/ApplyDelivery';
import Delivery from './pages/Delivery';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

const Admin = lazy(() => import('./pages/Admin'));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/categories" element={<Navigate to="/products" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/apply-delivery" element={<ApplyDelivery />} />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute roles={['delivery']}>
            <Delivery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center bg-[#f4f7f6] text-[#073d35]">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#073d35]/10 bg-white px-5 py-4 font-bold shadow-sm">
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                    Loading admin panel…
                  </div>
                </div>
              }
            >
              <Admin />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
