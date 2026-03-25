import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchAdminUsers } from '../../services/admin.service';
import { toast } from 'react-toastify';
import { Lock, Unlock, Search } from 'lucide-react';

function labelRole(role) {
  if (role === 'CUSTOMER') return 'Khách hàng';
  if (role === 'VENDOR') return 'Nhà cung cấp';
  if (role === 'ADMIN') return 'Quản trị';
  return role;
}

function labelUserStatus(s) {
  if (s === 'ACTIVE') return 'Hoạt động';
  if (s === 'LOCKED') return 'Đã khóa';
  return s;
}

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const { users } = await fetchAdminUsers(roleFilter ? { role: roleFilter } : {});
      setUsers(users);
    } catch (error) {
      toast.error('Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
      await api.put(paths.admin.userStatus(userId), { status: newStatus });
      toast.success(newStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      fetchUsers();
    } catch (error) {
      toast.error('Không cập nhật được trạng thái người dùng.');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Quản lý người dùng</h1>
        <div className="d-flex gap-3 align-center">
          <div className="input-group" style={{marginBottom: 0}}>
            <select 
              className="input-field" 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{height: '40px', padding: '0 1rem'}}
            >
              <option value="">Tất cả vai trò</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="VENDOR">Nhà cung cấp</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{padding: 0}}>
        {loading ? (
          <div style={{padding: 'var(--space-5)', textAlign: 'center'}}>Đang tải…</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email &amp; điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">Không có người dùng</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id}>
                      <td style={{fontWeight: 500}}>{u.fullName}</td>
                      <td>
                        <div>{u.email}</div>
                        <div className="text-muted" style={{fontSize: '0.85rem'}}>{u.phone}</div>
                      </td>
                      <td>
                        <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)'}}>
                          {labelRole(u.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.status === 'ACTIVE' ? 'active' : 'locked'}`}>
                          {labelUserStatus(u.status)}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'ADMIN' && (
                          <button 
                            className={`btn ${u.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                            style={{padding: '0.25rem 0.5rem', fontSize: '0.85rem'}}
                            onClick={() => toggleStatus(u._id, u.status)}
                          >
                            {u.status === 'ACTIVE' ? <><Lock size={14}/> Khóa</> : <><Unlock size={14}/> Mở khóa</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
