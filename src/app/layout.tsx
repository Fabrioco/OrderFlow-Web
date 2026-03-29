import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Lanchonete App", template: "%s | Lanchonete App" },
  description: "Plataforma de pedidos para lanchonetes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body className="bg-bg text-text antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
