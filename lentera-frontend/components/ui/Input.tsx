import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "mono";
  as?: "input" | "select" | "textarea";
  children?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, variant = "default", as = "input", className = "", children, ...props }, ref) => {
    const baseStyles = `
      w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)]
      text-[var(--foreground)] placeholder:text-[var(--subtle)]
      focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variant === "mono" ? "font-mono" : ""}
      ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""}
      ${leftIcon ? "pl-11" : ""}
      ${rightIcon ? "pr-11" : ""}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
          {as === "select" ? (
            <select ref={ref as any} className={baseStyles} {...props as any}>
              {children}
            </select>
          ) : as === "textarea" ? (
            <textarea ref={ref as any} className={baseStyles} {...props as any} />
          ) : (
            <input ref={ref} className={baseStyles} {...props} />
          )}
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
