-- 1. Função atualizada para extrair TODOS os campos do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (
    id, 
    nome, 
    email_contato, 
    funcao, 
    telefone, 
    whatsapp, 
    aniversario_dia, 
    aniversario_mes, 
    is_admin, 
    acesso_escalas, 
    acesso_repertorio, 
    acesso_avisos
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', ''), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'funcao', ''),
    COALESCE(new.raw_user_meta_data->>'telefone', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp', ''),
    (new.raw_user_meta_data->>'aniversario_dia')::int,
    (new.raw_user_meta_data->>'aniversario_mes')::int,
    false, 
    false, 
    false, 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recria o Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Limpeza e Consolidação de RLS (Resolve erros 401, 403 e 500)
-- Removemos todas as policies existentes para evitar conflitos
DROP POLICY IF EXISTS "Perfis são visíveis por todos os autenticados" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Permitir inserção do próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.perfis;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil ou por admin" ON public.perfis;
DROP POLICY IF EXISTS "Permitir exclusão apenas por admins" ON public.perfis;

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Política de SELEÇÃO: Todos os autenticados podem ver perfis
CREATE POLICY "perfis_select_policy" ON public.perfis
FOR SELECT USING (auth.role() = 'authenticated');

-- Política de INSERÇÃO: Apenas via Trigger (SECURITY DEFINER) ou o próprio UID
-- Como o Trigger é security definer, ele ignora RLS. 
-- Mas deixamos por segurança se precisar de insert manual.
CREATE POLICY "perfis_insert_policy" ON public.perfis
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política de ATUALIZAÇÃO: Próprio usuário ou Admins
-- Para evitar recursão (erro 500), usamos uma técnica que não faz select na própria tabela dentro do USING
-- se possível, ou garantimos que o select seja simples.
CREATE POLICY "perfis_update_policy" ON public.perfis
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
);

-- 4. RLS para a tabela de AVISOS
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avisos são visíveis por todos" ON public.avisos;
CREATE POLICY "avisos_select_policy" ON public.avisos
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Avisos podem ser criados por autenticados" ON public.avisos;
CREATE POLICY "avisos_insert_policy" ON public.avisos
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Avisos podem ser editados pelo autor ou admin" ON public.avisos;
CREATE POLICY "avisos_update_policy" ON public.avisos
FOR UPDATE USING (
  auth.uid() = autor_id 
  OR 
  (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "Avisos podem ser excluídos pelo autor ou admin" ON public.avisos;
CREATE POLICY "avisos_delete_policy" ON public.avisos
FOR DELETE USING (
  auth.uid() = autor_id 
  OR 
  (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
);
