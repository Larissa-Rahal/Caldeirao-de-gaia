# Caldeirão de Gaia — Aplicativo Android Nativo (Kotlin + Jetpack Compose)

Migração 100% em **Kotlin** do projeto **Caldeirão de Gaia** utilizando **Jetpack Compose**, arquitetura **MVVM**, **Coroutines + StateFlow**, **Supabase-kt**, **CameraX** e **Google ML Kit**.

## Estrutura do Projeto (`android-app/`)

- `app/src/main/java/com/caldeiraodegaia/app/`
  - `CaldeiraoApp.kt` & `MainActivity.kt` — Inicialização, Deep Links de convite (`?invite=CODE`) e navegação reativa (`Auth` $\rightarrow$ `Onboarding` $\rightarrow$ `Home`).
  - `di/AppContainer.kt` — Container de injeção de dependência que preserva os escopos globais equivalentes a `AuthContext` e `HouseContext`.
  - `core/util/` — `Defaults.kt` (categorias padrão, ciclo de status, arquétipos alquímicos) e `FormatUtils.kt` (`timeAgo`, `getInitials`, normalização NFD).
  - `data/model/DomainModels.kt` — DTOs `@Serializable` e entidade normalizada `InventoryItem`.
  - `data/local/UserPreferencesRepository.kt` — Persistência local com **Jetpack DataStore** (casa ativa, tema claro/escuro, visualização grade/lista e chave Gemini).
  - `data/remote/SupabaseModule.kt` — Cliente `supabase-kt` (`Auth`, `Postgrest`, `Realtime`, `Storage`) e `Ktor HttpClient`.
  - `data/repository/` — `AuthRepository.kt`, `HouseRepository.kt` e `InventoryRepository.kt` (CRUD, RPCs `join_house_by_code` e `regenerate_invite_code`, `upsertProduct`, updates otimistas e canais Realtime).
  - `hardware/` — `BarcodeLookupService.kt` (Supabase + Open Food Facts) e `ReceiptScannerManager.kt` (compressão EXIF nativa + **Google ML Kit Text Recognition OCR** + **Gemini 3.8 Flash**).
  - `ui/` — Tema Grimório (`GrimoireColors.kt`, `GrimoireTheme.kt`), ornamentos em `Canvas` (`GrimoireOrnaments.kt`), leitor CameraX (`BarcodeScannerView.kt`), telas (`AuthScreen.kt`, `OnboardingScreen.kt`, `HomeScreen.kt`) e modais (`HouseModals.kt`, `ItemAndScannerModals.kt`).

## Suíte de Testes de QA (`src/test` & `src/androidTest`)

- **Testes Unitários (JVM / JUnit 4):**
  - `core/util/FormatUtilsTest.kt` — Análise de valor limite (`timeAgo`), iniciais (`getInitials`), normalização NFD (`normalizeForMatch`), formatação numérica (`formatQuantity`) e cabeçalho de datas.
  - `core/util/DefaultsTest.kt` — Máquina de estados de `ItemStatus`, categorias padrão e particionamento de equivalência dos 11 arquétipos de `AlchemicalArchetype`.
  - `data/model/DomainModelsTest.kt` — Regras de domínio em `ItemRowDto.toNormalizedItem()` e `InventoryItem.renormalize()` (forçando `OUT_OF_STOCK` quando `qtyValue <= 0.0` e hierarquia de fallbacks).
  - `hardware/ReceiptScannerReconciliationTest.kt` — Reconciliação de cupons fiscais (`extractOutputText` nos 3 formatos da Interactions API, vínculo por ID e nome normalizado sem acento, soma de linhas duplicadas e fallback de categoria).
- **Testes Instrumentados de UI (Jetpack Compose):**
  - `ui/CaldeiraoUiQaTest.kt` — Validação de formulários (`AuthScreen`, `OnboardingScreen`), interação com o pergaminho de quantidade e gemas (`ItemCardComposable`) e filtragem do Modo Mercado (`MarketModal`).

## Configuração de Variáveis de Ambiente

O script `app/build.gradle.kts` lê automaticamente as variáveis do arquivo `../.env` na raiz do workspace ou de `android-app/local.properties`:

```properties
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
GEMINI_API_KEY=sua-chave-gemini-opcional
```

## Como Executar no Android Studio

1. Abra o **Android Studio Ladybug (ou superior)**.
2. Selecione **Open** e escolha a pasta `android-app`.
3. Aguarde a sincronização do Gradle (`Sync Project with Gradle Files`) e clique em **Run (`:app`)**.
4. Para rodar os testes unitários de QA: execute `./gradlew testDebugUnitTest` ou clique com o botão direito na pasta `app/src/test` $\rightarrow$ **Run 'Tests in...'**.
5. Para rodar os testes de UI Compose: execute `./gradlew connectedDebugAndroidTest` com um emulador ou dispositivo conectado.
