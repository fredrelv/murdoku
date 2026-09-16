# Murdoku

Um jogo de lógica que cruza Sudoku com um caso de assassinato: em vez de
números, colocas suspeitos numa grelha (uma pessoa por linha e por coluna),
lês pistas para eliminar hipóteses, e no final apontas o assassino — quem
ficou sozinho com a vítima na mesma divisão.

- **Web**: Next.js (App Router, TypeScript), pronto a implantar na Vercel.
- **Base de dados**: Postgres (Vercel Postgres / Neon) via Prisma.
- **Autenticação**: sessões próprias (cookie httpOnly + hash em BD). Não há
  registo público — só um administrador cria contas de jogadores.
- **Android**: [Capacitor](https://capacitorjs.com/) a envolver a mesma app
  web numa WebView nativa, ligada à instância publicada na Vercel.
- **Motor do jogo**: gerador procedural de casos (`src/engine`), 100% lógica
  pura testada com Vitest — gera a grelha, os suspeitos, as pistas e garante
  que a solução é sempre única e resolúvel só por dedução (sem adivinhar).

## Estrutura

```
src/
  engine/        motor do puzzle (gerador, solucionador, pistas) — sem DB/UI
  server/        Prisma, autenticação, serviços, DTOs, validação (zod)
  app/           páginas Next.js (jogo, admin, login) + rotas de API
  components/    componentes React (jogo, admin, UI partilhada)
prisma/          schema, seed do admin inicial
scripts/         CLI para gerar casos em lote fora de um pedido HTTP
mobile/www/      shell mínimo offline para o wrapper Android
android/         projeto Android gerado pelo Capacitor (committed)
tests/engine/    testes unitários/propriedade do motor (93%+ cobertura)
tests/server/    testes de integração com BD real (ver tests/server/README.md)
```

## Desenvolvimento local

```bash
npm install
cp .env.example .env   # preenche DATABASE_URL com um Postgres teu
npx prisma migrate dev --name init   # cria a primeira migração
npm run db:seed        # cria o admin inicial (usa ADMIN_USERNAME/PASSWORD do .env)
npm run dev
```

Abre `http://localhost:3000`, inicia sessão com o admin criado pelo seed
(vai pedir para mudares a palavra-passe no primeiro login), e em
**Casos** → gera alguns casos e publica-os para poderes jogar.

### Testes

```bash
npm test              # motor do jogo (não precisa de BD)
npm run test:coverage # com relatório de cobertura (limite: 80%)
npm run typecheck
npm run lint
```

Os testes de `tests/server/` (autenticação, CRUD de admin, ciclo de vida de
tentativas) precisam de um Postgres real — ver `tests/server/README.md`.
**Não foram verificados neste ambiente de desenvolvimento** (sem acesso a
Postgres); correm automaticamente no CI (`.github/workflows/ci.yml`), que
sobe um container Postgres descartável.

## Deploy na Vercel

1. Cria um projeto na Vercel a partir deste repositório.
2. Adiciona um Postgres (Vercel Marketplace → Neon, ou liga um Neon teu) e
   copia a `DATABASE_URL` (usa a connection string com pooling) para as
   env vars do projeto.
3. Define `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ALLOWED_ORIGINS` (o domínio
   `https://o-teu-projeto.vercel.app`) nas env vars.
4. Depois do primeiro deploy, corre a migração e o seed uma vez contra a
   BD de produção (localmente, com `DATABASE_URL` apontado para lá):
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Muda a palavra-passe do admin no primeiro login.

O build da Vercel corre `prisma generate && next build` automaticamente
(script `build` do `package.json`).

## App Android

O Android **não** é uma app separada — é a mesma app web dentro de uma
WebView (Capacitor), a apontar para o URL de produção na Vercel. Isto
significa que a app precisa de ligação à internet (há um ecrã simples de
"sem ligação" em `mobile/www/index.html`) e que atualizar o site atualiza
a app instantaneamente, sem re-publicar na Play Store.

```bash
# depois de teres um deploy na Vercel:
export MURDOKU_MOBILE_URL="https://o-teu-projeto.vercel.app"
npm run mobile:sync   # copia a config para android/
npm run mobile:open   # abre o projeto no Android Studio
```

A partir do Android Studio: compila, testa num emulador/dispositivo, e
gera o AAB assinado para a Play Store (`Build > Generate Signed Bundle`).
Precisas do Android Studio / SDK instalado — não foi possível compilar o
APK/AAB neste ambiente (sem SDK Android disponível), mas o projeto
`android/` está completo e pronto a abrir.

## Gerar casos em massa

```bash
npx tsx scripts/generate-cases.ts --count 20 --difficulty EASY --size 5
npx tsx scripts/generate-cases.ts --count 10 --difficulty MEDIUM --persist
```

Sem `--persist` só mostra uma pré-visualização em ASCII (útil para avaliar
qualidade/dificuldade). Com `--persist`, grava os casos na BD como
rascunhos (`DRAFT`) — publica-os depois no painel de admin.

## Limitações conhecidas / próximos passos

- **Testes de integração do servidor não verificados aqui** — ver acima.
  Antes de ires para produção, corre-os contra uma BD real (localmente ou
  no CI) e confirma a matriz de autorização admin/jogador.
- **Sem histórico de migrações commitado** — corre
  `npx prisma migrate dev --name init` contra a tua primeira BD real para
  criar `prisma/migrations/`, e comita-o.
- **Vulnerabilidades de `npm audit`** em `prisma` (driver mysql2 que nunca
  usamos, só Postgres) e `@capacitor/cli` (dependência `xcode`, só usada
  para build iOS que não fazemos) — ambas são apenas ferramentas de
  desenvolvimento, nunca corem no runtime de produção (funções serverless
  da Vercel ou na WebView Android), mas vale a pena atualizar quando
  saírem versões estáveis sem a vulnerabilidade.
- **Dificuldade só EASY/MEDIUM** — o solucionador dedutivo cobre as regras
  de nível 1 e 2 (pistas diretas + consistência de arco); o nível "HARD"
  do plano original (com contagens de ocupação de divisões e um passo de
  suposição limitada) ainda não está implementado.
- **Sem sistema de contas de convidado nem recuperação de password por
  email** — de propósito: só o admin cria/repõe contas.
