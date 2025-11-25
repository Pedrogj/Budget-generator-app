import { Link } from 'react-router-dom';

export const Navbar = () => {
  return (
    <nav>
      <Link to="/quotes/new">Nuevo presupuesto</Link>
      <Link to="/quotes/preview">Nuevo presupuesto</Link>
    </nav>
  );
};
