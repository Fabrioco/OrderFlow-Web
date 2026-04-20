"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  EnvelopeSimpleIcon,
  ArrowRightIcon,
  CaretLeftIcon,
  CircleNotchIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPassword() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const promise = async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
    };

    toast.promise(promise(), {
      loading: "Enviando e-mail de recuperação...",
      success: () => {
        setLoading(false);
        setSent(true);
        return "E-mail enviado com sucesso!";
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

          {/* ── Estado: e-mail enviado ── */}
          {sent ? (
            <div className="text-center py-4 space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <CheckCircleIcon
                    size={32}
                    weight="duotone"
                    className="text-accent"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Verifique seu e-mail
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Enviamos um link de recuperação para{" "}
                  <span className="text-accent font-bold">{email}</span>. Acesse
                  sua caixa de entrada e clique no link para redefinir sua
                  senha.
                </p>
              </div>
              <p className="text-[11px] text-text-muted">
                Não recebeu?{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-accent font-bold hover:underline"
                >
                  Tentar novamente
                </button>
              </p>
            </div>
          ) : (
            /* ── Estado: formulário ── */
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  Recuperar senha
                </h1>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Informe o e-mail da sua conta e enviaremos um link para
                  redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-5">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-alt border border-border rounded-xl py-4 pl-12 pr-4 text-sm outline-hidden focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all"
                    />
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
                      Enviar link de recuperação
                      <ArrowRightIcon size={20} weight="bold" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-border text-center">
                <p className="text-sm text-text-secondary">
                  Lembrou a senha?{" "}
                  <Link
                    href="/login"
                    className="text-accent font-bold hover:underline"
                  >
                    Voltar para login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
          © 2026 OrderFlow Architect • Infraestrutura Segura
        </p>
      </div>
    </main>
  );
}
