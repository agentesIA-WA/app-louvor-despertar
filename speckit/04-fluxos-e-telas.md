# 04. Fluxos e Telas

## Rotas Principais

### 1. Login (`/login`)
- Autenticação via Email/Senha do Supabase.
- Redirecionamento após login bem-sucedido.

### 2. Dashboard (`/`)
- Visão geral do ministério.
- Próximas escalas.
- Avisos recentes.

### 3. Escalas (`/escalas`)
- Visualização de escalas por equipe.
- Criação e edição de escalas (apenas para usuários com permissão ou admins).

### 4. Repertório (`/repertorio`)
- Lista de músicas cadastradas.
- Busca por título ou artista.
- Links para cifras e vídeos.

### 5. Avisos (`/avisos`)
- Mural de comunicados importantes.
- Funcionalidade de criação de novos avisos.

### 6. Equipes (`/equipes`)
- Gestão das equipes do ministério (Ministério de Louvor, Mídia, Sonoplastia, Intercessão).

### 7. Perfil (`/perfil`)
- Edição de dados pessoais.
- Visualização de funções e acessos concedidos.

## Fluxo de Aprovação
O sistema verifica se o usuário possui um perfil criado e se tem permissões específicas (`acesso_escalas`, etc.) antes de permitir a interação com certas funcionalidades.
