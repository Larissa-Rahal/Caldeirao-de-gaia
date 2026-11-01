# 🏠 EstoqueCasa

App mobile-first para controlo de estoque doméstico compartilhado em tempo real.

## Stack
- **React 18** + Vite + Tailwind CSS
- **Supabase** — Auth (email+senha), PostgreSQL, Realtime
- PWA instalável no telemóvel

---

## Setup

### 1. Supabase

1. Cria um projeto em [supabase.com](https://supabase.com)
2. Vai a **SQL Editor** e executa o ficheiro `supabase/schema.sql` completo
3. Em **Database → Replication**, confirma que as tabelas `items`, `categories` e `house_members` estão activadas para Realtime

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preenche o `.env` com os valores do teu projeto (encontras em **Project Settings → API**):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=http://localhost:5173   # ou o teu domínio de produção
```

### 3. Instalar e correr

```bash
npm install
npm run dev
```

---

## Funcionalidades

| Feature | Detalhes |
|---|---|
| **Auth** | Email + Senha. Registo cria perfil automaticamente. |
| **Criar casa** | Ao criar, gera 8 categorias padrão e adiciona o criador como owner. |
| **Convite** | Código de 6 chars (ex: `AB12CD`) ou link `?invite=AB12CD`. O link preenche o código automaticamente após login. |
| **Multi-casa** | Seletor no header para alternar entre casas. |
| **Itens** | Toggle de status por toque no ponto colorido: ✅ Em Estoque → ⚠️ Acabando → ❌ Em Falta → volta ao início. |
| **Auditoria** | Cada item mostra quem alterou o estado por último e há quanto tempo. |
| **Realtime** | Alterações de qualquer membro aparecem imediatamente em todos os ecrãs. |
| **Filtros** | Por status e por categoria, com contadores. Pesquisa por nome. |
| **Categorias** | Criação e remoção pelo owner. Emoji personalizável. |
| **PWA** | Instalável como app nativa em iOS/Android. |

---

## Estrutura do projecto

```
src/
├── components/
│   ├── house/        # CreateHouseModal, SettingsModal
│   ├── items/        # ItemCard, ItemFormModal
│   ├── layout/       # Header, HouseSwitcher
│   └── ui/           # Button, Input, Modal, Badge, Avatar
├── contexts/
│   ├── AuthContext   # useAuth — sessão, signIn/signUp/signOut
│   └── HouseContext  # useHouse — casas, membros, convites
├── hooks/
│   ├── useItems      # CRUD itens + Realtime subscription
│   └── useCategories # CRUD categorias + Realtime
├── lib/
│   ├── supabase.js   # cliente Supabase
│   ├── defaults.js   # categorias padrão, STATUS_CONFIG, buildInviteUrl
│   └── utils.js      # cn, timeAgo, clipboard, getInitials
└── pages/
    ├── AuthPage       # Login / Registo
    ├── OnboardingPage # Criar ou entrar numa casa
    └── HomePage       # Ecrã principal com lista de itens
```

---

## Deploy (Vercel / Netlify)

1. Faz push para GitHub
2. Conecta o repositório ao Vercel/Netlify
3. Define as variáveis de ambiente no painel
4. Define `VITE_APP_URL` com o domínio de produção (para os links de convite)

---

## Supabase RLS

O schema inclui Row Level Security completo:
- Utilizadores só vêem dados das casas a que pertencem
- A função `join_house(code)` valida o código e adiciona o membro de forma segura
- O owner pode regenerar o código via `regenerate_invite_code(house_id)`
