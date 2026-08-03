import { Navigate, Route, Routes } from 'react-router-dom';
import MobileCustomerShell from './MobileCustomerShell';
import MobileDriverApp from './MobileDriverApp';
import MobileHome from './screens/MobileHome';
import MobileShop from './screens/MobileShop';
import MobileCart from './screens/MobileCart';
import MobileOrders from './screens/MobileOrders';
import MobileProfile from './screens/MobileProfile';
import MobileWishlist from './screens/MobileWishlist';

export default function MobileAppRoutes() {
  return (
    <Routes>
      <Route path="driver" element={<MobileDriverApp />} />
      <Route element={<MobileCustomerShell />}>
        <Route index element={<MobileHome />} />
        <Route path="shop" element={<MobileShop />} />
        <Route path="wishlist" element={<MobileWishlist />} />
        <Route path="cart" element={<MobileCart />} />
        <Route path="orders" element={<MobileOrders />} />
        <Route path="profile" element={<MobileProfile />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}
