"use client";

import { useEffect, useState } from "react";
import { X, DeviceMobile, DownloadSimple } from "@phosphor-icons/react";

// Salva no localStorage se o usuário dispensou o banner
const DISMISSED_KEY = "orderflow:pwa-banner-dismissed";

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Se o usuário já dispensou, não mostra mais
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Se já está instalado como PWA (rodando em standalone), não mostra
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Captura o evento antes que o browser mostre o prompt nativo
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-menu-surface border border-[#D2BBFF]/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4">
        {/* Ícone */}
        <div className="w-11 h-11 rounded-xl bg-menu-accent/10 flex items-center justify-center shrink-0">
          <DeviceMobile
            size={22}
            weight="duotone"
            className="text-menu-accent"
          />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-menu-text font-black text-sm uppercase tracking-tight italic">
            Instalar app
          </p>
          <p className="text-menu-text-secondary text-xs mt-0.5 leading-relaxed">
            Adicione o painel na tela inicial para acesso rápido.
          </p>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex items-center gap-1.5 px-3 py-2 bg-menu-accent text-menu-accent-on text-xs font-black rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <DownloadSimple size={14} weight="bold" />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center text-menu-text-secondary hover:text-menu-text hover:bg-[#2A2A2A] rounded-full transition-all"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
