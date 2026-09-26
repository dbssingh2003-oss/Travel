import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "card";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const baseStyles = "animate-pulse bg-surface-hover/80 dark:bg-surface-hover/40 rounded-lg";

  const variantStyles = {
    text: "h-4 w-full rounded",
    rectangular: "w-full h-24 rounded-lg",
    circular: "rounded-full aspect-square",
    card: "w-full h-48 rounded-card border border-surface-border p-5",
  };

  const customStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      style={customStyle}
      {...props}
    />
  );
};

export const PlanCardSkeleton: React.FC = () => (
  <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <Skeleton width="40%" height={24} />
      <Skeleton width="20%" height={20} />
    </div>
    <Skeleton width="60%" height={32} />
    <div className="space-y-2 pt-2">
      <Skeleton width="100%" height={16} />
      <Skeleton width="85%" height={16} />
      <Skeleton width="90%" height={16} />
    </div>
    <div className="pt-4 border-t border-surface-border/50 flex justify-between items-center">
      <Skeleton width="30%" height={24} />
      <Skeleton width="35%" height={40} className="rounded-lg" />
    </div>
  </div>
);

export const DashboardCardSkeleton: React.FC = () => (
  <div className="rounded-card border border-surface-border bg-surface p-6 shadow-card space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-1/2">
        <Skeleton width="70%" height={20} />
        <Skeleton width="40%" height={14} />
      </div>
      <Skeleton width="25%" height={24} className="rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3 pt-3">
      <Skeleton height={48} className="rounded-lg" />
      <Skeleton height={48} className="rounded-lg" />
      <Skeleton height={48} className="rounded-lg" />
    </div>
  </div>
);

export default Skeleton;
