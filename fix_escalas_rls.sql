-- 1. Habilita RLS na tabela escala_membros
ALTER TABLE IF EXISTS public.escala_membros ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza de políticas antigas (para evitar conflitos)
DROP POLICY IF EXISTS "escala_membros_select_policy" ON public.escala_membros;
DROP POLICY IF EXISTS "escala_membros_insert_policy" ON public.escala_membros;
DROP POLICY IF EXISTS "escala_membros_delete_policy" ON public.escala_membros;

-- 3. Política de SELEÇÃO: Todos os usuários autenticados podem ver quem está na escala
CREATE POLICY "escala_membros_select_policy" ON public.escala_membros
FOR SELECT TO authenticated
USING (true);

-- 4. Política de INSERÇÃO: Apenas administradores podem adicionar membros às escalas
-- Usamos a função admin_check() que criamos anteriormente para segurança
CREATE POLICY "escala_membros_insert_policy" ON public.escala_membros
FOR INSERT TO authenticated
WITH CHECK (public.admin_check() = true);

-- 5. Política de EXCLUSÃO: Apenas administradores podem remover membros das escalas
CREATE POLICY "escala_membros_delete_policy" ON public.escala_membros
FOR DELETE TO authenticated
USING (public.admin_check() = true);

-- 6. Aproveitamos para aplicar a mesma lógica na tabela escala_musicas (setlist)
ALTER TABLE IF EXISTS public.escala_musicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escala_musicas_select_policy" ON public.escala_musicas;
DROP POLICY IF EXISTS "escala_musicas_insert_policy" ON public.escala_musicas;
DROP POLICY IF EXISTS "escala_musicas_delete_policy" ON public.escala_musicas;

CREATE POLICY "escala_musicas_select_policy" ON public.escala_musicas
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "escala_musicas_insert_policy" ON public.escala_musicas
FOR INSERT TO authenticated
WITH CHECK (public.admin_check() = true);

CREATE POLICY "escala_musicas_delete_policy" ON public.escala_musicas
FOR DELETE TO authenticated
USING (public.admin_check() = true);
