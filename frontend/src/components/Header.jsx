import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header-glass">
      <div className="container d-flex justify-between align-center" style={{ height: '70px' }}>
        <Link to="/" className="brand-logo" style={{ fontSize: '2rem', marginBottom: 0 }}>Lumina</Link>
        
        <nav className="d-flex align-center gap-4 text-muted" style={{ fontWeight: 500 }}>
          <Link to="/" className="nav-item-lite hover-primary">Venues</Link>
          {user?.role === 'CUSTOMER' && (
            <Link to="/profile/bookings" className="nav-item-lite hover-primary">Đặt chỗ của tôi</Link>
          )}
        </nav>

        <div className="d-flex align-center gap-3">
          {user ? (
            <div className="user-dropdown" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="text-right" style={{ lineHeight: '1.2' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.fullName}</div>
                <div style={{ fontSize: '0.8rem' }}>{user.role}</div>
              </div>
              <div 
                className="avatar-placeholder" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'VENDOR' ? '/vendor/dashboard' : '/profile')}
              >
                {user.fullName.charAt(0)}
              </div>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.5rem' }} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost text-primary">Login</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
