"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border border-border bg-card text-card-foreground animate-in fade-in slide-in-from-bottom-5 duration-300`}
            role="alert"
          >
            {/* Status Icons */}
            {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />}
            
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{t.title}</span>
              {t.description && <span className="text-xs text-muted-foreground">{t.description}</span>}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
