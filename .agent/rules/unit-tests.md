---
description: Regras obrigatórias de testes unitários para o projeto Caldeirão de Gaia
globs: ["src/**/*.js", "src/**/*.jsx"]
alwaysApply: true
---

# Diretrizes de Testes Unitários (Caldeirão de Gaia)

## 1. Stack e Ambiente de Testes
- **Framework principal:** Vitest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) com ambiente `jsdom`.
- **Linguagem:** Os testes do frontend devem ser escritos exclusivamente em **JavaScript** (`.test.js` ou `.test.jsx`), seguindo o padrão do projeto em `src/`.
- **Exclusão de escopo:** O Vitest NÃO deve tentar rodar arquivos dentro de `supabase/functions/**` (que utilizam runtime Deno/TypeScript) nem arquivos SQL (`supabase/schema.sql`).

## 2. Isolamento e Mocks Obrigatórios
Nunca realize conexões reais com serviços externos durante os testes unitários:
- **Supabase (`src/lib/supabase.js`):** Sempre utilize `vi.mock('../lib/supabase')` (ou o caminho relativo equivalente) para simular operações de Auth (`supabase.auth`), Banco de Dados (`supabase.from().select/insert/update/delete`) e Storage (`supabase.storage`).
- **OpenFoodFacts (`src/lib/openFoodFacts.js`):** Faça mock de `global.fetch` usando `vi.spyOn(global, 'fetch')` ou `vi.fn()` para simular produtos encontrados, não encontrados e erros de rede.
- **APIs do Navegador:** Faça mock de `Notification`, `navigator.serviceWorker` e `localStorage` ao testar `src/hooks/usePushNotifications.js`, `src/hooks/useTheme.js` ou `src/components/items/BarcodeScanner.jsx`.
- **Contextos React:** Ao testar componentes ou hooks que dependam de `AuthContext.jsx` ou `HouseContext.jsx`, forneça um Provider mockado ou faça mock dos hooks de contexto.

## 3. O Que Deve Ser Testado
Sempre que criar ou modificar arquivos nas pastas abaixo, crie ou atualize o teste unitário correspondente:
1. **`src/lib/` (`utils.js`, `defaults.js`, `openFoodFacts.js`, `storage.js`):** Testar funções puras, formatações, retornos padrão e tratamento de erros.
2. **`src/hooks/` (`useItems.js`, `useCategories.js`, `useActivityLog.js`, `useTheme.js`, `usePushNotifications.js`):** Testar usando `renderHook` e `act`, cobrindo estados de carregamento (`loading`), sucesso, erro e atualização de estado.
3. **`src/components/` (`items/`, `house/`, `ui/`, `user/`, `layout/`):** Testar renderização condicional, abertura/fechamento de modais, envio de formulários e eventos de clique com `render`, `screen` e `fireEvent`.

## 4. Fluxo de Trabalho Obrigatório do Agente (Definition of Done)
- **No Implementation Plan:** Toda tarefa que crie ou altere lógica em `src/` DEVE incluir explicitamente no plano a etapa de criação/atualização do arquivo `.test.js` ou `.test.jsx`.
- **Execução no Terminal:** Antes de dar qualquer tarefa por concluída, o agente DEVE executar `npm test` (ou `npx vitest run`) no terminal.
- **Auto-correção:** Se algum teste falhar no terminal, analise o erro, corrija o código ou o mock e rode `npm test` novamente até que 100% da suíte passe.
