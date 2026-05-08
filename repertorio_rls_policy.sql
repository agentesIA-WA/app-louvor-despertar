-- Habilita Row Level Security e cria policy que permite UPDATE para usuários autenticados
-- ATENÇÃO: permite que qualquer usuário autenticado atualize qualquer registro.

ALTER TABLE IF EXISTS public.repertorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated update" ON public.repertorio
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Teste manual (copiar/colar no SQL Editor do Supabase):
-- SELECT * FROM public.repertorio WHERE id = 7;
-- UPDATE public.repertorio SET titulo = 'Teste' WHERE id = 7 RETURNING *;

-- Nota de segurança: se RLS for ativado aqui, outras operações (SELECT/INSERT/DELETE)
-- poderão precisar de policies adicionais se ainda não houver. Ajuste conforme necessário.
