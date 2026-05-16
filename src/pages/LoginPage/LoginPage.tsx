import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Revisa tus credenciales e inténtalo nuevamente.";
}

export const LoginPage = () => {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, navigate, redirectTo, user]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text: getLoginErrorMessage(error),
      });
    }
  };

  return (
    <div className="page auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-header">
          <h1 id="login-title">Iniciar sesión</h1>
          <p className="auth-subtitle">
            Accede para gestionar tu empresa, clientes y presupuestos.
          </p>
        </div>

        <form className="auth-form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              inputMode="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </label>

          <label>
            <span>Contraseña</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </label>

          <p className="auth-inline-link">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </p>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>

          <p className="auth-switch">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </section>
    </div>
  );
};
