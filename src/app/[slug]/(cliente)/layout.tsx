import { BottomNav } from "@/components/[slug]/customers/BottomNav"; // ou onde você salvou

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ClienteLayout({ children, params }: LayoutProps) {
    const { slug } = await params;
  return (
    <>
      {children}
      {/* O Nav só existirá para as rotas de cliente */}
      <BottomNav slug={slug} hasActiveOrder={false} />
    </>
  );
}
