interface LoadingStateProps {
  title?: string;
  message?: string;
  variant?: "page" | "panel" | "inline";
}

export const LoadingState = ({
  title = "Cargando",
  message,
  variant = "panel",
}: LoadingStateProps) => {
  return (
    <div
      className={`loading-state loading-state-${variant}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-spinner" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};
