import React from "react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "btn-primary",
  secondary:
    "btn-secondary",
  destructive:
    "btn-destructive",
  icon:
    "h-11 w-11 min-h-touch min-w-touch rounded-lg p-2 text-white hover:bg-neutral-900",
};

export function Button({
  variant = "primary",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}

export function FloatingActionButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`fixed bottom-6 right-6 z-50 flex min-h-14 min-w-14 items-center justify-center rounded-full bg-white px-5 py-4 text-xl font-medium text-black shadow-lg shadow-black/50 transition hover:bg-neutral-200 active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
