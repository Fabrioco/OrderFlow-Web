"use client";

import { useEffect, useRef, useState } from "react";

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false); // ref em vez de state — sem re-render
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function init() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/new-order.mp3");
      audioRef.current.volume = 1;
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("sound_enabled");
    if (saved === "true") {
      init();
      setEnabled(true);
    }
    setLoaded(true);
  }, []);

  // Banner de desbloqueio — clique obrigatório pelo browser
  async function unlock() {
    init();
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      unlockedRef.current = true;
    } catch (err) {
      console.warn("Erro ao desbloquear:", err);
    }
  }

  // Botão "Ativar som" — primeira ativação
  async function enable() {
    init();
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      unlockedRef.current = true;
      setEnabled(true);
      localStorage.setItem("sound_enabled", "true");
    } catch (err) {
      console.warn("Não foi possível ativar o áudio:", err);
    }
  }

  async function play(times: number = 3) {
    if (!enabled || !unlockedRef.current || !audioRef.current) return;
    try {
      for (let i = 0; i < times; i++) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        await new Promise<void>((resolve) => {
          audioRef.current!.onended = () => resolve();
          // fallback caso onended não dispare
          setTimeout(resolve, 3000);
        });
      }
    } catch (err) {
      console.warn("Erro ao tocar áudio:", err);
    }
  }

  // unlocked como estado derivado do ref pra controlar o banner
  const [unlocked, setUnlockedState] = useState(false);
  const originalUnlock = unlock;
  async function unlockAndSync() {
    await originalUnlock();
    setUnlockedState(unlockedRef.current);
  }
  async function enableAndSync() {
    await enable();
    setUnlockedState(unlockedRef.current);
  }

  return {
    play,
    enable: enableAndSync,
    unlock: unlockAndSync,
    enabled,
    unlocked,
    loaded,
  };
}
