import { useEffect, useState } from 'react';
import { fetchMe, updateMe } from '../services/user.service';

function Profile() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const data = await fetchMe();
        if (!cancelled && data.success && data.user) {
          setFullName(data.user.fullName || '');
          setPhone(data.user.phone || '');
          setEmail(data.user.email || '');
          setRole(data.user.role || '');
        } else if (!cancelled) {
          setError(data.message || 'Không tải được profile.');
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Lỗi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const data = await updateMe({ fullName, phone });
      if (data.success) {
        setMsg('Đã lưu.');
      } else {
        setError(data.message || 'Không cập nhật được.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-page">
        <p className="customer-muted">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <header className="customer-page__head">
        <h1 className="customer-page__title">Hồ sơ</h1>
      </header>

      {error && <p className="customer-alert customer-alert--error">{error}</p>}
      {msg && <p className="customer-alert customer-alert--ok">{msg}</p>}

      <p className="customer-muted" style={{ marginBottom: '1rem' }}>
        Email: <strong>{email}</strong> · Vai trò: <strong>{role}</strong>
      </p>

      <form className="customer-form" onSubmit={handleSubmit}>
        <label className="customer-label">
          Họ tên
          <input
            className="customer-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>
        <label className="customer-label">
          Số điện thoại
          <input
            className="customer-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="customer-btn customer-btn--primary" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </div>
  );
}

export default Profile;
