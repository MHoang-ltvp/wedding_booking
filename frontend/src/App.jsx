import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import VendorLayout from './layouts/VendorLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRoute from './components/CustomerRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/shared/Profile';
import UserManagement from './pages/admin/UserManagement';
import RestaurantApproval from './pages/admin/RestaurantApproval';
import AdminRestaurantReview from './pages/admin/AdminRestaurantReview';
import RestaurantProfile from './pages/vendor/RestaurantProfile';
import VendorRestaurantList from './pages/vendor/VendorRestaurantList';
import HallsManagement from './pages/vendor/HallsManagement';
import VendorHallSchedule from './pages/vendor/VendorHallSchedule';
import ServicesManagement from './pages/vendor/ServicesManagement';
import Home from './pages/public/Home';
import RestaurantDetail from './pages/public/RestaurantDetail';
import CreateBooking from './pages/customer/CreateBooking';
import MyBookings from './pages/customer/MyBookings';
import BookingDetail from './pages/customer/BookingDetail';
import BookingManagement from './pages/vendor/BookingManagement';
import SystemBookings from './pages/admin/SystemBookings';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardVendor from './pages/vendor/DashboardVendor';

const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="restaurant/:id" element={<RestaurantDetail />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerRoute />}>
              <Route path="book/:restaurantId" element={<CreateBooking />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/bookings" element={<MyBookings />} />
              <Route path="profile/bookings/:id" element={<BookingDetail />} />
            </Route>
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardAdmin />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="restaurants/:id" element={<AdminRestaurantReview />} />
          <Route path="restaurants" element={<RestaurantApproval />} />
          <Route path="bookings" element={<SystemBookings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardVendor />} />
          <Route path="restaurant" element={<Navigate to="/vendor/restaurants" replace />} />
          <Route path="restaurants" element={<VendorRestaurantList />} />
          <Route path="restaurants/:restaurantId" element={<RestaurantProfile />} />
          <Route path="halls" element={<HallsManagement />} />
          <Route path="halls/schedule" element={<VendorHallSchedule />} />
          <Route path="services" element={<ServicesManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="*" element={<Navigate to="/vendor/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
