import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    // Core styling classes
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary",
      outline: "border border-border bg-transparent hover:bg-muted text-foreground focus:ring-primary",
      ghost: "hover:bg-muted text-foreground hover:text-foreground focus:ring-primary",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
      link: "bg-transparent text-primary underline-offset-4 hover:underline focus:ring-primary p-0"
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
