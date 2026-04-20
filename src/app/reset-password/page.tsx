"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockSimpleIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function ResetPassword() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    const promise = async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    };

    toast.promise(promise(), {
      loading: "Redefinindo sua senha...",
      success: () => {
        setLoading(false);
        router.push("/login");
        return "Senha redefinida com sucesso!";
      },
      error: (err) => {
        setLoading(false);
        return `${err.message}`;
      },
    });
  }

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative flex items-center justify-center p-6">
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-200 h-125 bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* BACK BUTTON */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-8 group"
        >
          <CaretLeftIcon
            size={16}
            weight="bold"
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Voltar para Login
          </span>
        </Link>

        <div className="p-8 md:p-10 rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/40 to-transparent" />

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Nova senha
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Escolha uma senha forte com pelo menos 8 caracteres.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {/* NOVA SENHA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                Nova Senha
              </label>
              <div className="relative group">
                <LockSimpleIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
                />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-surface-alt border border-border rounded-xl py-4 pl-12 pr-12 text-sm outline-hidden focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRMAR SENHA */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                Confirmar Senha
              </label>
              <div className="relative group">
                <LockSimpleIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
                />
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-surface-alt border border-border rounded-xl py-4 pl-12 pr-12 text-sm outline-hidden focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                >
                  {showConfirm ? (
                    <EyeSlashIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 rounded-xl font-bold bg-linear-to-r from-[#C084FC] to-accent text-menu-text shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <CircleNotchIcon
                  size={20}
                  weight="bold"
                  className="animate-spin"
                />
              ) : (
                <>
                  Redefinir senha
                  <ArrowRightIcon size={20} weight="bold" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          © 2026 OrderFlow Architect • Infraestrutura Segura
        </p>
      </div>
    </main>
  );
}
