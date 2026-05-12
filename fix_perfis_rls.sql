-- Habilita Row Level Security na tabela de perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 1. Política de INSERÇÃO: Permite que qualquer usuário autenticado crie seu próprio perfil.
-- O campo 'id' deve ser igual ao UID do usuário no Supabase Auth.
CREATE POLICY "Permitir inserção do próprio perfil" ON public.perfis
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Política de SELEÇÃO: Permite que usuários autenticados leiam todos os perfis.
-- Necessário para listar membros, aniversariantes e verificar quem é admin.
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.perfis
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Política de ATUALIZAÇÃO: Permite que o usuário atualize seu próprio perfil
-- OU que um administrador atualize qualquer perfil.
CREATE POLICY "Permitir atualização do próprio perfil ou por admin" ON public.perfis
FOR UPDATE 
USING (
  auth.uid() = id 
  OR 
  (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
);

-- 4. Política de EXCLUSÃO: Apenas administradores podem excluir perfis.
CREATE POLICY "Permitir exclusão apenas por admins" ON public.perfis
FOR DELETE 
USING (
  (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
);
