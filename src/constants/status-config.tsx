import { OrderStatus } from "@/types/supabase";
import {
  CheckCircleIcon,
  ClockIcon,
  MopedFrontIcon,
  PackageIcon,
} from "@phosphor-icons/react";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: any; color: string }
> = {
  pending: {
    label: "Aguardando Confirmação",
    icon: ClockIcon,
    color: "text-amber-400",
  },
  accepted: {
    label: "Pedido Aceito",
    icon: CheckCircleIcon,
    color: "text-blue-400",
  },
  preparing: {
    label: "Na Cozinha",
    icon: PackageIcon,
    color: "text-purple-400",
  },
  out_for_delivery: {
    label: "Saiu para Entrega",
    icon: MopedFrontIcon,
    color: "text-menu-accent",
  },
  delivered: {
    label: "Entregue",
    icon: CheckCircleIcon,
    color: "text-green-400",
  },
  cancelled: {
    label: "Cancelado",
    icon: CheckCircleIcon,
    color: "text-red-400",
  },
};
