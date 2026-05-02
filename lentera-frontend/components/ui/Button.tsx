import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
  title?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--background)] hover:opacity-90 shadow-lg shadow-[var(--accent-glow)]",
  secondary: "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--accent)] hover:opacity-90",
  danger: "bg-red-600/90 text-white hover:bg-red-500 shadow-lg shadow-red-500/20",
  success: "bg-emerald-600/90 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20",
  warning: "bg-amber-500/90 text-[var(--background)] hover:bg-amber-400/90 shadow-lg shadow-amber-500/20",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--card)] border border-transparent hover:border-[var(--card-border)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        font-semibold rounded-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
