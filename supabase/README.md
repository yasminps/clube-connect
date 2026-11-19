# Backend do Clube Connect

Esta etapa adiciona uma camada real de acesso ao Supabase. As telas existentes continuam usando a demonstração local. Nenhum registro de demonstração é importado para o PostgreSQL. O proxy reserva `/api/club/*` e `/conta/*` para futuras rotas autenticadas. A etapa entrega os clientes SSR e a verificação de sessão e papel, sem fluxo de login na interface.

## Conectar

1. Use Node.js 22.16 ou superior e instale as dependências com `npm ci`.
2. Crie um projeto Supabase dedicado. No workspace, copie `.env.example` para `.env.local`. Em **Connect**, copie a URL do projeto e a chave **Publishable**. Nenhum valor privilegiado é necessário para executar o aplicativo.
3. Em um projeto dedicado ou ambiente de homologação, revise e aplique os dois arquivos de `supabase/migrations/` em ordem pelo SQL Editor. Para usar a CLI, inicialize o diretório local com `supabase init`, execute `supabase link --project-ref <referência>`, revise `supabase db push --dry-run` e então aplique com `supabase db push`. Mantenha `club_private` fora da lista de esquemas expostos pela Data API.
4. Desative cadastros abertos e sessões anônimas no Auth para uso por convite. Crie a conta do primeiro administrador em **Authentication → Users**. No SQL Editor, execute o bloco abaixo após substituir o UUID pelo ID dessa conta. As demais contas precisam de perfil e papel; uma conta criada no Auth sozinha não recebe acesso ao clube.
5. Execute `npm run dev`. Novos handlers, Server Actions e componentes de servidor devem chamar os serviços em `src/lib/services`. Para autenticação futura em Route Handlers ou Server Actions, instancie o cliente com `createServerSupabase({ writable: true })`. Mantenha essas rotas sem cache compartilhado.

```sql
begin;
insert into public.club_settings (name) values ('Clube Connect');
insert into public.profiles (id, display_name)
values ('<uuid da conta criada no Auth>', 'Administração');
insert into public.user_roles (user_id, role)
values ('<mesmo uuid>', 'ADMIN');
commit;
```

Para regenerar as tipagens após mudanças, use `supabase gen types typescript --linked --schema public` e revise o resultado junto com os tipos auxiliares em `src/types/database.ts`.

## Relacionamentos e autorização

- Uma configuração singleton identifica o clube. Um perfil pertence a uma conta Auth e tem no máximo um papel. Um membro sempre pertence a uma unidade e pode existir sem conta. O vínculo com perfil é opcional e único. Um conselheiro pode atuar em várias unidades, e uma unidade pode ter vários conselheiros.
- **ADMIN** administra o clube, provisiona perfis e gerencia papéis, vínculos de conselheiros e vínculos entre contas e membros. **DIRECTOR** administra operações do clube, incluindo cadastros de membros e responsáveis, unidades, calendário, desafios, comunicados, presença e lançamentos. A direção consulta vínculos de conselheiros.
- **COUNSELOR** consulta os registros operacionais de suas unidades, faz chamada e envia participações em desafios publicados dentro do prazo. Dados cadastrais de responsáveis ficam com ADMIN e DIRECTOR. **MEMBER** consulta o próprio cadastro, frequência e pontos individuais, além dos conteúdos publicados aplicáveis e do ranking. As contas sem papel e visitantes não recebem dados do clube.
- O servidor verifica o JWT com `getClaims()` e consulta o papel gravado em PostgreSQL. As políticas RLS refazem a autorização a cada consulta, incluindo escopo de unidade e vínculo do membro. O proxy renova os cookies. Um papel removido deixa de conceder acesso mesmo antes de o token expirar.
- A ausência de unidade em evento indica abrangência geral. A unidade da presença é registrada a partir do cadastro no primeiro lançamento e preservada após transferências. O escopo do evento é fixado na criação. A chave composta impede duplicatas. A função `save_attendance` grava até 500 entradas por chamada atômica, com privilégios do usuário. A justificativa só se aplica a ausências. Registre o mínimo necessário, sem detalhes médicos ou familiares.
- A pontuação usa um histórico imutável. Cada lançamento aponta para um único destinatário, com origem, autor e data determinados pelo banco quando aplicável. Um estorno só é aceito uma vez por lançamento e deve cancelar seu valor integral no mesmo destinatário. Use `ADJUSTMENT` para ajustes adicionais. Aprovação de desafio é independente da concessão de pontos.
- O ranking retorna somente ID, nome, cor, saldo coletivo e posição das unidades ativas. A view usa acesso controlado às tabelas de origem para calcular o mesmo agregado para todos os usuários autorizados.
- Chaves estrangeiras preservam referências do histórico. A remoção de uma conta cujo perfil consta como autor pode ser bloqueada; revogue seu papel e desative a conta para preservar a trilha. Antes de usar dados reais, defina retenção, tratamento de pedidos de exclusão e revisão periódica dos acessos da liderança.

Referências oficiais: [SSR no Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [chaves](https://supabase.com/docs/guides/getting-started/api-keys).
