import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "gradient";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "rounded-card border border-surface-border bg-surface text-text-main p-5 transition-all duration-200";

  const variantStyles = {
    default: "shadow-card",
    elevated: "shadow-elevated",
    interactive:
      "shadow-card hover:shadow-elevated hover:border-brand-500/40 cursor-pointer hover:-translate-y-0.5",
    gradient:
      "bg-gradient-to-br from-surface to-surface-hover shadow-card border-surface-border/80",
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
