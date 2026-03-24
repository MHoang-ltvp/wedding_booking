import React, { useContext } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Users, Building, ClipboardList, LogOut, BarChart3 } from 'lucide-react';
import '../styles/role-shell.css';

const AdminLayout = () => {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <BarChart3 size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Restaurants', path: '/admin/restaurants', icon: <Building size={20} /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Lumina<span style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '10px'}}>ADMIN</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-profile mb-3" style={{marginBottom: '1rem'}}>
            <div className="avatar-placeholder">{user.fullName.charAt(0)}</div>
            <div style={{overflow: 'hidden'}}>
              <div style={{fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{user.fullName}</div>
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Administrator</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost full-width" style={{justifyContent: 'flex-start', padding: '0.5rem'}}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
