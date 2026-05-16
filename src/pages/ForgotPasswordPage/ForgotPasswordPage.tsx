import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Swal from "sweetalert2";
import { sendPasswordResetEmail } from "../../lib/passwordRecovery";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo válido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function getRecoveryErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo enviar el correo de recuperación.";
}

export const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await sendPasswordResetEmail(data.email);
      reset();

      await Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo enviar",
        text: getRecoveryErrorMessage(error),
      });
    }
  };

  return (
    <div className="page auth-page">
      <section className="auth-card" aria-labelledby="forgot-password-title">
        <div className="auth-header">
          <h1 id="forgot-password-title">Recuperar contraseña</h1>
          <p className="auth-subtitle">
            Ingresa tu correo y te enviaremos un enlace seguro para crear una
            nueva contraseña.
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

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </button>

          <p className="auth-switch">
            ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </section>
    </div>
  );
};
