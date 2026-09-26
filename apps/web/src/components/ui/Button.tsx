import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3.5 gap-2.5 rounded-xl font-semibold",
  };

  const variantStyles = {
    primary:
      "bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow focus:ring-brand-500 active:scale-[0.98]",
    secondary:
      "bg-surface-hover hover:bg-surface-border text-text-main border border-surface-border focus:ring-brand-500 active:scale-[0.98]",
    outline:
      "bg-transparent border border-surface-border hover:border-brand-500 text-text-main hover:bg-brand-500/10 focus:ring-brand-500",
    ghost:
      "bg-transparent hover:bg-surface-hover text-muted-fg hover:text-text-main focus:ring-brand-500",
    danger:
      "bg-danger-500 hover:bg-danger-600 text-white shadow-sm focus:ring-danger-500 active:scale-[0.98]",
    success:
      "bg-success-500 hover:bg-success-600 text-white shadow-sm focus:ring-success-500 active:scale-[0.98]",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
