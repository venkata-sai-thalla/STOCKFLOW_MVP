import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Settings as SettingsIcon, LogOut, Boxes } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <Boxes size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>StockFlow</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Tenant MVP</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <Package size={18} />
            <span>Products</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="org-name">{user?.organization?.name || 'Your Organization'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
