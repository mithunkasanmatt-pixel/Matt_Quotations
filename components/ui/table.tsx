import * as React from "react";

export function Table({ className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`[&_tr]:border-b bg-muted/50 border-border ${className}`}
      {...props}
    />
  );
}

export function TableBody({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`[&_tr:last-child]:border-0 ${className}`}
      {...props}
    />
  );
}

export function TableFooter({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 border-border ${className}`}
      {...props}
    />
  );
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted border-border ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[align=right]]:text-right ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
}
