"use client";

import React, { useState } from "react";
import {
  ArrowRightIcon,
  EnvelopeSimpleIcon,
  LockSimpleIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { getSupabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // Criamos um "promise toast" que muda de estado sozinho
    const promise = async () => {
      const supabase = getSupabase();
      const formData = new FormData(e.currentTarget);

      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (error) throw new Error(error.message);
      return data;
    };

    toast.promise(promise(), {
      loading: "Criando sua conta...",
      success: (data) => {
        setLoading(false);
        router.replace("/settings-profile")
        return `Bem-vindo, ${data.user?.user_metadata.full_name}!`;
      },
      error: (err) => {
        setLoading(false);
        return `Erro: ${err.message}`;
      },
    });
  }
  return (
    <main className="min-h-screen py-10 bg-bg text-text selection:bg-accent/30 font-sans relative flex items-center justify-center overflow-hidden">
      <div className="bg-noise absolute inset-0 pointer-events-none" />
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-250 h-150 bg-accent/15 blur-[120px] rounded-full pointer-events-none" />

      <section className="w-full max-w-110 px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-text-muted mb-4 block">
            Architecting Commerce
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-text mb-3">
            Crie sua conta
          </h1>
          <p className="text-text-secondary text-sm">
            Acesse seu dashboard empresarial e comece agora.
          </p>
        </div>

        <div className="p-10 rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-b from-accent/5 to-transparent pointer-events-none" />

          <form className="space-y-6 relative z-10" onSubmit={handleRegister}>
            {/* Feedback de Erro/Sucesso */}
            {message.content && (
              <div
                className={`text-xs p-3 rounded-lg border ${message.type === "error" ? "bg-danger/10 border-danger/20 text-danger" : "bg-success/10 border-success/20 text-success"}`}
              >
                {message.content}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">
                Nome
              </label>
              <div className="relative">
                <UserPlusIcon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full bg-bg border border-border rounded-xl py-4 pl-11 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted text-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">
                Email
              </label>
              <div className="relative">
                <EnvelopeSimpleIcon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="w-full bg-bg border border-border rounded-xl py-4 pl-11 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted text-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">
                Senha
              </label>
              <div className="relative">
                <LockSimpleIcon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-bg border border-border rounded-xl py-4 pl-11 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted text-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-text-muted ml-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <LockSimpleIcon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-bg border border-border rounded-xl py-4 pl-11 pr-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-muted text-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl font-bold text-sm bg-linear-to-r from-[#C084FC] to-accent text-white hover:brightness-110 shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Criando..." : "Crie minha lanchonete agora"}
              {!loading && (
                <ArrowRightIcon
                  size={18}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-text-secondary">
            Já tem uma conta?{" "}
            <a
              href="/login"
              className="text-accent font-bold hover:text-accent-hover transition-colors"
            >
              Entrar
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
