import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(paths.users.me);
      setUser(res.data.user || res.data.data || res.data);
    } catch (error) {
      console.error("Auth check failed", error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post(paths.auth.login, { email, password });
      localStorage.setItem('token', res.data.token);
      const userData = res.data.user;
      if (!userData) {
        toast.error('Phản hồi đăng nhập không hợp lệ.');
        return { success: false, message: 'Invalid response' };
      }
      setUser(userData);
      toast.success('Đăng nhập thành công!');
      return { success: true, role: userData.role };
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra email/mật khẩu.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post(paths.auth.register, userData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        const u = res.data.user;
        if (u) setUser(u);
        toast.success('Đăng ký thành công!');
        return { success: true, role: u?.role || userData?.role };
      }
      toast.success('Đăng ký thành công. Vui lòng đăng nhập.');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Bạn đã đăng xuất.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
