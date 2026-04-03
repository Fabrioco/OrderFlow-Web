import { BottomNav } from "@/components/[slug]/customers/BottomNav"; // ou onde você salvou

export default function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <>
      {children}
      {/* O Nav só existirá para as rotas de cliente */}
      <BottomNav slug={params.slug} hasActiveOrder={false} />
    </>
  );
}
