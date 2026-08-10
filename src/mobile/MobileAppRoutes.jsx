import { Navigate, Route } from 'react-router-dom';
import MobileSplash from './screens/MobileSplash';
import MobileHome from './screens/MobileHome';
import MobileShop from './screens/MobileShop';
import MobileProductDetails from './screens/MobileProductDetails';
import MobileCart from './screens/MobileCart';
import MobileWishlist from './screens/MobileWishlist';
import MobileOrders from './screens/MobileOrders';
import MobileOrderDetails from './screens/MobileOrderDetails';
import MobileCheckout from './screens/MobileCheckout';
import MobileLogin from './screens/MobileLogin';
import MobileRegister from './screens/MobileRegister';
import MobileProfile from './screens/MobileProfile';
import MobilePersonalInfo from './screens/MobilePersonalInfo';
import MobileReviews from './screens/MobileReviews';
import MobileSupport from './screens/MobileSupport';
import MobileCustomerService from './screens/MobileCustomerService';
import MobileSettings from './screens/MobileSettings';
import MobileNotifications from './screens/MobileNotifications';
import DriverShell from './driver/DriverShell';
import DriverHome from './driver/screens/DriverHome';
import DriverJobs from './driver/screens/DriverJobs';
import DriverJobDetail from './driver/screens/DriverJobDetail';
import DriverActiveDelivery from './driver/screens/DriverActiveDelivery';
import DriverQrScan from './driver/screens/DriverQrScan';
import DriverProfile from './driver/screens/DriverProfile';
import DriverEarnings from './driver/screens/DriverEarnings';
import DriverNotifications from './driver/screens/DriverNotifications';

export const mobileAppRoutes = (
  <>
    <Route index element={<MobileSplash />} />
    <Route path="home" element={<MobileHome />} />
    <Route path="shop" element={<MobileShop />} />
    <Route path="product/:productId" element={<MobileProductDetails />} />
    <Route path="cart" element={<MobileCart />} />
    <Route path="checkout" element={<MobileCheckout />} />
    <Route path="notifications" element={<MobileNotifications />} />
    <Route path="wishlist" element={<Navigate to="/app/profile/wishlist" replace />} />
    <Route path="orders">
      <Route index element={<Navigate to="/app/profile/orders" replace />} />
      <Route path=":orderId" element={<MobileOrderDetails />} />
    </Route>
    <Route path="login" element={<MobileLogin />} />
    <Route path="register" element={<MobileRegister />} />
    <Route path="profile">
      <Route index element={<MobileProfile />} />
      <Route path="personal" element={<MobilePersonalInfo />} />
      <Route path="edit" element={<Navigate to="/app/profile/personal" replace />} />
      <Route path="orders" element={<MobileOrders fromProfile />} />
      <Route path="wishlist" element={<MobileWishlist fromProfile />} />
      <Route path="addresses" element={<Navigate to="/app/profile/personal" replace />} />
      <Route path="reviews" element={<MobileReviews />} />
      <Route path="support" element={<MobileSupport />} />
      <Route path="support/chat" element={<MobileCustomerService />} />
      <Route path="settings" element={<MobileSettings />} />
    </Route>

    <Route path="driver" element={<DriverShell />}>
      <Route index element={<DriverHome />} />
      <Route path="jobs" element={<DriverJobs />} />
      <Route path="jobs/:orderId" element={<DriverJobDetail />} />
      <Route path="jobs/:orderId/active" element={<DriverActiveDelivery />} />
      <Route path="jobs/:orderId/scan" element={<DriverQrScan />} />
      <Route path="notifications" element={<DriverNotifications />} />
      <Route path="profile">
        <Route index element={<DriverProfile />} />
        <Route path="personal" element={<MobilePersonalInfo />} />
        <Route path="earnings" element={<DriverEarnings />} />
        <Route path="support" element={<MobileSupport />} />
        <Route path="support/chat" element={<MobileCustomerService />} />
        <Route path="settings" element={<MobileSettings />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/app/home" replace />} />
  </>
);
