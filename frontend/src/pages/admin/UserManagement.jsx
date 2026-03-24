import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { paths } from '../../api/endpoints';
import { fetchAdminUsers } from '../../services/admin.service';
import { toast } from 'react-toastify';
import { Lock, Unlock, Search } from 'lucide-react';

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
      toast.success(`User ${newStatus.toLowerCase()} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <div className="d-flex gap-3 align-center">
          <div className="input-group" style={{marginBottom: 0}}>
            <select 
              className="input-field" 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{height: '40px', padding: '0 1rem'}}
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{padding: 0}}>
        {loading ? (
          <div style={{padding: 'var(--space-5)', textAlign: 'center'}}>Loading...</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email & Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">No users found</td></tr>
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
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.status === 'ACTIVE' ? 'active' : 'locked'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'ADMIN' && (
                          <button 
                            className={`btn ${u.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                            style={{padding: '0.25rem 0.5rem', fontSize: '0.85rem'}}
                            onClick={() => toggleStatus(u._id, u.status)}
                          >
                            {u.status === 'ACTIVE' ? <><Lock size={14}/> Lock</> : <><Unlock size={14}/> Unlock</>}
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
