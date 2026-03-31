"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EnvelopeSimpleIcon,
  LockSimpleIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const promise = async () => {
      // 1. Autenticação básica
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Usuário não encontrado.");

      const { data: tenantData, error } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", authData.user.id)
        .single();

      if (error) throw new Error(error.message);

      const { data: tenantPublicData, error: tenantPublicError } =
        await supabase
          .from("tenants")
          .select("*")
          .eq("id", tenantData?.tenant_id)
          .single();

      if (tenantPublicError) throw new Error(tenantPublicError.message);

      return { tenantPublicData, authData };
    };

    toast.promise(promise(), {
      loading: "Autenticando e localizando sua loja...",
      success: (data) => {
        setLoading(false);
        // Redirecionamento dinâmico usando o slug recuperado
        router.push(`/${data.tenantPublicData.slug}/painel/pedidos`);
        return `Bem-vindo de volta! ${data.authData.user.user_metadata.full_name}`;
      },
      error: (err) => {
        setLoading(false);
        return `${err.message}`;
      },
    });
  }

  return (
    <main className="min-h-screen bg-bg text-text selection:bg-accent/30 font-sans relative flex items-center justify-center p-6">
      {/* BACKGROUND DECORATION (Igual a Home e Register) */}
      <div className="bg-noise pointer-events-none" />
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* BACK BUTTON */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-8 group"
        >
          <CaretLeftIcon
            size={16}
            weight="bold"
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Voltar para Home
          </span>
        </Link>

        {/* LOGIN CARD */}
        <div className="p-8 md:p-10 rounded-3xl border border-border bg-surface shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/40 to-transparent" />

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-text-secondary text-sm">
              Acesse sua conta para gerenciar seus pedidos.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                E-mail Profissional
              </label>
              <div className="relative group">
                <EnvelopeSimpleIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="exemplo@orderflow.com"
                  className="w-full bg-surface-alt border border-border rounded-xl py-4 pl-12 pr-4 text-sm outline-hidden focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                  Senha
                </label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-accent hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative group">
                <LockSimpleIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors"
                />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface-alt border border-border rounded-xl py-4 pl-12 pr-4 text-sm outline-hidden focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 rounded-xl font-bold bg-linear-to-r from-[#C084FC] to-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <CircleNotchIcon
                  size={20}
                  weight="bold"
                  className="animate-spin"
                />
              ) : (
                <>
                  Entrar no Painel
                  <ArrowRightIcon size={20} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* REGISTER LINK */}
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              Ainda não tem uma lanchonete?{" "}
              <Link
                href="/register"
                className="text-accent font-bold hover:underline"
              >
                Criar agora
              </Link>
            </p>
          </div>
        </div>

        {/* FOOTER TEXT */}
        <p className="text-center mt-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          © 2026 OrderFlow Architect • Infraestrutura Segura
        </p>
      </div>
    </main>
  );
}
