import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" />
          ZEMEN
        </Link>

        <nav className="nav-links">
          <Link to="/">Live</Link>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-username">{user.username}</span>
              <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
