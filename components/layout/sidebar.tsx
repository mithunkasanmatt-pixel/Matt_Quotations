"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Receipt,
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Quotations", href: "/quotations", icon: FileText },
    { label: "Generate Invoice", href: "/invoices", icon: Receipt },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card text-card-foreground transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header/Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary-foreground font-bold text-lg shadow-sm">
              <img src="/logo.png" alt="Logo" className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight text-foreground">Matt Quotation Portal</span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Matt</span>
            </div>
          </Link>
          <button 
            className="md:hidden text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer/User Stats */}
        <div className="p-4 border-t border-border/40 bg-muted/30">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20 uppercase">
              {user?.name.substring(0, 2) || "US"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">{user?.name || "User"}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{user?.role || "staff"}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout Session
          </button>
        </div>
      </aside>
    </>
  );
}
