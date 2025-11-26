import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav>
      <Link to="/quotes/new">Nuevo presupuesto</Link>
      <Link to="/quotes/preview">Vista previa</Link>
      <Link to="/profile">Perfil Empresa</Link>
    </nav>
  );
};
