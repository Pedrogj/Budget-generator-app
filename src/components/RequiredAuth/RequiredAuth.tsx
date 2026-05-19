import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../LoadingState/LoadingState";

interface Props {
  children: React.ReactNode;
}

export const RequiredAuth = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LoadingState
        title="Cargando sesión"
        message="Estamos verificando tu acceso."
        variant="page"
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
