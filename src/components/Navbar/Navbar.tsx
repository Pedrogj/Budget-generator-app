import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export const Navbar = () => {
  const { user, logout } = useAuth();

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
              `navbar-link ${isActive ? "navbar-link-active" : ""} `
            }
            to="/clients"
          >
            Clientes
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `navbar-link ${isActive ? "navbar-link-active" : ""} `
            }
            to="/quotes/new"
          >
            Nuevo presupuesto
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `navbar-link ${isActive ? "navbar-link-active" : ""} `
            }
            to="/profile"
          >
            Perfil Empresa
          </NavLink>
          <div>
            {user ? (
              <>
                <button type="button" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register" style={{ marginLeft: 12 }}>
                  Registro
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
