# 05. Segurança

## Autenticação
A autenticação é gerida pelo **Supabase Auth**. Apenas usuários autenticados podem acessar as rotas internas da aplicação.

## Row Level Security (RLS)
O projeto implementa políticas rigorosas de RLS para garantir que os dados sejam acessados apenas por quem tem permissão.

### Políticas de Exemplo:

#### Perfis
- **Select**: Permitido para todos os usuários autenticados.
- **Update**: Permitido apenas para o próprio usuário ou para Administradores.
- **Insert**: Geralmente realizado via trigger `handle_new_user` que roda com `SECURITY DEFINER`.

#### Avisos
- **Select**: Todos os autenticados.
- **Insert**: Todos os autenticados (ou restrito a quem tem `acesso_avisos`).
- **Update/Delete**: Apenas o autor do aviso ou um Administrador.

#### Equipes
- **Select**: Todos os autenticados.
- **All (Admin)**: Apenas usuários onde `admin_check() = true`.

## Funções de Database (RPC)
- `admin_check()`: Função auxiliar no PostgreSQL para verificar se o usuário atual (`auth.uid()`) é um administrador na tabela `perfis`.
