import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', date_of_birth: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.register(form);
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="auth-sub">Broadcasters and viewers must be 18 or older.</p>

        {error && <div className="auth-error">{error}</div>}

        <label className="auth-label">Username</label>
        <input className="input" required value={form.username} onChange={update('username')} />

        <label className="auth-label">Email</label>
        <input className="input" type="email" required value={form.email} onChange={update('email')} />

        <label className="auth-label">Date of birth</label>
        <input className="input" type="date" required value={form.date_of_birth} onChange={update('date_of_birth')} />

        <label className="auth-label">Password</label>
        <input className="input" type="password" required minLength={8} value={form.password} onChange={update('password')} />

        <button className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
