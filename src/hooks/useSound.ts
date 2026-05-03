"use client";

import { useEffect, useRef, useState } from "react";

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !loaded) return;
    // Desbloqueia o Audio na primeira interação após reload
    function unlock() {
      init();
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
        })
        .catch(() => {});
      window.removeEventListener("click", unlock);
    }
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, [enabled, loaded]);

  function init() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/new-order.mp3");
      audioRef.current.volume = 1;
    }
  }

  // Carrega preferência salva ao montar
  useEffect(() => {
    const saved = localStorage.getItem("sound_enabled");
    if (saved === "true") {
      init();
      setEnabled(true);
    }
    setLoaded(true);
  }, []);

  async function enable() {
    init();
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setEnabled(true);
      localStorage.setItem("sound_enabled", "true"); // ← salva
    } catch (err) {
      console.warn("Não foi possível ativar o áudio:", err);
    }
  }

  async function play(times: number = 3) {
    if (!enabled) return;
    try {
      init();
      for (let i = 0; i < times; i++) {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        await new Promise<void>((resolve) => {
          if (!audioRef.current) return resolve();
          audioRef.current.onended = () => resolve();
        });
      }
    } catch (err) {
      console.warn("Erro ao tocar áudio:", err);
    }
  }

  return { play, enable, enabled, loaded };
}
