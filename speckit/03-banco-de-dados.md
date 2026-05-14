# 03. Banco de Dados

O banco de dados utiliza o PostgreSQL gerenciado pelo Supabase. Abaixo estão as principais tabelas identificadas:

## Tabelas Principais

### `perfis` (Profiles)
Armazena informações detalhadas dos usuários.
- `id`: uuid (PK, FK para auth.users)
- `nome`: text
- `email_contato`: text
- `funcao`: text
- `telefone`: text
- `whatsapp`: text
- `aniversario_dia`: int
- `aniversario_mes`: int
- `is_admin`: boolean
- `acesso_escalas`: boolean
- `acesso_repertorio`: boolean
- `acesso_avisos`: boolean

### `equipes` (Teams)
Categorias de atuação no ministério.
- `id`: uuid (PK)
- `nome`: text (Unique)
- `descricao`: text
- `created_at`: timestamp

### `perfil_equipes`
Relacionamento Muitos-para-Muitos entre Membros e Equipes.
- `id`: uuid (PK)
- `perfil_id`: uuid (FK para perfis)
- `equipe_id`: uuid (FK para equipes)

### `escalas` (Schedules)
Gerenciamento de datas e serviços.
- `id`: uuid (PK)
- `equipe_id`: uuid (FK para equipes)

### `avisos` (Announcements)
- `id`: uuid (PK)
- `autor_id`: uuid (FK para perfis)
- `titulo`: text
- `conteudo`: text
- `created_at`: timestamp

### `repertorio` (Repertoire)
- `id`: uuid (PK)
- `titulo`: text
- `artista`: text
- `link_cifra`: text
- `link_video`: text

## Relacionamentos
- `perfis` tem relação de 1:1 com `auth.users`.
- `perfis` e `equipes` se relacionam via `perfil_equipes` (N:N).
- `escalas` pertencem a uma `equipe` (1:N).
- `avisos` são criados por um `perfil` (1:N).
