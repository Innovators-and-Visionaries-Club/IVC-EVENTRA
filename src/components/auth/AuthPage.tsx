"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getRoleRedirectUrl } from "@/lib/auth/redirect";
import { Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function AuthPage({ isSignUp = false }: { isSignUp?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "participant",
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const redirectUrl = await getRoleRedirectUrl(data.user.id);
          router.push(redirectUrl);
        } else {
          router.push("/login?message=Check your email for confirmation link");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const redirectUrl = await getRoleRedirectUrl(data.user.id);
          router.push(redirectUrl);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-8 border border-border-color shadow-2xl relative space-y-6">
        {/* Neon accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-secondary via-accent-primary to-accent-tertiary" />

        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-full bg-surface-color-light border border-border-color mb-2">
            <ShieldCheck className="w-8 h-8 text-accent-secondary" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-text-primary uppercase m-0">
            {isSignUp ? "Create Account" : "Access Portal"}
          </h1>
          <p className="font-tech text-xs text-text-secondary uppercase tracking-wider">
            {isSignUp
              ? "Register for Vice Verse 1.0"
              : "Unified entry point for Admin, Judges, Teams & Staff"}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-status-error/15 border border-status-error text-status-error font-tech text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-tech">
          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-xs uppercase text-text-secondary font-bold">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-text-secondary" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-surface-color border border-border-color p-2.5 pl-9 text-text-primary text-xs focus:border-accent-secondary outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs uppercase text-text-secondary font-bold">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-surface-color border border-border-color p-2.5 pl-9 text-text-primary text-xs focus:border-accent-secondary outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs uppercase text-text-secondary font-bold">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-text-secondary" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-color border border-border-color p-2.5 pl-9 text-text-primary text-xs focus:border-accent-secondary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent-secondary to-accent-primary hover:opacity-90 text-black font-tech font-bold uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Sign In"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-4 border-t border-border-color text-center font-tech text-xs text-text-secondary">
          {isSignUp ? (
            <p className="m-0">
              Already have an account?{" "}
              <Link href="/login" className="text-accent-secondary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          ) : (
            <p className="m-0">
              New participant?{" "}
              <Link href="/signup" className="text-accent-tertiary font-bold hover:underline">
                Create an account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
