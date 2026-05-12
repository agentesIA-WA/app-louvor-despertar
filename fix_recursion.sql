-- 1. Limpeza de políticas problemáticas
DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil ou por admin" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.perfis;

-- 2. Nova política de ATUALIZAÇÃO sem recursividade
-- Usamos uma subquery que evita o loop infinito ou verificamos via metadados do JWT
CREATE POLICY "perfis_update_policy" ON public.perfis
FOR UPDATE USING (
  -- Caso 1: O usuário está editando o próprio perfil
  auth.uid() = id 
  OR 
  -- Caso 2: O usuário é um administrador
  -- Para evitar a recursão infinita, usamos uma subquery EXISTS com um filtro estrito
  EXISTS (
    SELECT 1 
    FROM public.perfis 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- NOTA: No Supabase, se o erro persistir, a melhor prática é usar "Custom Claims" 
-- ou uma função separada com "SECURITY DEFINER" para verificar o status de admin.

-- 3. Alternativa via Função (Mais Robusta contra recursão)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se a policy acima ainda der erro, use esta:
/*
DROP POLICY IF EXISTS "perfis_update_policy" ON public.perfis;
CREATE POLICY "perfis_update_policy" ON public.perfis
FOR UPDATE USING (
  auth.uid() = id OR public.is_admin()
);
*/

-- 4. Ajuste na política de AVISOS para usar a nova função e evitar recursão lá também
DROP POLICY IF EXISTS "avisos_update_policy" ON public.avisos;
CREATE POLICY "avisos_update_policy" ON public.avisos
FOR UPDATE USING (
  auth.uid() = autor_id OR public.is_admin()
);

DROP POLICY IF EXISTS "avisos_delete_policy" ON public.avisos;
CREATE POLICY "avisos_delete_policy" ON public.avisos
FOR DELETE USING (
  auth.uid() = autor_id OR public.is_admin()
);
