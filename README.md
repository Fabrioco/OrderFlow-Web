# OrderFlow

**SaaS multi-tenant de gestão de pedidos em tempo real para lanchonetes, hamburguerias e pequenos negócios de alimentação.**

Cada estabelecimento tem seu próprio cardápio público, painel de controle e fila de pedidos ao vivo — tudo isolado por tenant, sem interferência entre clientes.

🔗 **[orderflow-coral.vercel.app](https://orderflow-coral.vercel.app)**

---

## Funcionalidades

**Para o cliente**

- Cardápio público acessível por link único (`/{slug}`)
- Adicionar itens ao carrinho e finalizar pedido
- Pagamento via PIX, dinheiro ou cartão (Mercado Pago)
- Acompanhamento do pedido em tempo real

**Para o dono da lanchonete**

- Painel de pedidos ao vivo com atualização em tempo real (Supabase Realtime)
- Fila de pedidos com controle de status: Pendente → Aceito → Preparo → Saiu para entrega → Entregue
- Notificação sonora ao receber novo pedido
- Acesso rápido ao WhatsApp do cliente
- Gerenciamento de cardápio e categorias
- Configuração de zonas de entrega com taxas por bairro
- Conexão com Mercado Pago via OAuth
- Painel instalável como app Android (PWA)

**Planos**
| Plano | Preço | Pedidos/dia | Unidades |
|---|---|---|---|
| Free | R$0 | 50 | 1 |
| Pro | R$29,90/mês | Ilimitado | 1 |
| Business | R$79,90/mês | Ilimitado | Múltiplas |

---

## Stack

| Camada         | Tecnologia                                     |
| -------------- | ---------------------------------------------- |
| Frontend       | Next.js 15 + TypeScript                        |
| Estilização    | Tailwind CSS                                   |
| Backend        | Next.js API Routes                             |
| Banco de dados | PostgreSQL (Supabase)                          |
| Autenticação   | Supabase Auth                                  |
| Realtime       | Supabase Realtime                              |
| Pagamentos     | Mercado Pago (OAuth Connect + Checkout Bricks) |
| Deploy         | Vercel                                         |

---

## Arquitetura

O sistema é multi-tenant — cada lanchonete é um tenant isolado com RLS (Row Level Security) no banco de dados.

```
/{slug}/              → cardápio público do estabelecimento
/{slug}/pedido/{id}   → acompanhamento do pedido pelo cliente
/{slug}/painel/       → painel do dono (protegido por auth)
/admin/               → painel SaaS (somente admin)
```

**Segurança por camada:**

- Anônimo: lê cardápio, cria pedido via backend, acompanha pedido pelo ID
- Dono (tenant member): lê e edita apenas os dados do próprio tenant
- Admin: acesso total à plataforma

---

## Rodando localmente

**Pré-requisitos:** Node.js 18+, conta no Supabase, conta no Mercado Pago (para pagamentos)

```bash
# Clone o repositório
git clone https://github.com/Fabrioco/OrderFlow-Web.git
cd OrderFlow-Web

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

Preencha o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MP_CLIENT_ID=seu_client_id_mercado_pago
MP_CLIENT_SECRET=seu_client_secret_mercado_pago
```

```bash
# Rode o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de ambiente

| Variável                        | Descrição                                   |
| ------------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave de serviço do Supabase (backend only) |
| `NEXT_PUBLIC_SITE_URL`          | URL base do projeto                         |
| `MP_CLIENT_ID`                  | Client ID do Mercado Pago                   |
| `MP_CLIENT_SECRET`              | Client Secret do Mercado Pago               |

---

## Licença

Projeto proprietário. Todos os direitos reservados.
