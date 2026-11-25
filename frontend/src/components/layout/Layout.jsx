import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layers, Activity, Sliders, LogOut, Terminal } from 'lucide-react';

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
                <Terminal size={19} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="brand-title">STOCKFLOW</span>
                <span className="brand-pill">TENANT-OS</span>
              </div>
            </div>

            <nav className="nav-tabs">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <Activity size={15} />
                <span>Telemetry</span>
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <Layers size={15} />
                <span>Inventory Catalog</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
                <Sliders size={15} />
                <span>Org Policy</span>
              </NavLink>
            </nav>
          </div>

          <div className="topbar-actions">
            <div className="tenant-badge" title={user?.email}>
              <span className="tenant-status-dot"></span>
              <span className="tenant-name">{user?.organization?.name || 'Organization'}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Sign out of tenant">
              <LogOut size={14} />
              <span>Exit</span>
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
