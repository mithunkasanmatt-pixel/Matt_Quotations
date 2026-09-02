"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);

  // Auth guard: If not loading and no user, route to login
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
            Verifying your credentials...
          </span>
        </div>
      </div>
    );
  }

  // Double check user presence before rendering children
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Body */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Navbar */}
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
