import { NavLink } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <span className="navbar-logo">P</span>
          <span className="navbar-title">Presupuesta</span>
        </div>

        <nav className="navbar-nav">
          <NavLink
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'navbar-link-active' : ''} `
            }
            to="/quotes/new"
          >
            Nuevo presupuesto
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'navbar-link-active' : ''} `
            }
            to="/quotes/preview"
          >
            Vista PDF
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'navbar-link-active' : ''} `
            }
            to="/profile"
          >
            Perfil Empresa
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
