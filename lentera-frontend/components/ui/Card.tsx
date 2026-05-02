import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export default function Card({ children, className = "", glow = false, hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--card)] backdrop-blur-xl border border-[var(--card-border)] rounded-2xl
        ${glow ? "animate-lentera-glow-pulse" : ""}
        ${hover ? "hover:border-[var(--accent-secondary)] hover:shadow-lg hover:shadow-[var(--accent-glow)]/10 transition-all duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
