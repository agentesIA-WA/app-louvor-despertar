-- Este script corrige o erro de chave estrangeira ao atualizar ou excluir perfis.
-- Ele recria a restrição (constraint) na tabela 'avisos' permitindo que 
-- as alterações sejam propagadas (CASCADE).

-- 1. Remove a restrição existente
ALTER TABLE avisos 
DROP CONSTRAINT IF EXISTS avisos_autor_id_fkey;

-- 2. Recria a restrição com ON DELETE CASCADE e ON UPDATE CASCADE
ALTER TABLE avisos
ADD CONSTRAINT avisos_autor_id_fkey 
FOREIGN KEY (autor_id) 
REFERENCES perfis(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Opcional: Se você tiver outras tabelas que referenciam perfis, 
-- como 'escala_membros' ou 'indisponibilidade', você pode fazer o mesmo:

/*
ALTER TABLE escala_membros 
DROP CONSTRAINT IF EXISTS escala_membros_membro_id_fkey;

ALTER TABLE escala_membros
ADD CONSTRAINT escala_membros_membro_id_fkey 
FOREIGN KEY (membro_id) 
REFERENCES perfis(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

ALTER TABLE indisponibilidade 
DROP CONSTRAINT IF EXISTS indisponibilidade_membro_id_fkey;

ALTER TABLE indisponibilidade
ADD CONSTRAINT indisponibilidade_membro_id_fkey 
FOREIGN KEY (membro_id) 
REFERENCES perfis(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;
*/
