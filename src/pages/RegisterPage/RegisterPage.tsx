import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "El correo es obligatorio")
      .email("Ingresa un correo válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function getRegisterErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo crear la cuenta.";
}

export const RegisterPage = () => {
  const { loading, register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/profile", { replace: true });
    }
  }, [loading, navigate, user]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const result = await registerUser(data.email, data.password);

      if (result.needsEmailConfirmation) {
        await Swal.fire({
          icon: "success",
          title: "Cuenta creada",
          text: "Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
        });

        navigate("/login", { replace: true });
        return;
      }

      navigate("/profile", { replace: true });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error al registrarse",
        text: getRegisterErrorMessage(error),
      });
    }
  };

  return (
    <div className="page auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-header">
          <h1 id="register-title">Crear cuenta</h1>
          <p className="auth-subtitle">
            Configura tu espacio para crear presupuestos profesionales.
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
                autoComplete="new-password"
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

          <label>
            <span>Confirmar contraseña</span>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </label>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </button>

          <p className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </section>
    </div>
  );
};
