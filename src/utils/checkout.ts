export const getMPErrorMessage = (detail: string) => {
  const errors: Record<string, string> = {
    cc_rejected_high_risk:
      "Pagamento recusado por segurança. Tente outro cartão.",
    cc_rejected_insufficient_amount: "Saldo insuficiente.",
    cc_rejected_bad_filled_card_number: "Número do cartão inválido.",
  };
  return errors[detail] || "Pagamento recusado.";
};

export const validateCustomerForm = (form: any) => {
  if (!form.name.trim()) return "Informe seu nome";
  if (!form.phone.trim()) return "Informe seu WhatsApp";
  if (!form.neighborhood) return "Selecione o bairro";
  if (!form.payment_method) return "Selecione a forma de pagamento";
  return null; // Sem erros
};
