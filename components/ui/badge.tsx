import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyle = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-muted text-muted-foreground border border-transparent",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    destructive: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20",
    info: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/20",
    outline: "text-foreground border border-border bg-transparent"
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
