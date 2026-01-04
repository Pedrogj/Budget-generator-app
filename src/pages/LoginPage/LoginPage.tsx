// src/pages/Auth/LoginPage.tsx
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);

      const redirectTo = location.state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text:
          error.message ?? "Revisa tus credenciales e inténtalo nuevamente.",
      });
    }
  };

  return (
    <div className="page">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="section">
          <label>
            <span>Correo electrónico</span>
            <input
              type="email"
              {...register("email", { required: "El correo es obligatorio" })}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </label>

          <label>
            <span>Contraseña</span>
            <input
              type="password"
              {...register("password", {
                required: "La contraseña es obligatoria",
              })}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>

          <p style={{ marginTop: 8 }}>
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
