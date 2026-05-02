import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";

// Viewport separado do metadata — obrigatório no Next.js 14+
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Cor da barra de status do Android quando instalado como PWA
  themeColor: "#131313",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "Painel — The Order Flow",
    description: "Gerencie seus pedidos em tempo real",
    // Impede que o Google indexe o painel dos lojistas
    robots: { index: false, follow: false },
    manifest: `/${slug}/painel/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "The Order Flow",
    },
    // Open Graph mínimo para quando o link for compartilhado
    openGraph: {
      title: "The Order Flow — Painel",
      description: "Gerencie seus pedidos em tempo real",
      type: "website",
    },
  };
}

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        Meta tags adicionais que o Next.js Metadata API não cobre nativamente.
        Necessárias para comportamento correto como PWA no iOS e Android.
      */}
      <head>
        {/* iOS: esconde a barra de Safari quando instalado na tela inicial */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Ícone para "Adicionar à tela inicial" no iOS */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        {/* Splash screen no iOS (opcional mas melhora a experiência) */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash.png"
          media="(device-width: 390px) and (device-height: 844px)"
        />

        {/* Cor da barra de título no Android Chrome */}
        <meta name="theme-color" content="#131313" />

        {/* Impede zoom no mobile — importante para o painel funcionar como app */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>

      {/* Registra o SW no cliente */}
      <PwaRegister />

      {children}
    </>
  );
}
