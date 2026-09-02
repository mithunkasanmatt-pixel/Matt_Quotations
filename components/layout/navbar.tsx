"use client";

import * as React from "react";
import { Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user } = useAuth();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  // Load and apply initial theme
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = (savedTheme as "light" | "dark") || systemTheme;
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-6 shadow-2xs">
      {/* Left items: Mobile Menu & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground md:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground tracking-wide md:text-lg">
          {title}
        </h1>
      </div>

      {/* Right items: Theme toggle & User banner */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* User Card */}
        <div className="hidden sm:flex items-center gap-2.5 border-l border-border/60 pl-4">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-foreground leading-tight">{user?.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
            {user?.name.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
