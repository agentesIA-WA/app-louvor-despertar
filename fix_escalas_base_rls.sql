-- 1. Habilita RLS na tabela escalas
ALTER TABLE IF EXISTS public.escalas ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza de políticas antigas
DROP POLICY IF EXISTS "escalas_select_policy" ON public.escalas;
DROP POLICY IF EXISTS "escalas_admin_all_policy" ON public.escalas;

-- 3. Política de SELEÇÃO: Todos os usuários autenticados podem ver as escalas
CREATE POLICY "escalas_select_policy" ON public.escalas
FOR SELECT TO authenticated
USING (true);

-- 4. Política para ADMINISTRADORES: Permite INSERT, UPDATE e DELETE
-- Usamos a função admin_check() que criamos anteriormente
CREATE POLICY "escalas_admin_all_policy" ON public.escalas
FOR ALL TO authenticated
USING (public.admin_check() = true)
WITH CHECK (public.admin_check() = true);
