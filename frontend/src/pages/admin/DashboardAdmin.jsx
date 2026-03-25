import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { toast } from 'react-toastify';
import { Users, Building, Activity, ShieldCheck } from 'lucide-react';

const DashboardAdmin = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get(paths.admin.stats);
      setStats(res.data.stats || res.data.data || res.data);
      setLoading(false);
    } catch (error) {
      toast.error('Không tải được thống kê quản trị.');
      // Mock data for UI presentation
      setStats({
        totalUsers: 156,
        totalVendors: 42,
        totalBookings: 89,
        activeRestaurants: 38
      });
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải số liệu hệ thống…</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">System Overview</h1>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        <div className="card d-flex align-center gap-4">
          <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#3b82f6' }}>
            <Users size={28} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Tổng người dùng</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="card d-flex align-center gap-4">
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Đối tác đăng ký</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalVendors || 0}</div>
          </div>
        </div>

        <div className="card d-flex align-center gap-4">
          <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '50%', color: '#10B981' }}>
            <Building size={28} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Nhà hàng hoạt động</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.activeRestaurants || 0}</div>
          </div>
        </div>

        <div className="card d-flex align-center gap-4">
          <div style={{ padding: '1rem', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', color: 'var(--primary)' }}>
            <Activity size={28} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>Tổng đặt chỗ</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalBookings || 0}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Hoạt động nền tảng</h3>
        <div style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <p>Biểu đồ phân tích sẽ có trong bản cập nhật sau.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
