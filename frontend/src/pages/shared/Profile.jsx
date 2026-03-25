import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { Save } from 'lucide-react';

const Profile = () => {
  const { user, checkAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put(paths.users.me, formData);
      await checkAuth(); // refresh user context
      toast.success('Đã cập nhật hồ sơ.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không cập nhật được hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{maxWidth: '800px', marginTop: 'var(--space-5)'}}>
      <div className="page-header">
        <h1 className="page-title">Hồ sơ của tôi</h1>
      </div>

      <div className="card fade-in">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input-field" value={user?.email || ''} disabled />
            <small className="text-muted">Không đổi được email.</small>
          </div>

          <div className="input-group">
            <label>Họ và tên</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.fullName} 
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label>Số điện thoại</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          
          <div style={{marginTop: 'var(--space-4)'}}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <Save size={18} /> {isLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
