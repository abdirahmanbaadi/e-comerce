import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
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
import About from './pages/About';
import Contact from './pages/Contact';
import ApplyDelivery from './pages/ApplyDelivery';
import Delivery from './pages/Delivery';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import StaffRouteGuard from './components/StaffRouteGuard';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import PostDeliveryReviewProvider from './components/PostDeliveryReviewProvider';
import { mobileAppRoutes } from './mobile/MobileAppRoutes';
import MobileAppearanceSync from './mobile/MobileAppearanceSync';

/** Phone → PWA splash; desktop keeps website. ?classic=1 forces website on phone. */
function MobileLandingRedirect() {
  const [params] = useSearchParams();
  if (params.get('classic') === '1') return <Home />;
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches) {
    return <Navigate to="/app" replace />;
  }
  return <Home />;
}

function AppRoutes() {
  return (
    <StaffRouteGuard>
      <Routes>
      <Route path="/" element={<MobileLandingRedirect />} />
      <Route path="/app">{mobileAppRoutes}</Route>
      <Route path="/products" element={<Products />} />
      <Route path="/categories" element={<Navigate to="/products" replace />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/about" element={<About />} />
      <Route
        path="/contact"
        element={
          <ErrorBoundary>
            <Contact />
          </ErrorBoundary>
        }
      />
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
          <ProtectedRoute roles={['admin', 'staff']}>
            <ErrorBoundary>
              <Admin />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StaffRouteGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <MobileAppearanceSync />
      <ErrorBoundary>
        <AuthProvider>
          <PostDeliveryReviewProvider>
            <ProductsProvider>
              <CartProvider>
                <WishlistProvider>
                  <AppRoutes />
                </WishlistProvider>
              </CartProvider>
            </ProductsProvider>
          </PostDeliveryReviewProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
