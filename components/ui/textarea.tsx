import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, label, required, id, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-0.5">
            {label}
            {required && <span className="text-destructive">*</span>}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          className={`flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
