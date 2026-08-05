import React from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "icon"
  | "approve"
  | "reject";

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
  approve:
    "btn-approve",
  reject:
    "btn-reject",
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
