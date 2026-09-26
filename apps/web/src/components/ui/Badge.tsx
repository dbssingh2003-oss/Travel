import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "success" | "warning" | "danger" | "muted" | "accent";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "brand",
  size = "md",
  dot = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-pill transition-colors select-none";

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-700/40",
    success: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500 border border-success-500/20",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500 border border-warning-500/20",
    danger: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500 border border-danger-500/20",
    accent: "bg-accent/10 text-accent dark:text-accent border border-accent/20",
    muted: "bg-surface-hover text-muted-fg border border-surface-border",
  };

  const dotColors = {
    brand: "bg-brand-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    accent: "bg-accent",
    muted: "bg-muted-fg",
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};

export default Badge;
