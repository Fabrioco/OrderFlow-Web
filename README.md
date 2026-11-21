# The Order Flow

**The Order Flow** é uma plataforma SaaS completa criada para **lanchonetes, hamburguerias e pequenos negócios de alimentação**. Ela digitaliza toda a operação de um estabelecimento — do cardápio visto pelo cliente até o controle de pedidos, pagamentos e métricas pelo dono — em um único sistema acessível pelo navegador, sem precisar instalar nada.

> **Em uma frase:** uma lanchonete cria sua conta, recebe seu próprio link/cardápio digital e passa a receber pedidos organizados, com pagamento integrado e painel de gestão em tempo real.

---

## 📌 Sumário

- [O problema que resolve](#-o-problema-que-resolve)
- [Para quem é](#-para-quem-é)
- [O que o sistema oferece](#-o-que-o-sistema-oferece)
- [Como resolve (fluxo de um pedido)](#-como-resolve-fluxo-de-um-pedido)
- [Como funciona por trás (arquitetura)](#-como-funciona-por-trás-arquitetura)
- [Planos e recursos](#-planos-e-recursos)
- [Segurança e privacidade](#-segurança-e-privacidade)
- [Instalação como aplicativo (PWA)](#-instalação-como-aplicativo-pwa)
- [Linguagens e tecnologias utilizadas](#-linguagens-e-tecnologias-utilizadas)
- [Contato e suporte](#-contato-e-suporte)

---

## 🎯 O problema que resolve

Negócios de alimentação de pequeno e médio porte costumam operar de forma manual ou fragmentada:

- Pedidos chegam por WhatsApp, telefone e balcão ao mesmo tempo, sem organização.
- Cardápios impressos ou em PDF ficam desatualizados e não permitem personalização (adicionais, observações).
- Não há controle claro do status de cada pedido (aceito, em preparo, saiu para entrega, entregue).
- Pagamentos são conferidos na mão, com risco de erro e atraso.
- O dono não tem visão de faturamento, pratos mais vendidos ou ticket médio.
- Clientes não acompanham o andamento do próprio pedido.

**The Order Flow** resolve tudo isso centralizando a operação em uma plataforma única, multitenante (cada lanchonete tem sua própria área isolada), com cardápio digital, fila de pedidos em tempo real, pagamentos integrados e métricas.

---

## 👥 Para quem é

- **Donos de lanchonetes, hamburguerias, cafeterias e similares** que querem profissionalizar a operação sem equipe de TI.
- **Clientes finais** que querem pedir de forma rápida, pelo celular, com acompanhamento em tempo real.
- **O administrador da plataforma** (o próprio criador do SaaS), que gerencia todos os estabelecimentos cadastrados, planos e receita.

O sistema é **multitenante**: uma única infraestrutura atende várias lanchonetes, e os dados de cada uma ficam isolados entre si.

---

## ✨ O que o sistema oferece

### Para o cliente final (quem pede)

- **Cardápio digital** com fotos, descrições, preços e disponibilidade atualizada em tempo real.
- **Personalização de produtos** com adicionais (extras) e observações.
- **Carrinho de compras** com cálculo automático de subtotal, adicionais e taxa de entrega por bairro.
- **Checkout simplificado** com coleta de nome, WhatsApp e endereço.
- **Múltiplas formas de pagamento**: PIX, cartão (na entrega) e dinheiro.
- **Acompanhamento do pedido** em tempo real, com status detalhado (pendente → aceito → em preparo → saiu para entrega → entregue).
- **Notificações sonoras** e visuais quando o status do pedido muda.

### Para o dono da lanchonete (painel de gestão)

- **Painel exclusivo** para sua lanchonete, acessado por login.
- **Gestão de cardápio**: adicionar/editar/remover produtos, categorias, adicionais e fotos; marcar itens como indisponíveis.
- **Fila de pedidos ao vivo**: novos pedidos aparecem instantaneamente, com alerta sonoro.
- **Controle de status** de cada pedido, do recebimento à entrega.
- **Configurações do estabelecimento**: nome, logo, cor principal, endereço, telefone, redes sociais, horário de funcionamento (aberto/fechado).
- **Zonas de entrega** com taxas por bairro.
- **Integração com MercadoPago** para receber pagamentos online (PIX e cartão) diretamente na sua conta.
- **Métricas básicas**: faturamento, pedidos e ticket médio.
- **Impressão de etiquetas/pedidos**.
- **Tema claro/escuro** para conforto visual.

### Para o administrador da plataforma (SaaS owner)

- **Dashboard geral** com total de estabelecimentos, pedidos ativos e MRR (receita mensal recorrente) estimado.
- **Lista de todos os tenants** com busca e filtro por plano e status (aberto/fechado).
- **Gestão de planos e bloqueios** (suspensão de contas).
- **Acesso restrito** apenas a administradores da plataforma.

### Infraestrutura e experiência

- **Multitenancy** com isolamento de dados por estabelecimento.
- **Autenticação segura** por e-mail e senha, com recuperação de senha.
- **Controle de acesso por papel** (owner, staff, admin da plataforma).
- **Planos de assinatura** com período de teste gratuito de 14 dias.
- **PWA (Progressive Web App)**: pode ser instalado no celular como se fosse um aplicativo.
- **Status da plataforma** público (health check dos serviços).

---

## 🔄 Como resolve: fluxo de um pedido

1. **Cadastro do estabelecimento.** O dono cria sua conta, informa os dados da lanchonete e recebe um link único (slug) para seu cardápio.
2. **Configuração.** Cadastra produtos, categorias, adicionais, zonas de entrega e conecta sua conta do MercadoPago.
3. **Cliente acessa o cardápio** pelo link (ou QR Code) no celular e monta o pedido, escolhendo adicionais e forma de pagamento.
4. **Checkout.** O cliente informa nome, WhatsApp e endereço; o sistema valida os dados e calcula o total (subtotal + adicionais + taxa de entrega).
5. **Pagamento.** Se for PIX ou cartão, o pagamento é processado pelo MercadoPago; se for dinheiro, o pedido é registrado como "pagar na entrega". A confirmação de pagamento chega via webhook.
6. **Notificação em tempo real.** O pedido aparece instantaneamente na fila do painel do dono, com alerta sonoro.
7. **Preparo e entrega.** O dono atualiza o status (aceito → em preparo → saiu para entrega → entregue). O cliente acompanha cada etapa.
8. **Métricas.** O dono consulta faturamento, pedidos e ticket médio; o administrador da plataforma acompanha todos os estabelecimentos e a receita recorrente.

---

## 🏗️ Como funciona por trás (arquitetura)

A plataforma é uma **aplicação web full-stack** com arquitetura multitenante:

- **Front-end e back-end no mesmo projeto**, usando o modelo de rotas do Next.js (App Router), com páginas renderizadas no servidor e no cliente conforme a necessidade.
- **Banco de dados PostgreSQL** (via Supabase) com tabelas para tenants, produtos, categorias, adicionais, pedidos, itens, clientes, zonas de entrega, pagamentos e assinaturas.
- **Isolamento por tenant** garantido por Row Level Security (RLS) no banco, além de filtros por slug nas consultas.
- **Autenticação** gerenciada pelo Supabase Auth, com sessões em cookies e middleware que protege rotas do painel e do admin.
- **Pagamentos** processados pelo MercadoPago, com callbacks e webhooks assíncronos para confirmação de pagamento e ativação de planos de assinatura.
- **E-mails** transacionais (formulário de contato) enviados via Resend.
- **Tempo real** para a fila de pedidos, usando a infraestrutura do Supabase.
- **PWA** com service worker para cache e instalação no dispositivo.
- **Tema claro/escuro** com persistência da preferência do usuário.

---

## 💳 Planos e recursos

O sistema possui níveis de plano que liberam funcionalidades progressivamente:

| Plano | Preço (mensal) | Recursos principais |
|-------|----------------|----------------------|
| **Free** | Gratuito (14 dias de teste) | Cardápio digital e painel de pedidos |
| **Essencial** | A partir de R$ 19,90 | Cardápio, painel e PDV |
| **Básico/Pro** | A partir de R$ 39,90 | Tudo do Essencial + relatórios, IA integrada e suporte prioritário |
| **Premium** | A partir de R$ 69,90 | Tudo do Pro + múltiplas unidades e gestão de funcionários |

> O período de teste gratuito de 14 dias não exige cartão de crédito. Após o trial, a conta é convertida automaticamente para o plano gratuito caso nenhuma assinatura seja ativada.

---

## 🔒 Segurança e privacidade

- **Criptografia em trânsito (TLS)** e em repouso no banco de dados.
- **Row Level Security (RLS)** no PostgreSQL, garantindo isolamento entre tenants.
- **Autenticação** com sessões seguras e controle de acesso por papel (owner, staff, admin).
- **Dados coletados apenas o necessário** para operar a plataforma (nome, e-mail, dados do negócio).
- **Compartilhamento apenas com parceiros essenciais** (Supabase para hospedagem do banco e MercadoPago para pagamentos), em conformidade com a LGPD.
- **Direitos do titular** (acesso, correção, exclusão, portabilidade) exercíveis por e-mail.

---

## 📱 Instalação como aplicativo (PWA)

A plataforma é um **Progressive Web App**: pode ser instalada no celular ou desktop diretamente pelo navegador, funcionando como um aplicativo nativo, com ícone na tela inicial e experiência em tela cheia. Não é necessário baixar pela loja de apps.

---

## 🛠️ Linguagens e tecnologias utilizadas

### Linguagens

| Linguagem | Uso |
|-----------|-----|
| **TypeScript** | Linguagem principal do projeto (front-end e back-end), tipagem estática sobre JavaScript |
| **JavaScript** | Service worker (PWA) e scripts auxiliares |
| **SQL** | Definição e consulta do banco de dados PostgreSQL (via Supabase) |
| **CSS** | Estilização, por meio do Tailwind CSS (utility-first) |
| **HTML / JSX** | Estrutura e componentes da interface (React) |

### Stack e bibliotecas

| Categoria | Tecnologias |
|-----------|-------------|
| **Framework web** | Next.js 15 (App Router) |
| **Biblioteca de UI** | React 19 |
| **Estilização** | Tailwind CSS 4 |
| **Banco de dados** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth (@supabase/ssr, @supabase/auth-helpers-nextjs) |
| **Pagamentos** | MercadoPago SDK (SDK React + SDK Node) |
| **E-mails** | Resend |
| **Ícones** | Heroicons, Phosphor Icons |
| **Datas** | date-fns |
| **Notificações (toast)** | Sonner |
| **Hospedagem (recomendada)** | Vercel |
| **Linting** | ESLint 9 |

---

## 📞 Contato e suporte

- **E-mail:** theorderflow.contato@gmail.com
- **Instagram:** @theorderflow.app
- **Status da plataforma:** disponível na própria página inicial (verificação em tempo real dos serviços)

---

© 2026 The Order Flow. Todos os direitos reservados.