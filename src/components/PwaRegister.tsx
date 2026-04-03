"use client";

import { useEffect } from "react";

// Registra o service worker no lado do cliente.
// Colocado no layout do painel para registrar uma vez só.
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registrado:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Falha ao registrar service worker:", err);
      });
  }, []);

  // Componente invisível — só executa o registro
  return null;
}
