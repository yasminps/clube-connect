# Backend do Clube Connect

O acesso ao Clube Connect usa Supabase Auth. O painel de gestão exige ADMIN ou DIRECTOR. Unidades, membros, configuração do clube e relatório consultam o Supabase. Os módulos de demonstração ainda usam o armazenamento local. As áreas de conselheiro e membro consultam o Supabase com as permissões de cada conta.

## Conectar

1. Use Node.js 22.16 ou superior e instale as dependências com `npm ci`.
2. Crie um projeto Supabase dedicado. No workspace, copie `.env.example` para `.env.local`. Em **Connect**, copie a URL do projeto e a chave **Publishable**. Nenhum valor privilegiado é necessário para executar o aplicativo.
3. Em um projeto dedicado ou ambiente de homologação, revise e aplique os arquivos de `supabase/migrations/` em ordem pelo SQL Editor. Para usar a CLI, inicialize o diretório local com `supabase init`, execute `supabase link --project-ref <referência>`, revise `supabase db push --dry-run` e então aplique com `supabase db push`. Mantenha `club_private` fora da lista de esquemas expostos pela Data API.
4. Desative cadastros abertos e sessões anônimas no Auth para uso por convite. Crie a conta do primeiro administrador em **Authentication → Users**. No SQL Editor, execute o bloco abaixo após substituir o UUID pelo ID dessa conta. As demais contas precisam de perfil e papel; uma conta criada no Auth sozinha não recebe acesso ao clube.
5. Execute npm run dev e acesse /login. Novas operações protegidas devem usar requireClubAccess em src/lib/services/auth.ts e as políticas RLS.

```sql
begin;
insert into public.club_settings (name) values ('Bravos Guerreiros') on conflict (id) do nothing;
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
- **COUNSELOR** gerencia membros e consulta os registros operacionais de suas unidades, faz chamada e envia participações em desafios publicados dentro do prazo. Dados cadastrais de responsáveis ficam com ADMIN e DIRECTOR. **MEMBER** consulta o próprio cadastro, frequência e pontos individuais, além dos conteúdos publicados aplicáveis e do ranking. As contas sem papel e visitantes não recebem dados do clube.
- O servidor verifica o JWT com `getClaims()` e consulta o papel gravado em PostgreSQL. As políticas RLS refazem a autorização a cada consulta, incluindo escopo de unidade e vínculo do membro. O proxy renova os cookies. Um papel removido deixa de conceder acesso mesmo antes de o token expirar.
- A ausência de unidade em evento indica abrangência geral. A unidade da presença é registrada a partir do cadastro no primeiro lançamento e preservada após transferências. O escopo do evento é fixado na criação. A chave composta impede duplicatas. A função `save_attendance` grava até 500 entradas por chamada atômica, com privilégios do usuário. A justificativa só se aplica a ausências. Registre o mínimo necessário, sem detalhes médicos ou familiares.
- A pontuação usa um histórico imutável. Cada lançamento aponta para um único destinatário, com origem, autor e data determinados pelo banco quando aplicável. Um estorno só é aceito uma vez por lançamento e deve cancelar seu valor integral no mesmo destinatário. Use `ADJUSTMENT` para ajustes adicionais. Aprovação de desafio é independente da concessão de pontos.
- O ranking retorna somente ID, nome, cor, saldo coletivo e posição das unidades ativas. A view usa acesso controlado às tabelas de origem para calcular o mesmo agregado para todos os usuários autorizados.
- Chaves estrangeiras preservam referências do histórico. A remoção de uma conta cujo perfil consta como autor pode ser bloqueada; revogue seu papel e desative a conta para preservar a trilha. Antes de usar dados reais, defina retenção, tratamento de pedidos de exclusão e revisão periódica dos acessos da liderança.

Referências oficiais: [SSR no Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [chaves](https://supabase.com/docs/guides/getting-started/api-keys).

## Login e contas

- ADMIN entra em / e DIRECTOR em /diretoria. Ambos acessam os módulos de gestão.
- COUNSELOR entra em /conselheiro e vê as unidades vinculadas em unit_staff.
- MEMBER entra em /minha-area e vê presença e pontos do cadastro vinculado pelo campo members.user_id.
- Uma conta Auth autenticada sem papel em user_roles vê /sem-acesso. O servidor consulta a tabela de papéis em toda nova requisição que precisa de autorização.

Para criar outras contas, um operador autorizado usa **Authentication → Users → Add user → Create new user**. Use um endereço controlado pela pessoa e um método privado para a configuração inicial da senha. Depois, como ADMIN ou pelo SQL Editor com acesso ao projeto, crie public.profiles com o UUID da conta e atribua exatamente um papel em public.user_roles. Vincule conselheiros em public.unit_staff. Para membros, vincule o UUID ao registro existente em public.members.user_id. As instruções de bootstrap acima também atendem quem ainda precisa criar o primeiro ADMIN. Caso já exista, mantenha o registro existente.

Em **Authentication → Sign In / Providers**, mantenha o provedor Email habilitado e desative **Allow new users to sign up** e **Allow anonymous sign-ins**. O app oferece login e recuperação para contas existentes.

## Recuperação por e-mail

1. Configure CLUB_APP_URL em .env.local e no ambiente de deploy. Use a origem exata do app, como http://localhost:3000 para desenvolvimento ou seu domínio HTTPS em produção. Reinicie o app após modificar as variáveis.
2. Em **Authentication → URL Configuration**, indique a URL canônica em **Site URL** e adicione a URL inteira de recuperação à lista de **Redirect URLs** para cada ambiente, por exemplo http://localhost:3000/redefinir-senha.
3. Em **Authentication → Email Templates → Reset password**, ajuste o link do HTML para a linha abaixo. O formulário verifica o token apenas quando a pessoa envia a nova senha, e a sessão de recuperação não vai para os cookies do navegador.
4. Teste com uma conta autorizada. Configure SMTP próprio para envio de produção, conforme os limites do serviço hospedado.

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}">Redefinir senha</a>
```

Para validar o fluxo completo em homologação, entre com uma conta de cada papel, compare o destino com a lista acima e tente acessar diretamente a área de outro papel. Confirme que contas sem papel ficam bloqueadas e que, após sair, /membros volta para /login. No teste por e-mail, confirme que o link leva ao formulário, a senha antiga perde efeito e o link usado não é aceito novamente.
## Etapa 4

Em projetos que já receberam as duas primeiras migrations, execute apenas o arquivo 20261119000300_directory.sql no SQL Editor. Ele acrescenta a descrição das unidades, amplia o gerenciamento de membros para os conselheiros vinculados, habilita auditoria e configura Bravos Guerreiros quando o clube ainda usa o nome inicial Clube Connect. Nomes personalizados já existentes são preservados.

- ADMIN e DIRECTOR podem cadastrar, editar, ativar e desativar unidades e membros, além de vincular e remover conselheiros. O papel COUNSELOR precisa existir antes da vinculação. Alteração de papéis e vínculo de conta de membro continuam reservados a ADMIN.
- COUNSELOR só pode gerenciar membros nas unidades vinculadas. A transferência exige vínculo com as unidades de origem e destino. MEMBER consulta seu próprio cadastro e histórico, protegido pelas políticas RLS.
- Cadastros novos, transferências e reativações de membros exigem unidade ativa. A desativação preserva os vínculos e o histórico. O relatório inclui unidades inativas e usa apenas pontos coletivos.
- As operações em unidades, membros, conselheiros e configuração do clube registram o autor, o identificador, o horário e os campos afetados em public.directory_audit. O registro de auditoria evita copiar nomes ou outros valores pessoais do cadastro. ADMIN e DIRECTOR podem consultar a auditoria.
- Configurações grava o nome do clube em public.club_settings. O login consulta public.club_identity, que publica apenas o nome de exibição. Clube Connect permanece como nome da plataforma.
## Equipe de liderança

1. Aplique as migrations pendentes em ordem. Se a migration de símbolos 00400 já foi aplicada, rode apenas 20261119000500_leadership.sql no SQL Editor.
2. No Supabase, em **Settings → API Keys**, obtenha uma chave **Secret** (sb_secret_…). Salve em SUPABASE_SECRET_KEY no .env.local ou no ambiente privado do deploy. Use CLUB_APP_URL com a origem do app. Reinicie o servidor. A chave secreta fica exclusivamente no servidor, sem prefixo NEXT_PUBLIC_ e fora do Git.
3. Em **Authentication → URL Configuration**, adicione /aceitar-convite com a URL completa do app à lista de **Redirect URLs**, como http://localhost:3000/aceitar-convite.
4. Em **Authentication → Email Templates → Invite user**, use o link abaixo no modelo de convite. Configure SMTP próprio para entregar convites a endereços externos e mantenha o cadastro público desabilitado.
5. Entre como ADMIN ou DIRECTOR e abra **Equipe de liderança**. Selecione pelo menos uma unidade ativa ao convidar. A pessoa define a própria senha pelo link recebido. Convites pendentes podem ser reenviados. Se a pessoa confirmou o e-mail e ainda precisa definir uma senha, use o fluxo de recuperação.

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}">Aceitar convite</a>
```

A criação de conta Auth, perfil, papel COUNSELOR e vínculos iniciais ocorre na mesma transação de provisionamento. O registro temporário de convite é privado, vinculado ao e-mail e válido para uso único. Contas já cadastradas não recebem um novo papel pelo convite. Desativar acesso bloqueia o conselheiro na aplicação e nas políticas RLS sem remover os vínculos nem o histórico. Mudanças de acesso e vínculos ficam registradas em directory_audit.

Documentação oficial de [convites por e-mail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys) e [SMTP personalizado](https://supabase.com/docs/guides/auth/auth-smtp).