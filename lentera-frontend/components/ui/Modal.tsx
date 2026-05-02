import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-lentera-fade-in"
      onClick={onClose}
    >
      <div
        className={`
          ${sizeStyles[size]} w-full
          bg-[var(--card)] backdrop-blur-xl border border-[var(--card-border)] rounded-2xl
          p-6 shadow-2xl animate-lentera-slide-up
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-xl font-bold mb-4 text-center text-[var(--foreground)]">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
