import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export const RequiredAuth = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Cargando sesión...</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
