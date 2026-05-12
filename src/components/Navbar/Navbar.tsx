import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQuote } from "../../context/QuoteContext";
import "./Navbar.css";

function getLinkClass({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return `navbar-link ${isActive || isPending ? "navbar-link-active" : ""}`;
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { company } = useQuote();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const brandTarget = user ? "/quotes/new" : "/login";
  const companyName = company.name.trim() || "Empresa sin configurar";

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  return (
    <>
      <aside className="navbar">
        <div className="navbar-content">
        <Link
          className="navbar-brand"
          to={brandTarget}
          onClick={closeMenu}
          aria-label="Ir al inicio de Presupuesta"
        >
          <span className="navbar-logo">P</span>
          <span className="navbar-title">Presupuesta</span>
        </Link>

        <button
          className="navbar-menu-button"
          type="button"
          aria-label={isMenuOpen ? "Cerrar navegación" : "Abrir navegación"}
          aria-expanded={isMenuOpen}
          aria-controls="navbar-nav"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="navbar-nav"
          className={`navbar-nav ${isMenuOpen ? "navbar-nav-open" : ""}`}
          aria-label="Navegación principal"
        >
          {user && (
            <>
              <NavLink
                className={getLinkClass}
                to="/quotes/new"
                onClick={closeMenu}
              >
                Nuevo presupuesto
              </NavLink>
              <NavLink
                className={getLinkClass}
                to="/quotes/history"
                onClick={closeMenu}
              >
                Historial
              </NavLink>
              <NavLink
                className={getLinkClass}
                to="/quotes/templates"
                onClick={closeMenu}
              >
                Modelos
              </NavLink>
              <NavLink
                className={getLinkClass}
                to="/clients"
                onClick={closeMenu}
              >
                Clientes
              </NavLink>
              <NavLink
                className={getLinkClass}
                to="/profile"
                onClick={closeMenu}
              >
                Empresa
              </NavLink>
            </>
          )}

          {!user && (
            <>
              <NavLink
                className={getLinkClass}
                to="/login"
                onClick={closeMenu}
              >
                Login
              </NavLink>
              <NavLink
                className={getLinkClass}
                to="/register"
                onClick={closeMenu}
              >
                Registro
              </NavLink>
            </>
          )}
        </nav>
      </div>
      </aside>

      <header className="topbar">
        <div className="topbar-company">
          <span>Empresa</span>
          <strong>{user ? companyName : "Presupuesta"}</strong>
        </div>

        {user && (
          <button
            className="topbar-logout"
            type="button"
            onClick={() => void handleLogout()}
          >
            Cerrar sesión
          </button>
        )}
      </header>
    </>
  );
};
