"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message || "Invalid email or password.");
      toast("Login Failed", res.message || "Invalid credentials.", "error");
    } else {
      toast("Success", "Welcome back! Redirecting to dashboard...", "success");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-foreground font-bold text-2xl shadow-md mb-4">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          </div>
          <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-foreground">
            Matt Quotation Management Portal
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Matt Engineering Solutions
          </p>
        </div>

        <Card className="shadow-md border-border">
          <CardHeader className="text-center pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email and password to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="rounded-md bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 border border-rose-500/20">
                  {errorMsg}
                </div>
              )}
              
              <Input
                label="Email Address"
                type="email"
                id="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[32px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-muted-foreground">
                    Remember me
                  </label>
                </div>
                <div className="text-xs">
                  <a href="#" className="font-semibold text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div> */}

              <Button
                type="submit"
                variant="default"
                className="w-full mt-4"
                isLoading={loading}
              >
                Sign In to Account
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/20 border border-border/40 py-2.5 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Secure AES-256 JWT Authentication Session</span>
        </div>
      </div>
    </div>
  );
}
