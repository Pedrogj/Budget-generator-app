// src/pages/Auth/RegisterPage.tsx
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

interface RegisterFormValues {
  email: string;
  password: string;
}

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(data.email, data.password);

      await Swal.fire({
        icon: "success",
        title: "Cuenta creada",
        text: "Tu cuenta se creó correctamente. Ahora puedes iniciar sesión.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/login");
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error al registrarse",
        text: error.message ?? "No se pudo crear la cuenta.",
      });
    }
  };

  return (
    <div className="page">
      <h1>Crear cuenta</h1>
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
                minLength: {
                  value: 6,
                  message: "Mínimo 6 caracteres",
                },
              })}
            />
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </button>

          <p style={{ marginTop: 8 }}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
