# 🫧 Caldeirão de Gaia (EstoqueCasa)

**Grimório & Inventário Alquímico da Casa** — Aplicação web/mobile-first (PWA) para controle de estoque doméstico compartilhado em tempo real, com estética de grimório alquímico (temas **Pergaminho Claro** e **Grimório Escuro**).

🔗 **Produção:** https://estoque-casa-five.vercel.app/

---

## ✨ Stack Tecnológica

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons
- **Design System & Temas:** Sistema de cores RGB centralizado em `src/styles/colors.css` e `src/lib/colors.js` integrado ao `tailwind.config.js`, suportando alternância instantânea entre **Tema Claro (Pergaminho)** e **Tema Escuro (Grimório Digital)**
- **Backend & Tempo Real:** **Supabase** — Auth (Email/Senha + Google OAuth), PostgreSQL (modelagem relacional 3FN), Realtime, Storage (fotos de produtos e avatares) e Edge Functions (`send-push`)
- **Inteligência Artificial:** **Google Gemini API (`gemini-3.8-flash`)** via Interactions API para leitura automática de Notas e Cupons Fiscais de supermercado
- **Catálogo & Código de Barras:** Catálogo global compartilhado (`products`) + integração com **OpenFoodFacts API** e leitor de câmera (`@zxing/browser`)
- **Testes Unitários:** **Vitest** + **jsdom** + **React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`)

---

## 🚀 Configuração do Ambiente

### 1. Banco de Dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o arquivo `supabase/schema.sql` completo (cria as tabelas `profiles`, `houses`, `house_members`, `categories`, `products`, `items`, `activity_log`, `push_subscriptions`, além das políticas RLS, triggers de histórico e RPCs).
3. Em **Database → Replication**, confirme que as tabelas `items`, `categories`, `house_members` e `activity_log` estão ativas na publicação `supabase_realtime`.

### 2. Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com as chaves do seu projeto:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_APP_URL=http://localhost:5173
VITE_VAPID_PUBLIC_KEY=sua-chave- publica-vapid
VITE_GEMINI_API_KEY=sua-chave-gemini-api
```

### 3. Instalação e Execução

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar suíte de testes unitários
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar build de produção
npm run build
```

---

## 🧪 Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Grimório Alquímico (Claro & Escuro)** | Interface temática com ilustrações SVG exclusivas por tipo de produto, medalhões de seção, gemas facetadas de status e suporte completo a tema claro e escuro. |
| **Pergaminho de Quantidade Inteligente** | Controle rápido por botões `−` e `+` ou edição inline direta clicando no número (sem caixas brancas ou setas nativas do navegador). Sincroniza automaticamente a quantidade com o status (`0` → *Em Falta*, `> 0` → *Em Estoque* / *Acabando*). |
| **Catálogo de Produtos do Banco** | Ao adicionar um item, permite escolher produtos já cadastrados na tabela `products` com 1 clique (**Produtos do Banco**) ou usar o autocomplete por nome/código de barras, evitando duplicações. |
| **Leitor de Nota Fiscal com IA** | Fotografe ou envie a foto de um cupom fiscal. O modelo `gemini-3.8-flash` extrai os itens e quantidades, soma automaticamente ao estoque dos itens já existentes no Caldeirão e permite cadastrar itens novos com 1 clique. |
| **Modo Mercado (Lista de Compras)** | Reúne automaticamente todos os itens **Em Falta** e **Acabando**. Ao marcar um item como comprado, ele volta para **Em Estoque** (ajustando a quantidade para `1` caso estivesse zerada). |
| **Scanner de Código de Barras** | Leitura via câmera com busca automática no banco local (`products`) e na API do **OpenFoodFacts**. |
| **Multi-Caldeirão & Convites** | Alterne entre diferentes casas no cabeçalho e compartilhe convites formatados com código e link direto (`https://estoque-casa-five.vercel.app/?invite=CODIGO`). |
| **Histórico & Notificações Push** | Registro automático de quem adicionou, editou, mudou status ou removeu itens (acessível pelo menu do perfil no topo) + alertas Web Push quando outro membro atualiza o estoque. |

---

## 📁 Estrutura do Projeto

```text
src/
├── components/
│   ├── house/
│   │   ├── ActivityLog.jsx          # Histórico de alterações da casa
│   │   ├── CreateHouseModal.jsx     # Criação de novo Caldeirão
│   │   ├── JoinHouseModal.jsx       # Entrada via código de convite
│   │   ├── MarketModal.jsx          # Modo Mercado (lista de compras)
│   │   └── SettingsModal.jsx        # Convite, membros e categorias
│   ├── items/
│   │   ├── __tests__/               # Testes unitários de componentes de itens
│   │   ├── BarcodeScanner.jsx       # Leitor de código de barras via câmera
│   │   ├── ImageUploader.jsx        # Upload de foto (câmera/galeria/drag-and-drop)
│   │   ├── ItemCard.jsx             # Carta mágica (grade) e linha (lista compacta)
│   │   ├── ItemFormModal.jsx        # Catálogo do banco + criação/edição de item
│   │   └── ReceiptScannerModal.jsx  # Leitura de Nota Fiscal com Gemini AI
│   ├── layout/
│   │   ├── Header.jsx               # Barra superior (Casa, Nota Fiscal, Mercado, Tema, Perfil/Histórico)
│   │   └── HouseSwitcher.jsx        # Seletor de Caldeirões
│   ├── ui/
│   │   ├── Avatar.jsx               # Avatar do usuário
│   │   ├── Badge.jsx                # Badges de status
│   │   ├── Button.jsx               # Botões padronizados
│   │   ├── GrimoireOrnaments.jsx    # SVGs do Caldeirão, Gemas, Trepadeiras e Orbe "+ Adicionar"
│   │   ├── Input.jsx                # Campos de texto padronizados
│   │   ├── Modal.jsx                # Modal responsivo (bottom-sheet mobile / centralizado desktop)
│   │   └── PushNotificationToggle.jsx
│   └── user/
│       └── ProfileModal.jsx         # Edição de nome e foto de perfil
├── contexts/
│   ├── AuthContext.jsx              # Sessão, login, cadastro e perfil do usuário
│   └── HouseContext.jsx             # Casas do usuário, membros e códigos de convite
├── hooks/
│   ├── __tests__/                   # Testes unitários dos hooks (Vitest + renderHook)
│   ├── useActivityLog.js            # Listagem + Realtime do histórico
│   ├── useCategories.js             # CRUD + Realtime de categorias
│   ├── useItems.js                  # CRUD de itens + vínculo com products + Realtime
│   ├── usePushNotifications.js      # Subscrição Web Push / Service Worker
│   └── useTheme.js                  # Alternância e persistência de tema (light / dark)
├── lib/
│   ├── __tests__/                   # Testes unitários das bibliotecas utilitárias
│   ├── colors.js                    # Paleta central RGB/RGBA para JS e SVGs
│   ├── defaults.js                  # Categorias padrão, ilustrações SVG e formatação de convites
│   ├── openFoodFacts.js             # Integração com a API OpenFoodFacts
│   ├── receiptScanner.js            # Integração com Gemini 3.8 Flash (Interactions API)
│   ├── storage.js                   # Compressão WebP e upload no Supabase Storage
│   ├── supabase.js                  # Cliente Supabase
│   └── utils.js                     # Funções utilitárias (cn, timeAgo, inviteCode, clipboard)
├── pages/
│   ├── AuthPage.jsx                 # Login / Cadastro / Google OAuth
│   ├── HomePage.jsx                 # Tela principal do Grimório
│   └── OnboardingPage.jsx           # Boas-vindas para criar ou entrar em um Caldeirão
├── styles/
│   └── colors.css                   # Fonte única de variáveis RGB e temas (Claro / Escuro)
└── test/
    └── setup.js                     # Setup global do Vitest + mocks do Supabase e localStorage
```

---

## 🛡️ Segurança e Banco de Dados (Supabase RLS)

O esquema em `supabase/schema.sql` implementa:
- **Modelagem Relacional (3FN):** Separação entre o catálogo global de produtos (`products`: nome, marca, código de barras, unidade padrão, imagem) e o estoque de cada casa (`items`: quantidade, unidade, status, categoria e notas).
- **Row Level Security (RLS):** Usuários autenticados só visualizam e modificam itens, categorias, membros e histórico das casas às quais pertencem (`get_my_house_ids()`).
- **Funções RPC Seguras (`SECURITY DEFINER`):**
  - `join_house(invite_code)`: Valida o código e adiciona o usuário como membro.
  - `regenerate_invite_code(house_id)`: Permite ao dono da casa gerar um novo código de 6 caracteres.
