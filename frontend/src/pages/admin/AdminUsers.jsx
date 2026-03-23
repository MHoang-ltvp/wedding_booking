import { useCallback, useEffect, useState } from 'react';
import { fetchAdminUsers, updateAdminUserStatus } from '../../services/admin.service';
import '../../styles/vendor.css';
import '../../styles/admin.css';

function roleBadge(role) {
  if (role === 'ADMIN') return 'admin-badge admin-badge--role-admin';
  if (role === 'VENDOR') return 'admin-badge admin-badge--role-vendor';
  return 'admin-badge admin-badge--role-customer';
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { page, limit };
      if (role) params.role = role;
      if (status) params.status = status;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await fetchAdminUsers(params);
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total ?? 0);
      } else {
        setError(data.message || 'Không tải được.');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi mạng.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, role, status, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (u) => {
    const next = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const label = next === 'LOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`${label} tài khoản ${u.email}?`)) return;
    setBusyId(u._id);
    setError('');
    try {
      const data = await updateAdminUserStatus(u._id, next);
      if (data.success) await load();
      else setError(data.message || 'Không cập nhật được.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lỗi.');
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="vendor-page-header">
        <p className="admin-kicker">Quản trị</p>
        <h1 className="vendor-page-title">Người dùng</h1>
      </div>

      {error && (
        <div className="vendor-alert vendor-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-toolbar">
        <label>
          Vai trò
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="ADMIN">ADMIN</option>
            <option value="VENDOR">VENDOR</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </label>
        <label>
          Tìm
          <input
            type="search"
            placeholder="Email, tên, SĐT…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearchQuery(searchDraft.trim());
              }
            }}
          />
        </label>
        <button
          type="button"
          className="vendor-btn-ghost"
          onClick={() => {
            setPage(1);
            setSearchQuery(searchDraft.trim());
          }}
        >
          Lọc
        </button>
      </div>

      {loading ? (
        <p className="vendor-muted">Đang tải…</p>
      ) : users.length === 0 ? (
        <p className="vendor-muted">Không có người dùng.</p>
      ) : (
        <>
          <div className="vendor-table-wrap">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>TT</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td>{u.fullName}</td>
                    <td>{u.phone}</td>
                    <td>
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td>{u.status}</td>
                    <td>
                      <button
                        type="button"
                        className={
                          u.status === 'LOCKED'
                            ? 'vendor-btn-primary'
                            : 'vendor-btn-ghost vendor-btn-ghost--danger'
                        }
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        disabled={busyId === u._id}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <p className="vendor-muted" style={{ margin: 0 }}>
              Trang {page} / {totalPages} — {total} bản ghi
            </p>
            <button
              type="button"
              className="vendor-btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              className="vendor-btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminUsers;
