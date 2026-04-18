import {
  ChartBarIcon,
  SquaresFourIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import { FeatureCard } from "./FeatureCard";

export function FeaturesGrid() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto" id="features">
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={<TimerIcon size={24} weight="duotone" />}
          title="Real-time tracking"
          desc="Acompanhe cada etapa da produção instantaneamente. Do pedido à entrega final, sem delays."
        />
        <FeatureCard
          icon={<SquaresFourIcon size={24} weight="duotone" />}
          title="Menu management"
          desc="Edite preços, fotos e disponibilidade em segundos. Sincronização imediata em todos os canais."
        />
        <FeatureCard
          icon={<ChartBarIcon size={24} weight="duotone" />}
          title="Basic metrics"
          desc="Visualize faturamento, pratos mais vendidos e ticket médio através de relatórios editoriais impecáveis."
        />
      </div>
    </section>
  );
}
