import { BankIcon, CreditCardIcon, MoneyIcon } from "@phosphor-icons/react";

export const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> =
  {
    pix: {
      label: "PIX — na entrega",
      icon: <BankIcon size={20} weight="duotone" />,
    },
    cash: {
      label: "Dinheiro — na entrega",
      icon: <MoneyIcon size={20} weight="duotone" />,
    },
    credit_card: {
      label: "Cartão de Crédito",
      icon: <CreditCardIcon size={20} weight="duotone" />,
    },
    debit_card: {
      label: "Cartão de Débito",
      icon: <CreditCardIcon size={20} weight="duotone" />,
    },
  };
