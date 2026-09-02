import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error, label, required, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-0.5">
            {label}
            {required && <span className="text-destructive">*</span>}
          </label>
        )}
        <input
          type={type}
          id={id}
          ref={ref}
          className={`flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
