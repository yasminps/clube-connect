# Clube Connect

Painel administrativo demonstrativo para gestão de um clube de adolescentes.

## Executar

Com Node.js 22.16+ e npm, execute na raiz do projeto:

```sh
npm install
npm run dev
```

Abra http://localhost:3000. Use `npm run typecheck` para verificar os tipos e `npm run build` para compilar a versão de produção.

## Estrutura

- `src/app/` reúne as nove rotas do App Router e o layout raiz.
- `src/components/` reúne o layout administrativo e os componentes comuns. Os componentes shadcn/ui ficam em `src/components/ui/`.
- `src/features/` organiza as telas e as interações dos módulos.
- `src/types/` define os modelos do clube e o contrato do repositório.
- `src/data/` contém a base fictícia e o histórico demonstrativo de pontos.
- `src/services/` contém o repositório local, a gestão de estado e as consultas compartilhadas.

A demonstração usa 19/11/2026 como data de referência para manter o calendário e os exemplos coerentes. Cadastros e alterações persistem no armazenamento local do navegador. Use somente dados fictícios.

A camada de backend usa clients SSR em `src/lib/supabase/`, serviços autenticados em `src/lib/services/` e migrations em `supabase/migrations/`. Consulte o [guia do backend](supabase/README.md) para configurar o Supabase e provisionar o primeiro administrador. As telas atuais seguem ligadas ao repositório de demonstração e o gráfico usa uma série histórica fictícia.
