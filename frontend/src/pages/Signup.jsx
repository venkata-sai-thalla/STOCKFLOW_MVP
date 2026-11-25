import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, ArrowRight } from 'lucide-react';

const Signup = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, organizationName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize tenant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(ellipse at top, #111b2e 0%, #090d16 80%)' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem', border: '1px solid var(--border-hover)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-symbol" style={{ margin: '0 auto 1rem', width: '42px', height: '42px' }}>
            <Terminal size={22} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-pure)' }}>
            Initialize Tenant
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Register your organization workspace on StockFlow
          </p>
        </div>

        {error && <div className="callout callout-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">ORGANIZATION NAME</label>
            <input
              type="text"
              className="field-input"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Apex Industrial Corp"
              required
            />
            <div className="field-helper">Creates a completely isolated data tenant.</div>
          </div>

          <div className="field">
            <label className="field-label">ADMINISTRATOR EMAIL</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@apex.com"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">MASTER PASSWORD</label>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">CONFIRM MASTER PASSWORD</label>
            <input
              type="password"
              className="field-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Initializing Workspace...' : 'Launch Tenant'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Existing tenant?{' '}
          <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
