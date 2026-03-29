src/
├── app/
│   ├── globals.css
│   ├── layout.tsx                        ← root layout + ThemeProvider
│   ├── page.tsx                          ← landing page
│   │
│   ├── login/
│   │   └── page.tsx                      ← login (email + senha)
│   │
│   ├── cadastro/
│   │   └── page.tsx                      ← cadastro da lanchonete (self-service)
│   │
│   ├── [slug]/                           ← área pública da lanchonete
│   │   ├── layout.tsx                    ← resolve tenant pelo slug
│   │   ├── page.tsx                      ← cardápio + fazer pedido
│   │   └── pedido/
│   │       └── [id]/
│   │           └── page.tsx              ← acompanhamento do pedido
│   │
│   ├── [slug]/painel/                    ← área do dono/staff (protegida)
│   │   ├── layout.tsx                    ← verifica auth + role
│   │   ├── page.tsx                      ← redirect → /pedidos
│   │   ├── pedidos/
│   │   │   └── page.tsx                  ← fila ao vivo
│   │   ├── cardapio/
│   │   │   └── page.tsx                  ← produtos + adicionais
│   │   └── configuracoes/
│   │       └── page.tsx                  ← dados da lanchonete + MP Connect
│   │
│   ├── admin/                            ← área do dono do SaaS (você)
│   │   ├── layout.tsx                    ← verifica role = admin
│   │   ├── page.tsx                      ← dashboard geral
│   │   ├── tenants/
│   │   │   └── page.tsx                  ← lista de lanchonetes
│   │   └── receita/
│   │       └── page.tsx                  ← MRR, pedidos, crescimento
│   │
│   └── api/
│       ├── auth/
│       │   └── callback/route.ts         ← callback OAuth Supabase
│       └── mp/
│           ├── callback/route.ts         ← callback OAuth MP Connect
│           └── webhook/route.ts          ← webhook de pagamentos MP
│
├── components/
│   ├── ThemeProvider.tsx
│   ├── ui/                               ← componentes genéricos
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Toast.tsx
│   └── painel/                           ← componentes do painel
│       ├── OrderCard.tsx
│       ├── OrderStepper.tsx
│       └── Sidebar.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTenant.ts
│   ├── useOrders.ts
│   └── useToast.ts
│
├── types/
│   └── supabase.ts
│
└── utils/
    └── supabase/
        ├── client.ts
        ├── server.ts
        └── middleware.ts
