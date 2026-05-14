# 04. Fluxos e Telas

## Rotas Principais

### 1. Login (`/login`)
- Autenticação via Email/Senha do Supabase.
- Redirecionamento após login bem-sucedido.

### 2. Dashboard (`/`)
- Visão geral do ministério.
- Próximas escalas.
- Avisos recentes.

### 3. Início (`/inicio`)
- Funciona como um painel alternativo ou Dashboard contendo resumo de escalas do mês, aniversariantes e atalhos rápidos.

### 4. Escalas (`/escalas`)
- Visualização de escalas por equipe.
- Criação e edição de escalas (apenas para usuários com permissão ou admins).

### 5. Repertório (`/repertorio`)
- Lista de músicas cadastradas.
- Busca por título ou artista.
- Links para cifras e vídeos.

### 6. Avisos (`/avisos`)
- Mural de comunicados importantes.
- Funcionalidade de criação de novos avisos.

### 7. Equipes (`/equipes`)
- Gestão das equipes do ministério (Ministério de Louvor, Mídia, Sonoplastia, Intercessão). Restrito a administradores.

### 8. Membros (`/membros`)
- Gestão de perfis de membros do sistema, atribuição de funções, edições de dados de contatos e concessão de níveis de acesso (Admin). Restrito a administradores.

### 9. Instituição (`/instituicao`)
- Configuração dos dados da instituição/igreja (Nome, endereço, dirigente principal). Restrito a administradores.

### 10. Perfil (`/perfil`)
- Edição de dados pessoais.
- Visualização de funções e acessos concedidos.

## Fluxo de Aprovação
O sistema verifica se o usuário possui um perfil criado e se tem permissões específicas (`acesso_escalas`, etc.) antes de permitir a interação com certas funcionalidades.
