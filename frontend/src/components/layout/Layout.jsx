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
    <div className="app-shell">
      <header className="topbar-header">
        <div className="topbar-inner">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-symbol">
                <Boxes size={20} />
              </div>
              <div className="brand-text-group">
                <span className="brand-title">StockFlow</span>
                <span className="brand-pill">Inventory</span>
              </div>
            </div>

            <nav className="nav-tabs">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <Package size={16} />
                <span>Products</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <SettingsIcon size={16} />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>

          <div className="topbar-actions">
            <div className="tenant-badge" title={user?.email}>
              <span className="tenant-status-dot"></span>
              <span className="tenant-name">{user?.organization?.name || 'Organization'}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Sign out">
              <LogOut size={14} />
              <span className="btn-label-text">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-viewport">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
