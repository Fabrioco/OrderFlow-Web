// Service Worker mínimo do OrderFlow Painel
// Não faz cache porque o painel precisa de dados em tempo real.
// A função dele aqui é só satisfazer o requisito de SW do navegador
// para liberar o prompt de instalação como app.

const SW_VERSION = "v1";

self.addEventListener("install", (event) => {
  // Ativa imediatamente sem esperar o SW anterior fechar
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Assume o controle de todas as abas abertas imediatamente
  event.waitUntil(self.clients.claim());
});

// Passa todas as requisições direto para a rede, sem interceptar.
// Isso garante que o painel sempre recebe dados frescos do Supabase.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
