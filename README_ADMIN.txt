PAINEL ADMIN FUNCIONAL - RÔSOUZA ESTÉTICA

O pacote já vem com:
- login admin em login.html
- proteção do painel em index.html
- integração configurada com seu projeto Supabase
- leitura real de admin_users, appointments, services, customers, professionals, business_settings, business_hours, bloqueios, payments e campanhas
- ações reais no painel para:
  - confirmar / cancelar / marcar atendimento na agenda
  - criar/editar clientes
  - criar/editar/excluir serviços
  - criar/editar/excluir profissionais
  - salvar configurações do negócio e horários
- fallback local quando alguma tabela ainda não estiver acessível
- arquivo SQL de upgrade em sql/admin_panel_upgrade.sql

COMO USAR
1. Extraia a pasta.
2. Rode o arquivo sql/admin_panel_upgrade.sql no Supabase.
3. Abra primeiro login.html.
4. Entre com um usuário existente no Supabase Auth.
5. Esse usuário também precisa existir em admin_users com is_active = true.
6. Depois do login, o painel abre index.html.

IMPORTANTE
- A agenda lê preferencialmente a view admin_appointments_view.
- Se a view não existir, ele tenta cair para appointments puro.
- Mensagens e marketing ainda dependem da estrutura que existe hoje; sem integração externa, o módulo de mensagens usa os agendamentos pendentes como fila de contato.

SEGURANÇA
- O app.config.js ainda contém a anon key para facilitar a conexão.
- Depois de testar, gere uma nova anon key e atualize o arquivo.
- Nunca coloque a service role key no front-end.


CORREÇÃO DE LOGIN/SESSÃO
- Abra o painel por localhost/Live Server, não por file://
- Rode sql/fix_auth_policies.sql no Supabase se tiver 403 ou loop entre login e painel
- Este pacote corrige persistência de sessão e o loop entre login.html e index.html


NOVO FLUXO DE AVALIAÇÕES
- Rode também sql/customer_auth_reviews_upgrade.sql
- O painel agora libera a avaliação ao concluir o atendimento
- A cliente entra no site principal com Google e avalia pela própria área logada


Correção desta versão
- Rode sql/customer_reviews_site_admin_fix_v5.sql no Supabase para alinhar as avaliações do painel com o site principal.
