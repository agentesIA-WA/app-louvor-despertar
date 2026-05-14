# 03. Banco de Dados

O banco de dados utiliza o PostgreSQL gerenciado pelo Supabase. Abaixo estão as principais tabelas identificadas:

## Multi-Tenancy
Todas as tabelas do sistema (exceto a própria `instituicoes`) possuem uma coluna `instituicao_id` que garante o isolamento dos dados. Nenhuma informação de uma instituição é acessível por membros de outra.

## Tabelas Principais

### `instituicoes`
Entidade raiz que define uma igreja ou ministério.
- `id`: uuid (PK)
- `nome`: text
- `endereco_completo`: text
- `telefone_contato`: text
- `dirigente_principal`: text

### `perfis` (Profiles)
Armazena informações detalhadas dos usuários.
- `id`: uuid (PK, FK para auth.users)
- `instituicao_id`: uuid (FK para instituicoes)
- `nome`: text
- `email_contato`: text
- `is_admin`: boolean
- `acesso_escalas`: boolean
- `acesso_repertorio`: boolean
- `acesso_avisos`: boolean

### `equipes` (Teams)
- `id`: uuid (PK)
- `instituicao_id`: uuid (FK para instituicoes)
- `nome`: text
- `descricao`: text
- *Constraint: Única por (nome, instituicao_id)*

### `escalas` (Schedules)
- `id`: uuid (PK)
- `instituicao_id`: uuid (FK para instituicoes)
- `equipe_id`: uuid (FK para equipes)

### `avisos` (Announcements)
- `id`: uuid (PK)
- `instituicao_id`: uuid (FK para instituicoes)
- `autor_id`: uuid (FK para perfis)
- `titulo`: text
- `conteudo`: text

### `repertorio` (Repertoire)
- `id`: uuid (PK)
- `instituicao_id`: uuid (FK para instituicoes)
- `titulo`: text
- `artista`: text

## Relacionamentos
- `perfis` tem relação de 1:1 com `auth.users`.
- `perfis` e `equipes` se relacionam via `perfil_equipes` (N:N).
- `escalas` pertencem a uma `equipe` (1:N) e a uma `instituicao`.
- `avisos` são criados por um `perfil` e pertencem a uma `instituicao`.
