import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRoute from './components/CustomerRoute';
import VendorRoute from './components/VendorRoute';
import AdminRoute from './components/AdminRoute';
import CustomerLayout from './layouts/CustomerLayout';
import VendorLayout from './layouts/VendorLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VenuePublicDetail from './pages/VenuePublicDetail';
import BookVenue from './pages/BookVenue';
import MyBookings from './pages/MyBookings';
import CustomerBookingDetail from './pages/CustomerBookingDetail';
import Profile from './pages/Profile';
import VendorVenues from './pages/vendor/VendorVenues';
import VendorVenueDetail from './pages/vendor/VendorVenueDetail';
import VendorBookings from './pages/vendor/VendorBookings';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<CustomerRoute />}>
            <Route element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="browse" element={<Navigate to="/" replace />} />
              <Route path="venues/:restaurantId/book" element={<BookVenue />} />
              <Route path="venues/:restaurantId" element={<VenuePublicDetail />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="bookings/:bookingId" element={<CustomerBookingDetail />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="/vendor" element={<VendorRoute />}>
            <Route element={<VendorLayout />}>
              <Route index element={<Navigate to="/vendor/venues" replace />} />
              <Route path="venues" element={<VendorVenues />} />
              <Route path="venues/:restaurantId" element={<VendorVenueDetail />} />
              <Route path="bookings" element={<VendorBookings />} />
              <Route path="analytics" element={<VendorAnalytics />} />
            </Route>
          </Route>
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="restaurants" element={<AdminRestaurants />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
