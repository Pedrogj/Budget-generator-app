import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Swal from "sweetalert2";
import { updateRecoveredPassword } from "../../lib/passwordRecovery";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function getResetErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo actualizar la contraseña.";
}

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await updateRecoveredPassword(data.password);

      await Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "Ya puedes iniciar sesión con tu nueva contraseña.",
      });

      navigate("/login", { replace: true });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: getResetErrorMessage(error),
      });
    }
  };

  return (
    <div className="page auth-page">
      <section className="auth-card" aria-labelledby="reset-password-title">
        <div className="auth-header">
          <h1 id="reset-password-title">Nueva contraseña</h1>
          <p className="auth-subtitle">
            Define una contraseña nueva para recuperar el acceso a tu cuenta.
          </p>
        </div>

        <form className="auth-form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Nueva contraseña</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
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
            {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
          </button>

          <p className="auth-switch">
            ¿Ya la actualizaste? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </section>
    </div>
  );
};
